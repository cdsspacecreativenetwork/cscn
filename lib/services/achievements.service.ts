import { db } from "@/lib/db";
import { AchievementTrigger, AchievementRole } from "@prisma/client";

export interface UnlockedAchievementInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  role: string;
}

/**
 * Ensures standard system achievements are seeded in the database.
 * Runs idempotently.
 */
export async function seedDefaultAchievements() {
  const defaultAchievements = [
    {
      name: "First Step",
      description: "Complete your first lesson",
      icon: "CheckCircle",
      triggerType: AchievementTrigger.LESSON_COUNT,
      threshold: 1,
      role: AchievementRole.LEARNER,
    },
    {
      name: "Curious Mind",
      description: "Complete 5 lessons on the platform",
      icon: "BookOpen",
      triggerType: AchievementTrigger.LESSON_COUNT,
      threshold: 5,
      role: AchievementRole.LEARNER,
    },
    {
      name: "7-Day Streak",
      description: "Learn or teach for 7 consecutive days",
      icon: "Flame",
      triggerType: AchievementTrigger.STREAK_DAYS,
      threshold: 7,
      role: AchievementRole.HYBRID,
    },
    {
      name: "30-Day Streak",
      description: "Learn or teach for 30 consecutive days",
      icon: "Zap",
      triggerType: AchievementTrigger.STREAK_DAYS,
      threshold: 30,
      role: AchievementRole.HYBRID,
    },
    {
      name: "Course Completer",
      description: "Complete any course fully",
      icon: "Award",
      triggerType: AchievementTrigger.COURSE_COMPLETE,
      threshold: 1,
      role: AchievementRole.LEARNER,
    },
    {
      name: "First Student",
      description: "Get your first student enrolled in a course",
      icon: "UserPlus",
      triggerType: AchievementTrigger.STUDENT_COUNT,
      threshold: 1,
      role: AchievementRole.CREATOR,
    },
    {
      name: "Rising Star",
      description: "Get 50 students enrolled across your courses",
      icon: "Sparkles",
      triggerType: AchievementTrigger.STUDENT_COUNT,
      threshold: 50,
      role: AchievementRole.CREATOR,
    },
    {
      name: "Century",
      description: "Get 100 students enrolled across your courses",
      icon: "Trophy",
      triggerType: AchievementTrigger.STUDENT_COUNT,
      threshold: 100,
      role: AchievementRole.CREATOR,
    },
    {
      name: "Published",
      description: "Publish your first course successfully",
      icon: "Globe",
      triggerType: AchievementTrigger.PUBLISH_COURSE,
      threshold: 1,
      role: AchievementRole.CREATOR,
    },
  ];

  for (const ach of defaultAchievements) {
    await db.achievement.upsert({
      where: { name: ach.name },
      update: {
        description: ach.description,
        icon: ach.icon,
        triggerType: ach.triggerType,
        threshold: ach.threshold,
        role: ach.role,
      },
      create: ach,
    });
  }
}

/**
 * Checks if a user has unlocked any achievements based on a specific trigger type and its new value.
 * Automatically inserts achievements and returns any newly unlocked ones.
 */
export async function checkAndAwardAchievements(
  userId: string,
  triggerType: AchievementTrigger,
  currentValue: number
): Promise<UnlockedAchievementInfo[]> {
  try {
    // 1. Find all achievements corresponding to this trigger type where threshold <= currentValue
    const matchingAchievements = await db.achievement.findMany({
      where: {
        triggerType,
        threshold: {
          lte: currentValue,
        },
      },
    });

    if (matchingAchievements.length === 0) return [];

    // 2. Find user's existing unlocked achievements
    const existingUnlocked = await db.userAchievement.findMany({
      where: {
        userId,
        achievementId: {
          in: matchingAchievements.map((a) => a.id),
        },
      },
      select: { achievementId: true },
    });

    const existingIds = new Set(existingUnlocked.map((e) => e.achievementId));
    const newlyUnlocked: UnlockedAchievementInfo[] = [];

    // 3. Award any not already unlocked
    for (const ach of matchingAchievements) {
      if (!existingIds.has(ach.id)) {
        await db.userAchievement.create({
          data: {
            userId,
            achievementId: ach.id,
          },
        });
        newlyUnlocked.push({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          role: ach.role,
        });
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error("Error checking or awarding achievements:", error);
    return [];
  }
}
