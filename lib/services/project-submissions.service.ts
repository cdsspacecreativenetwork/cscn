import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canEditProjectSubmission, projectDraftSchema, projectSubmissionSchema, type ProjectSubmissionInput } from "@/lib/project-submission";

function clean(value: string) {
  return value.trim() || null;
}

async function getAccessibleProject(projectId: string, userId: string) {
  return db.cohortProject.findFirst({
    where: {
      id: projectId,
      status: "PUBLISHED",
      OR: [{ releaseAt: null }, { releaseAt: { lte: new Date() } }],
      cohort: { memberships: { some: { userId, role: "LEARNER", status: { in: ["ACTIVE", "COMPLETED"] } } } },
    },
    select: { id: true, dueAt: true, latePolicy: true, cohort: { select: { slug: true } } },
  });
}

export async function saveProjectSubmissionDraft(projectId: string, userId: string, input: ProjectSubmissionInput) {
  const project = await getAccessibleProject(projectId, userId);
  if (!project) return { success: false as const, error: "This project is not available to your cohort membership." };
  const parsed = projectDraftSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Review the project details.", fieldErrors: parsed.error.flatten().fieldErrors };

  const existing = await db.projectSubmission.findUnique({ where: { projectId_userId: { projectId, userId } }, select: { id: true, status: true } });
  if (!canEditProjectSubmission(existing?.status)) return { success: false as const, error: "This submission is locked while it is under review or approved." };

  const data = {
    title: parsed.data.title,
    summary: parsed.data.summary,
    submissionText: clean(parsed.data.submissionText),
    artifactUrl: clean(parsed.data.artifactUrl),
    repositoryUrl: clean(parsed.data.repositoryUrl),
    demoUrl: clean(parsed.data.demoUrl),
    coverImageUrl: clean(parsed.data.coverImageUrl),
    showcaseConsent: parsed.data.showcaseConsent,
  };
  const submission = await db.projectSubmission.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, status: "DRAFT", ...data },
    update: data,
    select: { id: true, status: true },
  });
  return { success: true as const, submissionId: submission.id, status: submission.status, cohortSlug: project.cohort.slug };
}

export async function submitProjectForReview(projectId: string, userId: string, input: ProjectSubmissionInput, now = new Date()) {
  const parsed = projectSubmissionSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Complete the project evidence before submitting.", fieldErrors: parsed.error.flatten().fieldErrors };
  const saved = await saveProjectSubmissionDraft(projectId, userId, parsed.data);
  if (!saved.success) return saved;

  const project = await getAccessibleProject(projectId, userId);
  if (!project) return { success: false as const, error: "This assignment is not available." };
  const isLate = Boolean(project.dueAt && now > project.dueAt);
  if (isLate && project.latePolicy === "BLOCK") {
    return { success: false as const, error: "The submission deadline has passed. Contact your instructor if you need an extension." };
  }

  const result = await db.$transaction(async (tx) => {
    const current = await tx.projectSubmission.findUnique({ where: { id: saved.submissionId } });
    if (!current || !canEditProjectSubmission(current.status)) return null;
    const version = current.currentVersion + 1;
    await tx.projectSubmissionVersion.create({
      data: {
        submissionId: current.id,
        version,
        title: current.title,
        summary: current.summary,
        submissionText: current.submissionText,
        attachments: current.attachments === null ? Prisma.JsonNull : current.attachments as Prisma.InputJsonValue,
        artifactUrl: current.artifactUrl,
        repositoryUrl: current.repositoryUrl,
        demoUrl: current.demoUrl,
        coverImageUrl: current.coverImageUrl,
        submittedAt: now,
      },
    });
    return tx.projectSubmission.update({
      where: { id: current.id },
      data: { status: "SUBMITTED", currentVersion: version, submittedAt: now, isLate, reviewedAt: null, reviewedById: null },
      select: { id: true, currentVersion: true },
    });
  });
  if (!result) return { success: false as const, error: "This submission changed while it was being submitted. Refresh and try again." };
  return { success: true as const, submissionId: result.id, status: "SUBMITTED" as const, version: result.currentVersion, cohortSlug: saved.cohortSlug };
}
