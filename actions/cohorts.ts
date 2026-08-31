"use server";

import { CohortStatus, Prisma, ScheduleAttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { buildPeerReviewAssignments } from "@/lib/cohort-peer-review";
import { validateCompletionPolicy } from "@/lib/cohort-completion";
import { db } from "@/lib/db";
import { canOperateCohort } from "@/lib/services/cohort-management.service";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function integer(formData: FormData, key: string, fallback = 0) {
  const value = Number(text(formData, key));
  return Number.isInteger(value) ? value : fallback;
}

function date(formData: FormData, key: string, required = true) {
  const value = text(formData, key);
  if (!value && !required) return null;
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) throw new Error(`Enter a valid ${key}.`);
  return parsed;
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function slug(value: string) {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (normalized.length < 3) throw new Error("Use a descriptive cohort slug.");
  return normalized;
}

function safeReturn(formData: FormData, fallback: string) {
  const value = text(formData, "returnTo");
  return value.startsWith("/dashboard/admin/cohorts") || value.startsWith("/dashboard/instructor/cohorts") ? value : fallback;
}

function withMessage(path: string, kind: "success" | "error", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${kind}=${encodeURIComponent(message)}`;
}

async function requireCohortAdmin() {
  const session = await auth();
  if (!session?.user?.id || !hasAdminPermission(session.user, "canManageCohorts")) throw new Error("You do not have permission to manage cohorts.");
  return session;
}

async function requireOperator(cohortSlug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Sign in to manage this cohort.");
  const allowed = await canOperateCohort(session.user.id, cohortSlug, hasAdminPermission(session.user, "canManageCohorts"));
  if (!allowed) throw new Error("You are not assigned to operate this cohort.");
  const cohort = await db.cohort.findUnique({ where: { slug: cohortSlug }, select: { id: true, title: true, slug: true } });
  if (!cohort) throw new Error("Cohort not found.");
  return { session, cohort };
}

function completionPolicyFromForm(formData: FormData) {
  const policy = {
    weights: {
      courses: integer(formData, "coursesWeight", 30),
      assignments: integer(formData, "assignmentsWeight", 30),
      quizzes: integer(formData, "quizzesWeight", 15),
      attendance: integer(formData, "attendanceWeight", 15),
      peerReviews: integer(formData, "peerReviewsWeight", 10),
    },
    minimums: {
      courses: integer(formData, "coursesMinimum", 80),
      assignments: integer(formData, "assignmentsMinimum", 70),
      quizzes: integer(formData, "quizzesMinimum", 60),
      attendance: integer(formData, "attendanceMinimum", 70),
      peerReviews: integer(formData, "peerReviewsMinimum", 80),
    },
    overallMinimum: integer(formData, "overallMinimum", 70),
  };
  const result = validateCompletionPolicy(policy);
  if (!result.valid) throw new Error(result.error ?? "Invalid completion policy.");
  return result.policy as unknown as Prisma.InputJsonValue;
}

export async function createCohortAction(formData: FormData) {
  const returnTo = "/dashboard/admin/cohorts";
  let destination: string;
  try {
    const session = await requireCohortAdmin();
    const programId = text(formData, "programId");
    const title = text(formData, "title");
    const cohortSlug = slug(text(formData, "slug") || title);
    const startsAt = date(formData, "startsAt")!;
    const endsAt = date(formData, "endsAt")!;
    const applicationOpenAt = date(formData, "applicationOpenAt")!;
    const applicationCloseAt = date(formData, "applicationCloseAt")!;
    if (title.length < 3) throw new Error("Enter a cohort title.");
    if (!(applicationOpenAt < applicationCloseAt && applicationCloseAt <= startsAt && startsAt < endsAt)) {
      throw new Error("Dates must follow: applications open, applications close, cohort starts, cohort ends.");
    }
    const capacity = integer(formData, "capacity", 0);
    if (capacity < 1 || capacity > 5000) throw new Error("Capacity must be between 1 and 5,000.");
    const program = await db.program.findFirst({ where: { id: programId, status: "PUBLISHED" }, select: { id: true } });
    if (!program) throw new Error("Choose a published Program.");
    const leadInstructorId = text(formData, "leadInstructorId") || null;
    const cohort = await db.$transaction(async (tx) => {
      const created = await tx.cohort.create({
        data: {
          programId,
          title,
          slug: cohortSlug,
          status: "DRAFT",
          applicationOpenAt,
          applicationCloseAt,
          startsAt,
          endsAt,
          timezone: text(formData, "timezone") || "Africa/Lagos",
          capacity,
          price: Math.max(0, Number(text(formData, "price") || 0)),
          currency: (text(formData, "currency") || "NGN").toUpperCase().slice(0, 3),
          applicationRequired: formData.get("applicationRequired") === "on",
          graduationRules: lines(text(formData, "graduationRules")) as Prisma.InputJsonValue,
          completionPolicy: completionPolicyFromForm(formData),
          scheduleSummary: text(formData, "scheduleSummary"),
          weeklySchedule: lines(text(formData, "weeklySchedule")) as Prisma.InputJsonValue,
          leadInstructorId,
        },
        select: { id: true, title: true, slug: true },
      });
      if (leadInstructorId) {
        await tx.cohortMembership.upsert({
          where: { cohortId_userId: { cohortId: created.id, userId: leadInstructorId } },
          create: { cohortId: created.id, userId: leadInstructorId, role: "INSTRUCTOR", status: "ACTIVE", joinedAt: new Date() },
          update: { role: "INSTRUCTOR", status: "ACTIVE", joinedAt: new Date() },
        });
      }
      return created;
    });
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.created", entityType: "COHORT", entityId: cohort.id, entityName: cohort.title });
    if (leadInstructorId) await createNotification(leadInstructorId, "SYSTEM", "You were assigned to a cohort", `You are the lead instructor for ${cohort.title}.`, { kind: "COHORT_ASSIGNMENT" }, { actionLabel: "Open cohort", actionUrl: `/dashboard/instructor/cohorts/${cohort.slug}` });
    revalidatePath(returnTo);
    destination = withMessage(`/dashboard/admin/cohorts/${cohort.slug}`, "success", "Cohort draft created.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to create cohort.");
  }
  redirect(destination);
}

const ALLOWED_TRANSITIONS: Record<CohortStatus, CohortStatus[]> = {
  DRAFT: ["APPLICATIONS_OPEN", "APPLICATIONS_CLOSED", "CANCELLED"],
  APPLICATIONS_OPEN: ["APPLICATIONS_CLOSED", "CANCELLED"],
  APPLICATIONS_CLOSED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};

export async function transitionCohortAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/admin/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const session = await requireCohortAdmin();
    const target = text(formData, "status") as CohortStatus;
    const cohort = await db.cohort.findUniqueOrThrow({ where: { slug: cohortSlug }, select: { id: true, title: true, status: true, completionPolicy: true, programId: true } });
    if (!ALLOWED_TRANSITIONS[cohort.status].includes(target)) throw new Error(`Cannot move a ${cohort.status.toLowerCase()} cohort to ${target.toLowerCase()}.`);
    if (target === "APPLICATIONS_OPEN" && !validateCompletionPolicy(cohort.completionPolicy).valid) throw new Error("Fix the completion policy before opening applications.");
    await db.cohort.update({ where: { id: cohort.id }, data: { status: target } });
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: `cohort.${target.toLowerCase()}`, entityType: "COHORT", entityId: cohort.id, entityName: cohort.title, metadata: { from: cohort.status, to: target, note: text(formData, "note") || null } });
    revalidatePath("/dashboard/admin/cohorts");
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination = withMessage(returnTo, "success", `Cohort moved to ${target.toLowerCase().replaceAll("_", " ")}.`);
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update cohort.");
  }
  redirect(destination);
}

export async function addCohortMemberAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/admin/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const session = await requireCohortAdmin();
    const cohort = await db.cohort.findUniqueOrThrow({ where: { slug: cohortSlug }, select: { id: true, title: true, capacity: true } });
    const user = await db.user.findUnique({ where: { email: text(formData, "email").toLowerCase() }, select: { id: true, name: true, email: true } });
    if (!user) throw new Error("No account uses that email address.");
    const role = text(formData, "role") as "LEARNER" | "INSTRUCTOR" | "TEACHING_ASSISTANT" | "MENTOR";
    if (!(["LEARNER", "INSTRUCTOR", "TEACHING_ASSISTANT", "MENTOR"] as string[]).includes(role)) throw new Error("Choose a valid cohort role.");
    if (role === "LEARNER") {
      const activeLearners = await db.cohortMembership.count({ where: { cohortId: cohort.id, role: "LEARNER", status: "ACTIVE" } });
      if (activeLearners >= cohort.capacity) throw new Error("This cohort is at capacity.");
    }
    await db.cohortMembership.upsert({
      where: { cohortId_userId: { cohortId: cohort.id, userId: user.id } },
      create: { cohortId: cohort.id, userId: user.id, role, status: "ACTIVE", joinedAt: new Date() },
      update: { role, status: "ACTIVE", joinedAt: new Date() },
    });
    await Promise.all([
      createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.member_added", entityType: "COHORT_MEMBERSHIP", entityId: cohort.id, entityName: user.name ?? user.email, metadata: { role } }),
      createNotification(user.id, "SYSTEM", `Added to ${cohort.title}`, `You joined as ${role.toLowerCase().replaceAll("_", " ")}.`, { kind: "COHORT_MEMBERSHIP" }, { actionLabel: "Open cohort", actionUrl: role === "LEARNER" ? `/dashboard/cohorts/${cohortSlug}` : `/dashboard/instructor/cohorts/${cohortSlug}` }),
    ]);
    revalidatePath(returnTo);
    destination = withMessage(returnTo, "success", "Cohort member added.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to add member.");
  }
  redirect(destination);
}

export async function updateCohortMemberStatusAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/admin/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const session = await requireCohortAdmin();
    const status = text(formData, "membershipStatus") as "ACTIVE" | "PAUSED" | "COMPLETED" | "WITHDRAWN";
    if (!(["ACTIVE", "PAUSED", "COMPLETED", "WITHDRAWN"] as string[]).includes(status)) throw new Error("Choose a valid membership status.");
    const membership = await db.cohortMembership.findFirst({ where: { id: text(formData, "membershipId"), cohort: { slug: cohortSlug } }, select: { id: true, userId: true, role: true, user: { select: { name: true, email: true } }, cohort: { select: { id: true, title: true } } } });
    if (!membership) throw new Error("Membership not found.");
    await db.cohortMembership.update({ where: { id: membership.id }, data: { status, completedAt: status === "COMPLETED" ? new Date() : null, joinedAt: status === "ACTIVE" ? new Date() : undefined } });
    await Promise.all([
      createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.membership_updated", entityType: "COHORT_MEMBERSHIP", entityId: membership.id, entityName: membership.user.name ?? membership.user.email, metadata: { status, role: membership.role, cohortId: membership.cohort.id } }),
      createNotification(membership.userId, "SYSTEM", "Cohort membership updated", `Your membership in ${membership.cohort.title} is now ${status.toLowerCase()}.`, { kind: "COHORT_MEMBERSHIP" }, { actionLabel: "View cohorts", actionUrl: "/dashboard/cohorts" }),
    ]);
    revalidatePath(returnTo);
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination = withMessage(returnTo, "success", "Membership updated.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update membership.");
  }
  redirect(destination);
}

export async function duplicateCohortAction(formData: FormData) {
  const sourceSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/admin/cohorts/${sourceSlug}`);
  let destination: string;
  try {
    const session = await requireCohortAdmin();
    const title = text(formData, "title");
    const duplicateSlug = slug(text(formData, "slug") || title);
    if (title.length < 3) throw new Error("Enter a title for the duplicated cohort.");
    const source = await db.cohort.findUnique({
      where: { slug: sourceSlug },
      include: {
        memberships: { where: { role: { in: ["INSTRUCTOR", "TEACHING_ASSISTANT", "MENTOR"] }, status: "ACTIVE" }, select: { userId: true, role: true } },
        projects: { where: { status: { not: "ARCHIVED" } }, include: { rubricCriteria: { orderBy: { position: "asc" } } } },
      },
    });
    if (!source) throw new Error("Source cohort not found.");
    const startsAt = date(formData, "startsAt")!;
    const endsAt = date(formData, "endsAt")!;
    const applicationOpenAt = date(formData, "applicationOpenAt")!;
    const applicationCloseAt = date(formData, "applicationCloseAt")!;
    if (!(applicationOpenAt < applicationCloseAt && applicationCloseAt <= startsAt && startsAt < endsAt)) throw new Error("Enter a valid application and cohort date sequence.");
    const created = await db.$transaction(async (tx) => {
      const cohort = await tx.cohort.create({ data: {
        programId: source.programId, title, slug: duplicateSlug, status: "DRAFT", applicationOpenAt, applicationCloseAt, startsAt, endsAt,
        timezone: source.timezone, capacity: source.capacity, price: source.price, currency: source.currency, applicationRequired: source.applicationRequired,
        graduationRules: source.graduationRules as Prisma.InputJsonValue, completionPolicy: source.completionPolicy === null ? Prisma.DbNull : source.completionPolicy as Prisma.InputJsonValue,
        scheduleSummary: source.scheduleSummary, weeklySchedule: source.weeklySchedule === null ? Prisma.DbNull : source.weeklySchedule as Prisma.InputJsonValue, leadInstructorId: source.leadInstructorId, organizationId: source.organizationId,
      }, select: { id: true, slug: true } });
      if (source.memberships.length) await tx.cohortMembership.createMany({ data: source.memberships.map((member) => ({ cohortId: cohort.id, userId: member.userId, role: member.role, status: "ACTIVE" as const, joinedAt: new Date() })), skipDuplicates: true });
      for (const project of source.projects) {
        await tx.cohortProject.create({ data: {
          cohortId: cohort.id, createdById: session.user.id!, title: project.title, slug: project.slug, brief: project.brief, deliverables: project.deliverables as Prisma.InputJsonValue,
          assignmentType: project.assignmentType, latePolicy: project.latePolicy, maxScore: project.maxScore, acceptedSubmissionFormats: project.acceptedSubmissionFormats === null ? Prisma.DbNull : project.acceptedSubmissionFormats as Prisma.InputJsonValue,
          peerReviewEnabled: project.peerReviewEnabled, peerReviewsPerLearner: project.peerReviewsPerLearner, status: "DRAFT", showcaseEligible: project.showcaseEligible, credentialTitle: project.credentialTitle,
          rubricCriteria: { create: project.rubricCriteria.map((criterion) => ({ key: criterion.key, title: criterion.title, description: criterion.description, maxScore: criterion.maxScore, position: criterion.position })) },
        } });
      }
      return cohort;
    });
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.duplicated", entityType: "COHORT", entityId: created.id, entityName: title, metadata: { sourceCohortId: source.id } });
    revalidatePath("/dashboard/admin/cohorts");
    destination = withMessage(`/dashboard/admin/cohorts/${created.slug}`, "success", "Cohort structure duplicated as a draft.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to duplicate cohort.");
  }
  redirect(destination);
}

