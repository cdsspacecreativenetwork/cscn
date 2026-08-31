"use server";

import { revalidatePath } from "next/cache";
import type { ProjectReviewDecision } from "@prisma/client";

import { auth } from "@/auth";
import { hasAnyAdminPermission } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { reviewProjectSubmission } from "@/lib/services/project-reviews.service";

export async function reviewProjectSubmissionAction(submissionId: string, input: {
  decision: ProjectReviewDecision;
  overallNote: string;
  scores: Array<{ criterionId: string; score: number; note?: string }>;
  publishToShowcase: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Sign in to review submissions." };
  const canReviewAsAdmin = hasAnyAdminPermission(session.user, ["canManageLearners", "canManageUsers", "canManageCohorts"]);
  const submission = await db.projectSubmission.findUnique({ where: { id: submissionId }, select: { project: { select: { cohort: { select: { slug: true, memberships: { where: { userId: session.user.id, status: "ACTIVE", role: { in: ["INSTRUCTOR", "TEACHING_ASSISTANT"] } }, select: { id: true }, take: 1 } } } } } } });
  if (!submission || (!canReviewAsAdmin && submission.project.cohort.memberships.length === 0)) return { success: false as const, error: "You are not assigned to review this cohort." };
  const result = await reviewProjectSubmission(submissionId, { id: session.user.id, name: session.user.name, email: session.user.email }, input);
  if (result.success) {
    revalidatePath("/dashboard/admin/project-reviews");
    revalidatePath("/showcase");
    revalidatePath(`/dashboard/instructor/cohorts/${submission.project.cohort.slug}`);
    revalidatePath(`/dashboard/cohorts/${submission.project.cohort.slug}`);
    if (result.showcaseSlug) revalidatePath(`/showcase/${result.showcaseSlug}`);
    if (result.credentialCode) revalidatePath(`/credentials/${result.credentialCode}`);
  }
  return result;
}
