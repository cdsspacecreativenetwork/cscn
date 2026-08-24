"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { parseFocusAreas } from "@/lib/cohort-mentorship";
import { db } from "@/lib/db";

export async function assignCohortMentorAction(formData: FormData) {
  const session = await requireAnyAdminPermission(["canManageLearners", "canManageInstructors"]);
  const cohortId = String(formData.get("cohortId") ?? "");
  const mentorId = String(formData.get("mentorId") ?? "");
  const role = String(formData.get("role") ?? "Cohort mentor").trim().slice(0, 80) || "Cohort mentor";
  const focusAreas = parseFocusAreas(formData.get("focusAreas"));
  if (!cohortId || !mentorId || focusAreas.length === 0) return { success: false as const, error: "Choose a cohort, mentor, and at least one focus area." };

  const [cohort, mentor] = await Promise.all([
    db.cohort.findUnique({ where: { id: cohortId }, select: { id: true, title: true, slug: true } }),
    db.user.findFirst({ where: { id: mentorId, mentorshipEligible: true, mentorshipEnabled: true, publicProfileStatus: "PUBLIC" }, select: { id: true, name: true, email: true } }),
  ]);
  if (!cohort) return { success: false as const, error: "Cohort not found." };
  if (!mentor) return { success: false as const, error: "Only approved, public mentors who are open for bookings can be assigned." };

  const assignment = await db.cohortMentorAssignment.upsert({
    where: { cohortId_mentorId: { cohortId, mentorId } },
    create: { cohortId, mentorId, role, focusAreas, status: "ACTIVE" },
    update: { role, focusAreas, status: "ACTIVE", assignedAt: new Date() },
    select: { id: true },
  });
  await Promise.all([
    createNotification(mentorId, "SYSTEM", "Cohort mentorship assignment", `You were assigned to ${cohort.title} as ${role}.`, { cohortId, assignmentId: assignment.id }, { actionLabel: "Open mentorship", actionUrl: "/dashboard/instructor/mentorship" }),
    createAuditLog({ actorId: session.user.id!, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.mentor_assigned", entityType: "COHORT_MENTOR_ASSIGNMENT", entityId: assignment.id, entityName: `${mentor.name ?? mentor.email} · ${cohort.title}`, metadata: { cohortId, mentorId, role, focusAreas } }),
  ]);
  revalidatePath("/dashboard/admin/mentorship");
  revalidatePath(`/dashboard/cohorts/${cohort.slug}`);
  return { success: true as const };
}

export async function setCohortMentorAssignmentStatusAction(assignmentId: string, status: "ACTIVE" | "PAUSED") {
  const session = await requireAnyAdminPermission(["canManageLearners", "canManageInstructors"]);
  const assignment = await db.cohortMentorAssignment.update({ where: { id: assignmentId }, data: { status }, select: { id: true, mentorId: true, cohort: { select: { slug: true, title: true } } } });
  await createAuditLog({ actorId: session.user.id!, actorName: session.user.name, actorEmail: session.user.email, action: status === "ACTIVE" ? "cohort.mentor_resumed" : "cohort.mentor_paused", entityType: "COHORT_MENTOR_ASSIGNMENT", entityId: assignment.id, entityName: assignment.cohort.title, metadata: { mentorId: assignment.mentorId, status } });
  revalidatePath("/dashboard/admin/mentorship");
  revalidatePath(`/dashboard/cohorts/${assignment.cohort.slug}`);
  return { success: true as const };
}