export async function createCohortEventAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/instructor/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const { session, cohort } = await requireOperator(cohortSlug);
    const actorId = session.user.id!;
    const startsAt = date(formData, "startsAt")!;
    const endsAt = date(formData, "endsAt", false);
    if (endsAt && endsAt <= startsAt) throw new Error("The event must end after it starts.");
    const title = text(formData, "title");
    if (title.length < 3) throw new Error("Enter an event title.");
    const event = await db.$transaction(async (tx) => {
      const created = await tx.scheduleEvent.create({
        data: {
          cohortId: cohort.id,
          createdById: actorId,
          type: text(formData, "type") as "LIVE_SESSION" | "MENTORSHIP" | "EXAM" | "DEADLINE",
          audience: "COHORT_MEMBERS",
          status: "SCHEDULED",
          title,
          description: text(formData, "description") || null,
          startsAt,
          endsAt,
          timezone: text(formData, "timezone") || "Africa/Lagos",
          meetingUrl: text(formData, "meetingUrl") || null,
        },
        select: { id: true, title: true },
      });
      const learners = await tx.cohortMembership.findMany({ where: { cohortId: cohort.id, role: "LEARNER", status: "ACTIVE" }, select: { userId: true } });
      if (learners.length) await tx.scheduleEventAttendee.createMany({ data: learners.map(({ userId }) => ({ eventId: created.id, userId, status: "INVITED" as const })), skipDuplicates: true });
      return { ...created, learnerIds: learners.map((item) => item.userId) };
    });
    await Promise.all(event.learnerIds.map((userId) => createNotification(userId, "SYSTEM", "New cohort event", `${event.title} was added to ${cohort.title}.`, { kind: "LIVE_SESSION", eventId: event.id }, { actionLabel: "View calendar", actionUrl: `/dashboard/cohorts/${cohortSlug}?tab=live` })));
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.event_created", entityType: "SCHEDULE_EVENT", entityId: event.id, entityName: event.title, metadata: { cohortId: cohort.id } });
    revalidatePath(returnTo);
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination = withMessage(returnTo, "success", "Event scheduled and learners notified.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to schedule event.");
  }
  redirect(destination);
}

