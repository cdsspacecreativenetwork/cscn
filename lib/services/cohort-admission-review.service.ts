import type { CohortApplicationStatus } from "@prisma/client";

import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";
import {
  canTransitionCohortApplication,
  type ReviewDecision,
  validateReviewNote,
} from "@/lib/cohort-admission-decisions";
import { db } from "@/lib/db";
import { activateCohortLearnerMembership } from "@/lib/services/cohort-membership.service";

type Reviewer = { id: string; name?: string | null; email?: string | null };

export type ReviewApplicationResult =
  | { success: true; status: ReviewDecision; membershipCreated: boolean; offerExpiresAt: Date | null }
  | { success: false; error: string };

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function reviewCohortApplication(
  applicationId: string,
  decision: ReviewDecision,
  note: string,
  reviewer: Reviewer,
  now = new Date(),
): Promise<ReviewApplicationResult> {
  const noteError = validateReviewNote(decision, note);
  if (noteError) return { success: false, error: noteError };

  const application = await db.cohortApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      userId: true,
      status: true,
      user: { select: { name: true, email: true } },
      cohort: {
        select: {
          id: true,
          title: true,
          slug: true,
          startsAt: true,
          capacity: true,
          price: true,
          currency: true,
          _count: { select: { memberships: { where: { status: "ACTIVE", role: "LEARNER" } } } },
        },
      },
    },
  });

  if (!application) return { success: false, error: "Application not found." };
  if (application.userId === reviewer.id) return { success: false, error: "Reviewers cannot decide their own application." };
  if (!canTransitionCohortApplication(application.status, decision)) {
    return { success: false, error: `This application cannot move from ${application.status.toLowerCase().replaceAll("_", " ")} to ${decision.toLowerCase().replaceAll("_", " ")}.` };
  }

  const price = Number(application.cohort.price ?? 0);
  if (decision === "ACCEPTED" && application.cohort._count.memberships >= application.cohort.capacity) {
    return { success: false, error: "This cohort has reached its learner capacity. Waitlist the applicant instead." };
  }

  const offerExpiresAt = decision === "ACCEPTED" && price > 0
    ? new Date(Math.min(addDays(now, 7).getTime(), application.cohort.startsAt.getTime()))
    : null;

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.cohortApplication.updateMany({
      where: { id: application.id, status: application.status as CohortApplicationStatus },
      data: {
        status: decision,
        reviewedById: reviewer.id,
        reviewedAt: now,
        reviewNote: note.trim() || null,
        offerExpiresAt,
      },
    });
    if (updated.count !== 1) return { conflict: true as const, membershipCreated: false };

    if (decision === "ACCEPTED" && price <= 0) {
      await activateCohortLearnerMembership(tx, {
        cohortId: application.cohort.id,
        userId: application.userId,
        joinedAt: now,
      });
      return { conflict: false as const, membershipCreated: true };
    }
    return { conflict: false as const, membershipCreated: false };
  });

  if (result.conflict) return { success: false, error: "The application changed while it was being reviewed. Refresh and try again." };

  const decisionLabel = decision.toLowerCase().replaceAll("_", " ");
  await Promise.all([
    createNotification(
      application.userId,
      "SYSTEM",
      decision === "ACCEPTED" ? "Your cohort application was accepted" : `Application ${decisionLabel}`,
      decision === "ACCEPTED" && price > 0
        ? `You have an offer for ${application.cohort.title}. Complete payment before ${offerExpiresAt?.toLocaleDateString("en-GB")}.`
        : `Your application for ${application.cohort.title} is now ${decisionLabel}.`,
      { applicationId, cohortId: application.cohort.id, status: decision, area: "cohorts" },
      { actionRequired: decision === "ACCEPTED" && price > 0, actionLabel: "View offer", actionUrl: `/cohorts/${application.cohort.slug}/apply`, expiresAt: offerExpiresAt ?? undefined },
    ),
    createAuditLog({
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorEmail: reviewer.email,
      action: "cohort.application_decided",
      entityType: "COHORT_APPLICATION",
      entityId: application.id,
      entityName: application.user.name ?? application.user.email ?? application.id,
      metadata: {
        previousStatus: application.status,
        status: decision,
        cohortId: application.cohort.id,
        cohortTitle: application.cohort.title,
        membershipCreated: result.membershipCreated,
        offerExpiresAt: offerExpiresAt?.toISOString() ?? null,
      },
    }),
  ]);

  return { success: true, status: decision, membershipCreated: result.membershipCreated, offerExpiresAt };
}
