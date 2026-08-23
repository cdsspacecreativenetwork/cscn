"use server";

import { revalidatePath } from "next/cache";

import type { ReviewDecision } from "@/lib/cohort-admission-decisions";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { reviewCohortApplication } from "@/lib/services/cohort-admission-review.service";

export async function reviewCohortApplicationAction(
  applicationId: string,
  decision: ReviewDecision,
  note: string,
) {
  const session = await requireAnyAdminPermission(["canManageLearners", "canManageUsers"]);
  const result = await reviewCohortApplication(applicationId, decision, note, {
    id: session.user.id!,
    name: session.user.name,
    email: session.user.email,
  });
  if (result.success) {
    revalidatePath("/dashboard/admin/admissions");
    revalidatePath(`/dashboard/admin/admissions/${applicationId}`);
    revalidatePath("/cohorts");
  }
  return result;
}