export async function updateCohortEventAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/instructor/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const { session, cohort } = await requireOperator(cohortSlug);
    const eventId = text(formData, "eventId");
    const event = await db.scheduleEvent.findFirst({ where: { id: eventId, cohortId: cohort.id }, select: { id: true, title: true } });
    if (!event) throw new Error("Event not found in this cohort.");
    const status = text(formData, "status") as "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
    await db.scheduleEvent.update({
      where: { id: event.id },
      data: {
        status,
        recordingUrl: text(formData, "recordingUrl") || undefined,
        ...(status === "LIVE" ? { startedAt: new Date(), startedById: session.user.id } : {}),
        ...(status === "COMPLETED" ? { endedAt: new Date(), endedById: session.user.id } : {}),
      },
    });
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.event_updated", entityType: "SCHEDULE_EVENT", entityId: event.id, entityName: event.title, metadata: { status } });
    revalidatePath(returnTo);
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination = withMessage(returnTo, "success", "Event updated.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update event.");
  }
  redirect(destination);
}

export async function markCohortAttendanceAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/instructor/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const { session, cohort } = await requireOperator(cohortSlug);
    const status = text(formData, "attendanceStatus") as ScheduleAttendanceStatus;
    if (!(["ATTENDED", "MISSED", "CANCELLED", "REGISTERED", "INVITED"] as string[]).includes(status)) throw new Error("Choose a valid attendance status.");
    const attendee = await db.scheduleEventAttendee.findFirst({ where: { eventId: text(formData, "eventId"), userId: text(formData, "userId"), event: { cohortId: cohort.id } }, select: { id: true } });
    if (!attendee) throw new Error("This learner is not registered for the event.");
    await db.scheduleEventAttendee.update({ where: { id: attendee.id }, data: { status } });
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.attendance_marked", entityType: "SCHEDULE_ATTENDEE", entityId: attendee.id, metadata: { status } });
    revalidatePath(returnTo);
    destination = withMessage(returnTo, "success", "Attendance updated.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update attendance.");
  }
  redirect(destination);
}

