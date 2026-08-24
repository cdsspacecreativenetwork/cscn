"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { CohortApplicationInput } from "@/lib/cohort-application";
import { saveCohortApplication } from "@/lib/services/cohort-admissions.service";

export async function saveCohortApplicationDraft(cohortSlug: string, input: CohortApplicationInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, code: "UNAUTHENTICATED" as const, error: "Sign in to save your application." };
  }

  const result = await saveCohortApplication(cohortSlug, session.user.id, input);
  if (result.success) revalidatePath(`/cohorts/${cohortSlug}/apply`);
  return result;
}

export async function submitCohortApplication(cohortSlug: string, input: CohortApplicationInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, code: "UNAUTHENTICATED" as const, error: "Sign in to submit your application." };
  }

  const result = await saveCohortApplication(cohortSlug, session.user.id, input, { submit: true });
  if (result.success) {
    revalidatePath(`/cohorts/${cohortSlug}`);
    revalidatePath(`/cohorts/${cohortSlug}/apply`);
  }
  return result;
}
