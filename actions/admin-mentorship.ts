"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";
import { hasAnyAdminPermission } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { assertEmailVerifiedByUserId } from "@/lib/trust-gates";

async function requireMentorshipAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized." as const };
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: "Forbidden." as const };
  }
  if (
    !hasAnyAdminPermission(session.user, [
      "canManageInstructors",
      "canVerifyInstructors",
    ])
  ) {
    return { error: "You do not have permission to review mentorship applications." as const };
  }

  try {
    await assertEmailVerifiedByUserId(session.user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Verify your email before using this feature.",
    } as const;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function updateMentorshipApplicationReview(
  applicationId: string,
  status: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED",
  adminId: string,
  reviewNote: string | null
) {
  await db.$executeRaw`
    UPDATE "MentorshipApplication"
    SET
      "status" = ${status}::"MentorshipApplicationStatus",
      "reviewedById" = ${adminId},
      "reviewedAt" = NOW(),
      "reviewNote" = ${reviewNote},
      "updatedAt" = NOW()
    WHERE "id" = ${applicationId}
  `;
}

export async function approveMentorshipApplicationAction(formData: FormData) {
  const admin = await requireMentorshipAdmin();
  if ("error" in admin) return admin;

  const applicationId = requireString(formData, "applicationId");
  if (!applicationId) return { error: "Application is missing." };

  const application = await db.mentorshipApplication.findUnique({
    where: { id: applicationId },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          instructorProfileEnabled: true,
          instructorVerificationStatus: true,
        },
      },
    },
  });

  if (!application) return { error: "Application not found." };
  if (application.status !== "PENDING" && application.status !== "CHANGES_REQUESTED") {
    return { error: "This application is no longer pending review." };
  }
  if (!application.instructor.instructorProfileEnabled) {
    return { error: "Instructor profile is not active." };
  }
  if (application.instructor.instructorVerificationStatus !== "VERIFIED") {
    return { error: "Only verified instructors can be approved for mentorship." };
  }

  await updateMentorshipApplicationReview(
    application.id,
    "APPROVED",
    admin.id,
    requireString(formData, "reviewNote") || null
  );

  await db.$executeRaw`
    UPDATE "User"
    SET
      "mentorshipEligible" = TRUE,
      "mentorshipApprovedAt" = NOW(),
      "mentorshipBio" = COALESCE(${application.pitch}, "mentorshipBio"),
      "mentorshipTopics" = COALESCE(${JSON.stringify(application.topics ?? [])}::jsonb, "mentorshipTopics"),
      "mentorshipInstructions" = COALESCE(${application.instructions}, "mentorshipInstructions"),
      "mentorshipFree" = ${application.mentorshipFree},
      "mentorshipCurrency" = ${application.proposedCurrency},
      "mentorshipPrice" = ${application.mentorshipFree ? null : application.proposedPrice?.toString() ?? null}::numeric,
      "updatedAt" = NOW()
    WHERE "id" = ${application.instructorId}
  `;

  await createNotification(
    application.instructorId,
    "SYSTEM",
    "Mentorship application approved",
    "CSCN approved your mentorship application. Turn on mentorship and add availability windows to appear publicly.",
    { kind: "MENTORSHIP_APPLICATION_APPROVED", applicationId: application.id },
    {
      actionRequired: true,
      actionLabel: "Set availability",
      actionUrl: "/dashboard/instructor/mentorship",
    }
  );

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    action: "mentorship.application_approved",
    entityType: "MENTORSHIP_APPLICATION",
    entityId: application.id,
    entityName: application.instructor.name ?? application.instructor.email,
    metadata: { instructorId: application.instructorId },
  });

  revalidatePath("/dashboard/admin/mentorship");
  revalidatePath("/dashboard/instructor/mentorship");
  revalidatePath("/mentorship");
  return { success: "Mentorship application approved." };
}

export async function requestMentorshipApplicationChangesAction(formData: FormData) {
  const admin = await requireMentorshipAdmin();
  if ("error" in admin) return admin;

  const applicationId = requireString(formData, "applicationId");
  const reviewNote = requireString(formData, "reviewNote");
  if (!applicationId) return { error: "Application is missing." };
  if (!reviewNote) return { error: "Add feedback before requesting changes." };

  const existingApplication = await db.mentorshipApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      instructorId: true,
      instructor: { select: { name: true, email: true } },
    },
  });

  if (!existingApplication) return { error: "Application not found." };
  if (existingApplication.status !== "PENDING") {
    return { error: "Only pending applications can receive change requests." };
  }

  await updateMentorshipApplicationReview(existingApplication.id, "CHANGES_REQUESTED", admin.id, reviewNote);

  await createNotification(
    existingApplication.instructorId,
    "SYSTEM",
    "Mentorship application needs changes",
    reviewNote,
    { kind: "MENTORSHIP_APPLICATION_CHANGES", applicationId: existingApplication.id },
    {
      actionRequired: true,
      actionLabel: "Update application",
      actionUrl: "/dashboard/instructor/mentorship",
    }
  );

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    action: "mentorship.application_changes_requested",
    entityType: "MENTORSHIP_APPLICATION",
    entityId: existingApplication.id,
    entityName: existingApplication.instructor.name ?? existingApplication.instructor.email,
    metadata: { instructorId: existingApplication.instructorId, hasNote: true },
  });

  revalidatePath("/dashboard/admin/mentorship");
  revalidatePath("/dashboard/instructor/mentorship");
  return { success: "Changes requested." };
}

export async function rejectMentorshipApplicationAction(formData: FormData) {
  const admin = await requireMentorshipAdmin();
  if ("error" in admin) return admin;

  const applicationId = requireString(formData, "applicationId");
  const reviewNote = requireString(formData, "reviewNote");
  if (!applicationId) return { error: "Application is missing." };
  if (!reviewNote) return { error: "Add a rejection reason before rejecting." };

  const existingApplication = await db.mentorshipApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      instructorId: true,
      instructor: { select: { name: true, email: true } },
    },
  });

  if (!existingApplication) return { error: "Application not found." };
  if (existingApplication.status !== "PENDING" && existingApplication.status !== "CHANGES_REQUESTED") {
    return { error: "This application is no longer reviewable." };
  }

  await updateMentorshipApplicationReview(existingApplication.id, "REJECTED", admin.id, reviewNote);

  await createNotification(
    existingApplication.instructorId,
    "SYSTEM",
    "Mentorship application rejected",
    reviewNote,
    { kind: "MENTORSHIP_APPLICATION_REJECTED", applicationId: existingApplication.id },
    {
      actionRequired: true,
      actionLabel: "Review feedback",
      actionUrl: "/dashboard/instructor/mentorship",
    }
  );

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    action: "mentorship.application_rejected",
    entityType: "MENTORSHIP_APPLICATION",
    entityId: existingApplication.id,
    entityName: existingApplication.instructor.name ?? existingApplication.instructor.email,
    metadata: { instructorId: existingApplication.instructorId, hasNote: true },
  });

  revalidatePath("/dashboard/admin/mentorship");
  revalidatePath("/dashboard/instructor/mentorship");
  return { success: "Mentorship application rejected." };
}