export async function createCohortAssignmentAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/instructor/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const { session, cohort } = await requireOperator(cohortSlug);
    const actorId = session.user.id!;
    const title = text(formData, "title");
    const assignmentSlug = slug(text(formData, "slug") || title);
    const brief = text(formData, "brief");
    if (title.length < 3 || brief.length < 20) throw new Error("Add a clear assignment title and brief.");
    const dueAt = date(formData, "dueAt", false);
    const releaseAt = date(formData, "releaseAt", false);
    if (dueAt && releaseAt && dueAt <= releaseAt) throw new Error("The deadline must be after the release date.");
    const peerReviewEnabled = formData.get("peerReviewEnabled") === "on";
    const peerReviewDueAt = date(formData, "peerReviewDueAt", false);
    if (peerReviewEnabled && (!dueAt || !peerReviewDueAt || peerReviewDueAt <= dueAt)) throw new Error("Peer review requires a deadline after the submission deadline.");
    const rubricLines = lines(text(formData, "rubric"));
    if (!rubricLines.length) throw new Error("Add at least one rubric criterion.");
    const assignment = await db.cohortProject.create({
      data: {
        cohortId: cohort.id,
        createdById: actorId,
        title,
        slug: assignmentSlug,
        brief,
        deliverables: lines(text(formData, "deliverables")) as Prisma.InputJsonValue,
        dueAt,
        releaseAt,
        assignmentType: text(formData, "assignmentType") as "PRACTICE" | "PROJECT" | "REFLECTION" | "CAPSTONE",
        latePolicy: text(formData, "latePolicy") as "ALLOW" | "MARK_LATE" | "BLOCK",
        maxScore: Math.max(1, integer(formData, "maxScore", 100)),
        acceptedSubmissionFormats: formData.getAll("submissionFormats").map(String) as Prisma.InputJsonValue,
        peerReviewEnabled,
        peerReviewsPerLearner: Math.max(1, Math.min(5, integer(formData, "peerReviewsPerLearner", 2))),
        peerReviewDueAt,
        status: formData.get("publishNow") === "on" ? "PUBLISHED" : "DRAFT",
        showcaseEligible: formData.get("showcaseEligible") === "on",
        credentialTitle: text(formData, "credentialTitle") || title,
        rubricCriteria: {
          create: rubricLines.map((line, index) => {
            const [criterionTitle, description, max] = line.split("|").map((item) => item.trim());
            return { key: slug(criterionTitle), title: criterionTitle, description: description || criterionTitle, maxScore: Math.max(1, Number(max) || 5), position: index + 1 };
          }),
        },
      },
      select: { id: true, title: true },
    });
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.assignment_created", entityType: "COHORT_PROJECT", entityId: assignment.id, entityName: assignment.title, metadata: { cohortId: cohort.id } });
    revalidatePath(returnTo);
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination = withMessage(returnTo, "success", "Assignment created.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to create assignment.");
  }
  redirect(destination);
}

