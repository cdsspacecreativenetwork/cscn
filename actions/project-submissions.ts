"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { ProjectSubmissionInput } from "@/lib/project-submission";
import { saveProjectSubmissionDraft, submitProjectForReview } from "@/lib/services/project-submissions.service";

export async function saveProjectDraftAction(projectId: string, input: ProjectSubmissionInput) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Sign in to save your project." };
  const result = await saveProjectSubmissionDraft(projectId, session.user.id, input);
  if (result.success) revalidatePath(`/dashboard/cohorts/${result.cohortSlug}/projects/${projectId}`);
  return result;
}

export async function submitProjectAction(projectId: string, input: ProjectSubmissionInput) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Sign in to submit your project." };
  const result = await submitProjectForReview(projectId, session.user.id, input);
  if (result.success) {
    revalidatePath(`/dashboard/cohorts/${result.cohortSlug}/projects/${projectId}`);
    revalidatePath("/dashboard/admin/project-reviews");
  }
  return result;
}
