import type { Prisma } from "@prisma/client";

import {
  cohortApplicationDraftSchema,
  cohortApplicationSubmissionSchema,
  isCohortApplicationOpen,
  type CohortApplicationInput,
} from "@/lib/cohort-application";
import { db } from "@/lib/db";

export type CohortApplicationResult =
  | { success: true; applicationId: string; status: "DRAFT" | "SUBMITTED" }
  | { success: false; code: "COHORT_NOT_FOUND" | "APPLICATIONS_CLOSED" | "APPLICATION_LOCKED" | "INVALID_APPLICATION"; error: string; fieldErrors?: Record<string, string[]> };

function toAnswers(input: CohortApplicationInput): Prisma.InputJsonValue {
  return {
    country: input.country,
    experienceLevel: input.experienceLevel,
    weeklyHours: input.weeklyHours,
    hasLaptop: input.hasLaptop,
    hasReliableInternet: input.hasReliableInternet,
    commitmentConfirmed: input.commitmentConfirmed,
  };
}

export async function saveCohortApplication(
  cohortSlug: string,
  userId: string,
  input: CohortApplicationInput,
  options: { submit?: boolean; now?: Date } = {},
): Promise<CohortApplicationResult> {
  const cohort = await db.cohort.findFirst({
    where: {
      slug: cohortSlug,
      program: { status: "PUBLISHED", school: { status: "PUBLISHED" } },
    },
    select: { id: true, status: true, applicationOpenAt: true, applicationCloseAt: true },
  });

  if (!cohort) {
    return { success: false, code: "COHORT_NOT_FOUND", error: "This cohort is not available." };
  }

  if (!isCohortApplicationOpen(cohort, options.now)) {
    return { success: false, code: "APPLICATIONS_CLOSED", error: "Applications are not open for this cohort." };
  }

  const existing = await db.cohortApplication.findUnique({
    where: { cohortId_userId: { cohortId: cohort.id, userId } },
    select: { id: true, status: true },
  });

  if (existing && existing.status !== "DRAFT") {
    return { success: false, code: "APPLICATION_LOCKED", error: "This application has already been submitted." };
  }

  const schema = options.submit ? cohortApplicationSubmissionSchema : cohortApplicationDraftSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_APPLICATION",
      error: "Review the highlighted application details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const application = await db.cohortApplication.upsert({
    where: { cohortId_userId: { cohortId: cohort.id, userId } },
    create: {
      cohortId: cohort.id,
      userId,
      status: options.submit ? "SUBMITTED" : "DRAFT",
      background: parsed.data.background,
      goals: parsed.data.goals,
      prerequisites: parsed.data.prerequisites,
      portfolioUrl: parsed.data.portfolioUrl || null,
      answers: toAnswers(parsed.data),
      submittedAt: options.submit ? options.now ?? new Date() : null,
    },
    update: {
      status: options.submit ? "SUBMITTED" : "DRAFT",
      background: parsed.data.background,
      goals: parsed.data.goals,
      prerequisites: parsed.data.prerequisites,
      portfolioUrl: parsed.data.portfolioUrl || null,
      answers: toAnswers(parsed.data),
      submittedAt: options.submit ? options.now ?? new Date() : null,
    },
    select: { id: true },
  });

  return {
    success: true,
    applicationId: application.id,
    status: options.submit ? "SUBMITTED" : "DRAFT",
  };
}