export async function generatePeerReviewsAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/instructor/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const { session, cohort } = await requireOperator(cohortSlug);
    const project = await db.cohortProject.findFirst({
      where: { id: text(formData, "projectId"), cohortId: cohort.id, peerReviewEnabled: true },
      select: {
        id: true,
        title: true,
        dueAt: true,
        peerReviewDueAt: true,
        peerReviewsPerLearner: true,
        submissions: { where: { status: { in: ["SUBMITTED", "CHANGES_REQUESTED", "APPROVED"] } }, select: { id: true, userId: true } },
        peerReviewAssignments: { select: { submissionId: true, reviewerId: true } },
      },
    });
    if (!project) throw new Error("Peer review is not enabled for this assignment.");
    if (project.dueAt && project.dueAt > new Date()) throw new Error("Peer reviews can be assigned after the submission deadline.");
    const assignments = buildPeerReviewAssignments(project.submissions, project.peerReviewsPerLearner, project.peerReviewAssignments);
    if (!assignments.length) throw new Error("No new peer reviews can be assigned. At least two learners must submit.");
    await db.peerReviewAssignment.createMany({ data: assignments.map((item) => ({ ...item, projectId: project.id, dueAt: project.peerReviewDueAt })), skipDuplicates: true });
    await Promise.all(assignments.map((item) => createNotification(item.reviewerId, "SYSTEM", "Peer review assigned", `Review a classmate's work for ${project.title}.`, { kind: "PEER_REVIEW" }, { actionRequired: true, actionLabel: "Review work", actionUrl: `/dashboard/cohorts/${cohortSlug}?tab=peer-reviews` })));
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.peer_reviews_assigned", entityType: "COHORT_PROJECT", entityId: project.id, entityName: project.title, metadata: { count: assignments.length } });
    revalidatePath(returnTo);
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination = withMessage(returnTo, "success", `${assignments.length} peer reviews assigned.`);
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to assign peer reviews.");
  }
  redirect(destination);
}

