"use server";

import { revalidatePath } from "next/cache";
import type { ProjectReviewDecision } from "@prisma/client";

import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { reviewProjectSubmission } from "@/lib/services/project-reviews.service";

export async function reviewProjectSubmissionAction(submissionId: string, input: {
  decision: ProjectReviewDecision;
  overallNote: string;
  scores: Array<{ criterionId: string; score: number; note?: string }>;
  publishToShowcase: boolean;
}) {
  const session = await requireAnyAdminPermission(["canManageLearners", "canManageUsers"]);
  const result = await reviewProjectSubmission(submissionId, { id: session.user.id!, name: session.user.name, email: session.user.email }, input);
  if (result.success) {
    revalidatePath("/dashboard/admin/project-reviews");
    revalidatePath("/showcase");
    if (result.showcaseSlug) revalidatePath(`/showcase/${result.showcaseSlug}`);
    if (result.credentialCode) revalidatePath(`/credentials/${result.credentialCode}`);
  }
  return result;
}
