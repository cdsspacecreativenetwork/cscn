import { db } from "@/lib/db";

/**
 * Records daily active learning/teaching actions for a user.
 * Increments streaks if active consecutively, resets if broken, and handles duplicate protection.
 */
export async function recordUserActivity(userId: string): Promise<{ newStreak: number; streakIncreased: boolean }> {
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // 1. Check if today's activity is already recorded to prevent duplicate streak increments
    const existingToday = await db.dailyActivity.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStr,
        },
      },
    });

    if (existingToday) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true },
      });
      return { newStreak: user?.currentStreak ?? 0, streakIncreased: false };
    }

    // 2. Log today's activity
    await db.dailyActivity.create({
      data: {
        userId,
        date: todayStr,
      },
    });

    // 3. Check for consecutive activity yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const existingYesterday = await db.dailyActivity.findUnique({
      where: {
        userId_date: {
          userId,
          date: yesterdayStr,
        },
      },
    });

    // 4. Fetch the user's current streaks to calculate the new counts
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true },
    });

    if (!user) {
      return { newStreak: 0, streakIncreased: false };
    }

    // If yesterday was active, increment. If not, reset/start active streak back to 1.
    const newStreak = existingYesterday ? user.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, user.longestStreak);

    // 5. Update user profile metrics
    await db.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
      },
    });

    return { newStreak, streakIncreased: true };
  } catch (error) {
    console.error("Failed to record activity or update streak:", error);
    // Graceful fallback to avoid interrupting course workflows
    return { newStreak: 0, streakIncreased: false };
  }
}