export async function createCohortAnnouncementAction(formData: FormData) {
  const cohortSlug = text(formData, "cohortSlug");
  const returnTo = safeReturn(formData, `/dashboard/instructor/cohorts/${cohortSlug}`);
  let destination: string;
  try {
    const { session, cohort } = await requireOperator(cohortSlug);
    const actorId = session.user.id!;
    const title = text(formData, "title");
    const body = text(formData, "body");
    if (title.length < 3 || body.length < 8) throw new Error("Add a clear title and message.");
    const announcement = await db.announcement.create({ data: { cohortId: cohort.id, authorId: actorId, title, body, audience: "STUDENTS", status: "PUBLISHED", publishedAt: new Date(), priority: Math.max(0, Math.min(10, integer(formData, "priority", 0))) }, select: { id: true } });
    const learners = await db.cohortMembership.findMany({ where: { cohortId: cohort.id, role: "LEARNER", status: "ACTIVE" }, select: { userId: true } });
    await Promise.all(learners.map(({ userId }) => createNotification(userId, "SYSTEM", title, body.slice(0, 240), { kind: "COHORT_ANNOUNCEMENT" }, { actionLabel: "Open cohort", actionUrl: `/dashboard/cohorts/${cohortSlug}` })));
    await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.announcement_published", entityType: "ANNOUNCEMENT", entityId: announcement.id, entityName: title, metadata: { cohortId: cohort.id } });
    revalidatePath(returnTo);
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination = withMessage(returnTo, "success", "Announcement published.");
  } catch (error) {
    destination = withMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to publish announcement.");
  }
  redirect(destination);
}
