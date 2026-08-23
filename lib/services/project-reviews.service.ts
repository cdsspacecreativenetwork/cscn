import { createHash, randomBytes } from "node:crypto";
import type { Prisma, ProjectReviewDecision } from "@prisma/client";

import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";
import { db } from "@/lib/db";
import { validateRubricScores } from "@/lib/project-submission";

type Reviewer = { id: string; name?: string | null; email?: string | null };
type RubricScore = { criterionId: string; score: number; note?: string };

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

export async function reviewProjectSubmission(
  submissionId: string,
  reviewer: Reviewer,
  input: { decision: ProjectReviewDecision; overallNote: string; scores: RubricScore[]; publishToShowcase: boolean },
  now = new Date(),
) {
  if (input.decision !== "APPROVED" && input.decision !== "CHANGES_REQUESTED") {
    return { success: false as const, error: "Choose a valid review decision." };
  }
  if (input.overallNote.trim().length < 20 || input.overallNote.trim().length > 3000) {
    return { success: false as const, error: "Add a review note between 20 and 3,000 characters." };
  }
  const submission = await db.projectSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      userId: true,
      status: true,
      currentVersion: true,
      title: true,
      summary: true,
      artifactUrl: true,
      repositoryUrl: true,
      demoUrl: true,
      showcaseConsent: true,
      user: { select: { name: true, email: true } },
      project: {
        select: {
          id: true,
          title: true,
          showcaseEligible: true,
          credentialTitle: true,
          cohort: { select: { id: true, title: true, slug: true, program: { select: { title: true } } } },
          rubricCriteria: { orderBy: { position: "asc" }, select: { id: true, maxScore: true, title: true } },
        },
      },
    },
  });
  if (!submission) return { success: false as const, error: "Submission not found." };
  if (submission.userId === reviewer.id) return { success: false as const, error: "Reviewers cannot assess their own work." };
  if (submission.status !== "SUBMITTED") return { success: false as const, error: "Only submitted work can be reviewed." };
  const scoreError = validateRubricScores(submission.project.rubricCriteria, input.scores);
  if (scoreError) return { success: false as const, error: scoreError };
  if (input.publishToShowcase && (input.decision !== "APPROVED" || !submission.project.showcaseEligible || !submission.showcaseConsent)) {
    return { success: false as const, error: "Showcase publication requires approval, an eligible project, and learner consent." };
  }

  const totalScore = input.scores.reduce((sum, item) => sum + item.score, 0);
  const maxScore = submission.project.rubricCriteria.reduce((sum, item) => sum + item.maxScore, 0);
  const showcaseSlug = input.publishToShowcase
    ? `${slugify(submission.title) || "project"}-${submission.id.slice(-7).toLowerCase()}`
    : null;
  const verificationCode = `CSCN-${randomBytes(8).toString("hex").toUpperCase()}`;
  const evidenceHash = createHash("sha256").update(JSON.stringify({
    submissionId: submission.id,
    version: submission.currentVersion,
    title: submission.title,
    summary: submission.summary,
    artifactUrl: submission.artifactUrl,
    repositoryUrl: submission.repositoryUrl,
    demoUrl: submission.demoUrl,
    scores: [...input.scores].sort((a, b) => a.criterionId.localeCompare(b.criterionId)),
    reviewedAt: now.toISOString(),
  })).digest("hex");

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.projectSubmission.updateMany({
      where: { id: submission.id, status: "SUBMITTED", currentVersion: submission.currentVersion },
      data: {
        status: input.decision === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED",
        reviewedAt: now,
        reviewedById: reviewer.id,
        approvedAt: input.decision === "APPROVED" ? now : null,
        showcaseSlug,
        showcasePublishedAt: showcaseSlug ? now : null,
      },
    });
    if (updated.count !== 1) return null;
    const review = await tx.projectSubmissionReview.create({
      data: {
        submissionId: submission.id,
        version: submission.currentVersion,
        reviewerId: reviewer.id,
        decision: input.decision,
        overallNote: input.overallNote.trim(),
        totalScore,
        maxScore,
        scores: { create: input.scores.map((item) => ({ criterionId: item.criterionId, score: item.score, note: item.note?.trim() || null })) },
      },
      select: { id: true },
    });
    const credential = input.decision === "APPROVED"
      ? await tx.credential.create({
          data: {
            verificationCode,
            evidenceHash,
            userId: submission.userId,
            cohortId: submission.project.cohort.id,
            submissionId: submission.id,
            title: submission.project.credentialTitle,
            issuedAt: now,
            metadata: {
              submissionVersion: submission.currentVersion,
              projectTitle: submission.project.title,
              programTitle: submission.project.cohort.program.title,
              score: totalScore,
              maxScore,
            } satisfies Prisma.InputJsonValue,
          },
          select: { verificationCode: true },
        })
      : null;
    return { reviewId: review.id, credentialCode: credential?.verificationCode ?? null };
  });
  if (!result) return { success: false as const, error: "The submission changed during review. Refresh and try again." };

  await Promise.all([
    createNotification(
      submission.userId,
      "SYSTEM",
      input.decision === "APPROVED" ? "Project approved" : "Project revision requested",
      input.decision === "APPROVED" ? `${submission.project.title} was approved${showcaseSlug ? " and published to the showcase" : ""}.` : `Review the rubric feedback and submit a new version of ${submission.project.title}.`,
      { submissionId: submission.id, cohortId: submission.project.cohort.id, decision: input.decision, credentialCode: result.credentialCode },
      { actionRequired: input.decision === "CHANGES_REQUESTED", actionLabel: input.decision === "CHANGES_REQUESTED" ? "Revise project" : "View result", actionUrl: `/dashboard/cohorts/${submission.project.cohort.slug}/projects/${submission.project.id}` },
    ),
    createAuditLog({
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorEmail: reviewer.email,
      action: "cohort.project_reviewed",
      entityType: "PROJECT_SUBMISSION",
      entityId: submission.id,
      entityName: submission.title,
      metadata: { decision: input.decision, version: submission.currentVersion, totalScore, maxScore, showcaseSlug, credentialCode: result.credentialCode },
    }),
  ]);
  return { success: true as const, decision: input.decision, showcaseSlug, credentialCode: result.credentialCode, totalScore, maxScore };
}
