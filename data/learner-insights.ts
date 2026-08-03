import { db } from "@/lib/db";
export {
  INTEREST_AREA_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from "@/lib/learner-interest-options";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toBreakdown(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function getLearnerInterestProfileByUserId(userId: string) {
  return db.learnerInterestProfile.findUnique({
    where: { userId },
  });
}

export async function getLearnerInsights() {
  const profiles = await db.learnerInterestProfile.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          onboardingCohort: true,
          pioneerJoinedAt: true,
          createdAt: true,
        },
      },
    },
  });

  const interestAreas = new Map<string, number>();
  const skillLevels = new Map<string, number>();
  const primaryGoals = new Map<string, number>();
  const learningStyles = new Map<string, number>();

  for (const profile of profiles) {
    asStringArray(profile.interestAreas).forEach((item) => increment(interestAreas, item));
    asStringArray(profile.learningStyle).forEach((item) => increment(learningStyles, item));
    increment(skillLevels, profile.skillLevel);
    increment(primaryGoals, profile.primaryGoal);
  }

  return {
    total: profiles.length,
    pioneerProfiles: profiles.filter((profile) => profile.user.onboardingCohort).length,
    topInterestAreas: toBreakdown(interestAreas),
    skillLevels: toBreakdown(skillLevels),
    primaryGoals: toBreakdown(primaryGoals),
    learningStyles: toBreakdown(learningStyles),
    recentSubmissions: profiles.slice(0, 50).map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      email: profile.user.email,
      onboardingCohort: profile.user.onboardingCohort,
      pioneerJoinedAt: profile.user.pioneerJoinedAt,
      interestAreas: asStringArray(profile.interestAreas),
      skillLevel: profile.skillLevel,
      primaryGoal: profile.primaryGoal,
      learningStyle: asStringArray(profile.learningStyle),
      note: profile.note,
      onboardingCompletedAt: profile.onboardingCompletedAt,
      onboardingVersion: profile.onboardingVersion,
      updatedAt: profile.updatedAt,
      createdAt: profile.createdAt,
    })),
  };
}

export async function getLearnerInsightExportRows() {
  const profiles = await db.learnerInterestProfile.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          onboardingCohort: true,
          pioneerJoinedAt: true,
        },
      },
    },
  });

  return profiles.map((profile) => ({
    name: profile.user.name ?? "",
    email: profile.user.email,
    cohort: profile.user.onboardingCohort ?? "",
    pioneerJoinedAt: profile.user.pioneerJoinedAt?.toISOString() ?? "",
    interestAreas: asStringArray(profile.interestAreas).join("; "),
    skillLevel: profile.skillLevel,
    primaryGoal: profile.primaryGoal,
    learningStyle: asStringArray(profile.learningStyle).join("; "),
    note: profile.note ?? "",
    onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() ?? "",
    onboardingVersion: profile.onboardingVersion,
    submittedAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }));
}
