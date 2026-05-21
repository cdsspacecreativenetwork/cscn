import { db } from "@/lib/db";
import { QuestTarget, QuestFrequency } from "@prisma/client";

/**
 * Seeds default Daily and Weekly Quests in the system if they do not exist.
 */
export async function seedDefaultQuests() {
  const defaultQuests = [
    {
      title: "Daily Spark",
      description: "Watch 1 lesson today to keep your streak burning",
      frequency: "DAILY" as QuestFrequency,
      targetType: "LESSON_WATCH" as QuestTarget,
      threshold: 1,
    },
    {
      title: "Deep Concentration",
      description: "Complete 3 lessons in a single day for deep learning",
      frequency: "DAILY" as QuestFrequency,
      targetType: "LESSON_WATCH" as QuestTarget,
      threshold: 3,
    },
    {
      title: "Weekly Marathon",
      description: "Watch 10 lessons this week to master the topic",
      frequency: "WEEKLY" as QuestFrequency,
      targetType: "LESSON_WATCH" as QuestTarget,
      threshold: 10,
    },
  ];

  for (const q of defaultQuests) {
    const existing = await db.quest.findFirst({
      where: { title: q.title },
    });
    if (!existing) {
      await db.quest.create({
        data: q,
      });
    }
  }
}

/**
 * Gets the end-of-period reset date.
 */
function getResetDate(frequency: QuestFrequency): Date {
  const now = new Date();
  if (frequency === "DAILY") {
    // End of today (23:59:59.999)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return endOfToday;
  } else {
    // End of current week (Sunday 23:59:59.999)
    const currentDay = now.getDay();
    const distanceToSunday = 7 - (currentDay === 0 ? 7 : currentDay);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distanceToSunday, 23, 59, 59, 999);
    return endOfWeek;
  }
}

/**
 * Syncs and retrieves active quests with user quest progresses for the active period.
 */
export async function getUserQuests(userId: string) {
  await seedDefaultQuests();

  const quests = await db.quest.findMany();
  const now = new Date();

  return Promise.all(
    quests.map(async (quest) => {
      const resetAt = getResetDate(quest.frequency);

      // Find or create active period quest progress
      let progress = await db.userQuestProgress.findFirst({
        where: {
          userId,
          questId: quest.id,
          resetAt: {
            gte: now,
          },
        },
      });

      if (!progress) {
        progress = await db.userQuestProgress.create({
          data: {
            userId,
            questId: quest.id,
            currentValue: 0,
            isCompleted: false,
            resetAt,
          },
        });
      }

      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        frequency: quest.frequency,
        threshold: quest.threshold,
        currentValue: progress.currentValue,
        isCompleted: progress.isCompleted,
        resetAt: progress.resetAt,
      };
    })
  );
}

/**
 * Increments progress counters for all active quests matching targetType.
 */
export async function incrementQuestProgress(
  userId: string,
  targetType: QuestTarget,
  amount: number = 1
) {
  await seedDefaultQuests();
  const now = new Date();

  // Find all active system quests matching targetType
  const matchingQuests = await db.quest.findMany({
    where: { targetType },
  });

  const completedQuests = [];

  for (const quest of matchingQuests) {
    const resetAt = getResetDate(quest.frequency);

    // Get active period row
    let progress = await db.userQuestProgress.findFirst({
      where: {
        userId,
        questId: quest.id,
        resetAt: {
          gte: now,
        },
      },
    });

    if (!progress) {
      progress = await db.userQuestProgress.create({
        data: {
          userId,
          questId: quest.id,
          currentValue: 0,
          isCompleted: false,
          resetAt,
        },
      });
    }

    if (progress.isCompleted) continue;

    const newValue = Math.min(progress.currentValue + amount, quest.threshold);
    const becameCompleted = newValue >= quest.threshold;

    await db.userQuestProgress.update({
      where: { id: progress.id },
      data: {
        currentValue: newValue,
        isCompleted: becameCompleted,
      },
    });

    if (becameCompleted) {
      completedQuests.push({
        id: quest.id,
        title: quest.title,
        frequency: quest.frequency,
      });
    }
  }

  return completedQuests;
}
