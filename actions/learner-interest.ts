"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  INTEREST_AREA_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from "@/lib/learner-interest-options";

const LEARNER_ONBOARDING_VERSION = "launch-v1";

const LearnerInterestSchema = z.object({
  interestAreas: z.array(z.enum(INTEREST_AREA_OPTIONS)).min(1, "Choose at least one interest area."),
  skillLevel: z.enum(SKILL_LEVEL_OPTIONS),
  primaryGoal: z.enum(PRIMARY_GOAL_OPTIONS),
  learningStyle: z.array(z.enum(LEARNING_STYLE_OPTIONS)).min(1, "Choose at least one learning style."),
  note: z.string().max(800, "Keep the note under 800 characters.").optional(),
});

export async function upsertLearnerInterestProfileAction(values: z.infer<typeof LearnerInterestSchema>) {
  const user = await currentUser();
  if (!user?.id) return { error: "You need to sign in to save your learning profile." };

  const parsed = LearnerInterestSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid learning profile." };
  }

  const data = parsed.data;
  const completedAt = new Date();

  await db.learnerInterestProfile.upsert({
    where: { userId: user.id },
    update: {
      interestAreas: data.interestAreas,
      skillLevel: data.skillLevel,
      primaryGoal: data.primaryGoal,
      learningStyle: data.learningStyle,
      note: data.note?.trim() || null,
      onboardingCompletedAt: completedAt,
      onboardingVersion: LEARNER_ONBOARDING_VERSION,
    },
    create: {
      userId: user.id,
      interestAreas: data.interestAreas,
      skillLevel: data.skillLevel,
      primaryGoal: data.primaryGoal,
      learningStyle: data.learningStyle,
      note: data.note?.trim() || null,
      onboardingCompletedAt: completedAt,
      onboardingVersion: LEARNER_ONBOARDING_VERSION,
    },
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/learner-insights");
  return { success: true };
}
