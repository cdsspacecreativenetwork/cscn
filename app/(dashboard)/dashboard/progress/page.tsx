import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProgressHubClient } from "@/components/dashboard/progress/ProgressHubClient";
import { getUserQuests } from "@/lib/services/quests.service";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  const userRecord = await db.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, instructorProfileEnabled: true },
  });

  const canViewInstructorImpact = Boolean(userRecord?.instructorProfileEnabled);

  // 1. Fetch course enrollments and calculate actual progress percentages
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          instructor: {
            select: { name: true },
          },
          category: {
            select: { name: true },
          },
          modules: {
            include: {
              lessons: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  const coursesProgress = await Promise.all(
    enrollments.map(async (e) => {
      const course = e.course;
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const completedLessons = await db.lessonProgress.count({
        where: {
          userId,
          percentComplete: { gte: 100 },
          lesson: {
            module: {
              courseId: course.id,
            },
          },
        },
      });

      const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return {
        id: course.id,
        title: course.title,
        instructor: course.instructor?.name || "Educator",
        category: course.category?.name || "Development",
        progress: percentage,
        totalLessons,
        completedLessons,
      };
    })
  );

  // 2. Aggregate counts for the completion stats donut
  const completedCourses = coursesProgress.filter((c) => c.progress === 100).length;
  const inProgressCourses = coursesProgress.filter((c) => c.progress > 0 && c.progress < 100).length;
  const justStartedCourses = coursesProgress.filter((c) => c.progress === 0).length;

  const overallCompletionPercentage =
    coursesProgress.length > 0
      ? Math.round(coursesProgress.reduce((sum, c) => sum + c.progress, 0) / coursesProgress.length)
      : 0;

  const completionStats = {
    completed: completedCourses,
    inProgress: inProgressCourses + justStartedCourses,
    overallPercentage: overallCompletionPercentage,
  };

  // 3. Generate last 365 days of learning activities (watch hours) based on actual lesson progress
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const lessonProgresses = await db.lessonProgress.findMany({
    where: {
      userId,
      completedAt: { gte: oneYearAgo },
    },
    select: { completedAt: true },
  });

  // Group by date string YYYY-MM-DD
  const activityMap: Record<string, number> = {};
  for (const lp of lessonProgresses) {
    if (!lp.completedAt) continue;
    const d = new Date(lp.completedAt);
    const dateStr = d.toISOString().split("T")[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = 0;
    }
    activityMap[dateStr] += 1;
  }

  // Pre-generate last 365 days array
  const activityData = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const formattedLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const fullDateLabel = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

    const lessonsCompleted = activityMap[dateStr] || 0;
    // Estimate 21 minutes (0.35 hours) per completed lesson
    const hours = parseFloat((lessonsCompleted * 0.35).toFixed(1));

    activityData.push({
      dateStr, // Add raw date string for easier filtering on client side
      label: formattedLabel,
      fullDateLabel,
      hours,
    });
  }

  // 4. Fetch achievements glossary and join with user achievements
  const allAchievements = await db.achievement.findMany({
    orderBy: { threshold: "asc" },
  });

  const userAchievements = await db.userAchievement.findMany({
    where: { userId },
  });

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const userAchievementMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.id]));

  const achievementsList = allAchievements.map((ach) => ({
    id: ach.id,
    name: ach.name,
    description: ach.description,
    icon: ach.icon,
    isUnlocked: unlockedIds.has(ach.id),
    role: ach.role,
    threshold: ach.threshold,
    triggerType: ach.triggerType,
    userAchievementId: userAchievementMap.get(ach.id) || null,
  }));

  // 5. Gather instructor impact metrics from real platform activity.
  const creatorCourses = canViewInstructorImpact
    ? await db.course.findMany({
        where: {
          OR: [{ instructorId: userId }, { instructors: { some: { userId } } }],
        },
        select: { id: true },
      })
    : [];
  const creatorCourseIds = creatorCourses.map((c) => c.id);

  const totalStudents = creatorCourseIds.length > 0
    ? await db.enrollment.count({
        where: {
          courseId: { in: creatorCourseIds },
        },
      })
    : 0;

  // Calculate total lessons finished by students of this instructor's courses
  const totalLessonsWatched = creatorCourseIds.length > 0
    ? await db.lessonProgress.count({
        where: {
          percentComplete: { gte: 100 },
          lesson: {
            module: {
              courseId: { in: creatorCourseIds },
            },
          },
        },
      })
    : 0;

  const ratingAggregate = creatorCourseIds.length > 0
    ? await db.courseRating.aggregate({
        where: { courseId: { in: creatorCourseIds } },
        _avg: { rating: true },
      })
    : null;

  // altruitic metrics: completed lessons count * 0.35 hours (21 minutes) avg lesson length
  const studentHoursSaved = Math.round(totalLessonsWatched * 0.35);

  const instructorCandidates = await db.user.findMany({
    where: { instructorProfileEnabled: true },
    select: {
      id: true,
      name: true,
      image: true,
      headline: true,
      _count: {
        select: {
          taughtCourses: true,
        },
      },
    },
    take: 50,
  });

  const leaderboardMetrics = await Promise.all(
    instructorCandidates.map(async (instructor) => {
      const courseIds = (
        await db.course.findMany({
          where: {
            OR: [{ instructorId: instructor.id }, { instructors: { some: { userId: instructor.id } } }],
          },
          select: { id: true },
        })
      ).map((course) => course.id);

      if (courseIds.length === 0) {
        return {
          userId: instructor.id,
          name: instructor.name || "Premium Educator",
          image: instructor.image || null,
          headline: instructor.headline || "Instructor at CSCN",
          score: 0,
          rank: 0,
          studentCount: 0,
        };
      }

      const [studentCount, averageRating, completedLessons] = await Promise.all([
        db.enrollment.count({ where: { courseId: { in: courseIds } } }),
        db.courseRating.aggregate({ where: { courseId: { in: courseIds } }, _avg: { rating: true } }),
        db.lessonProgress.count({
          where: {
            percentComplete: { gte: 100 },
            lesson: { module: { courseId: { in: courseIds } } },
          },
        }),
      ]);

      const rating = averageRating._avg.rating ?? 0;
      const score = Math.round((studentCount * 4 + rating * 20 + completedLessons + instructor._count.taughtCourses * 8) * 10) / 10;

      return {
        userId: instructor.id,
        name: instructor.name || "Premium Educator",
        image: instructor.image || null,
        headline: instructor.headline || "Instructor at CSCN",
        score,
        rank: 0,
        studentCount,
      };
    })
  );

  const rankedLeaderboard = leaderboardMetrics
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const leaderboardList = rankedLeaderboard.slice(0, 10);

  const userLeaderboardRecord = rankedLeaderboard.find((item) => item.userId === userId);

  const creatorRank = userLeaderboardRecord
    ? { rank: userLeaderboardRecord.rank, score: userLeaderboardRecord.score }
    : { rank: 0, score: 0 };

  const streakStats = {
    currentStreak: userRecord?.currentStreak ?? 0,
    longestStreak: userRecord?.longestStreak ?? 0,
  };

  // 8. Fetch active daily dailyActivity calendar rows for the contribution heatmap (past 180 days)
  const hundredEightyDaysAgo = new Date();
  hundredEightyDaysAgo.setDate(hundredEightyDaysAgo.getDate() - 180);

  const activeDatesList = await db.dailyActivity.findMany({
    where: {
      userId,
      createdAt: { gte: hundredEightyDaysAgo },
    },
    select: { date: true },
  });

  const activeDates = activeDatesList.map((a) => a.date);

  // 9. Fetch active daily and weekly quests progress
  const quests = await getUserQuests(userId);

  return (
    <ProgressHubClient
      coursesProgress={coursesProgress}
      completionStats={completionStats}
      activityData={activityData}
      achievementsList={achievementsList}
      creatorStats={{
        totalStudents,
        averageRating: Number((ratingAggregate?._avg.rating ?? 0).toFixed(1)),
        totalLessonsWatched,
        studentHoursSaved,
      }}
      leaderboardList={leaderboardList}
      creatorRank={creatorRank}
      streakStats={streakStats}
      activeDates={activeDates}
      quests={quests}
      canViewInstructorImpact={canViewInstructorImpact}
    />
  );
}
