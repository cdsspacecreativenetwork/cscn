import {
  getPublishedCourses,
  getCategories,
  getCourseBySlug,
  getUserEnrollment,
  getUserEnrollments,
  getLessonWithAccess,
  getLessonProgress,
  getCourseForPlayer,
  getEnrollmentsForDashboard,
  COURSES_PAGE_SIZE,
} from "@/data/courses";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { recordUserActivity } from "./streaks.service";
import { checkAndAwardAchievements } from "./achievements.service";
import { incrementQuestProgress } from "./quests.service";

export { COURSES_PAGE_SIZE };

// ── Catalog ──────────────────────────────────────────────────────────────────

export async function listCourses(page = 1, categorySlug?: string) {
  return getPublishedCourses(page, categorySlug);
}

export async function listCategories() {
  return getCategories();
}

// ── Course detail ─────────────────────────────────────────────────────────────

export async function getCourseDetail(slug: string) {
  return getCourseBySlug(slug);
}

export async function getCourseDetailWithEnrollment(slug: string, userId: string | undefined) {
  const course = await getCourseBySlug(slug);
  if (!course) return null;

  const enrollment = userId
    ? await getUserEnrollment(userId, course.id)
    : null;

  return { course, enrollment };
}

// Preview: bypass PUBLISHED status check — accessible only to course instructors and admins
export async function getCoursePreview(slug: string, userId: string, userRole?: string) {
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const course = await db.course.findFirst({
    where: isAdmin
      ? { slug }
      : {
          slug,
          OR: [
            { instructorId: userId },
            { instructors: { some: { userId } } },
          ],
        },
    select: {
      id: true, title: true, slug: true, description: true, shortDesc: true,
      thumbnail: true, status: true, previewCount: true, includes: true,
      requirements: true,
      _count: { select: { enrollments: true } },
      instructor: { select: { name: true, image: true, headline: true } },
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true, title: true, position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: { id: true, title: true, duration: true, contentType: true, isPreview: true },
          },
        },
      },
    },
  });

  if (!course) return null;

  const rating = await db.courseRating.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    ...course,
    ratingAverage: rating._avg.rating ? Number(rating._avg.rating.toFixed(1)) : 0,
    ratingCount: rating._count.rating,
  };
}

// ── Enrollment ────────────────────────────────────────────────────────────────

export async function getEnrollment(userId: string, courseId: string) {
  return getUserEnrollment(userId, courseId);
}

export async function getMyEnrollments(userId: string) {
  return getUserEnrollments(userId);
}

export async function getDashboardEnrollments(userId: string) {
  return getEnrollmentsForDashboard(userId);
}

export async function enrollUser(
  userId: string,
  courseSlug: string
): Promise<{ alreadyEnrolled?: boolean; courseSlug?: string; error?: string }> {
  const course = await db.course.findUnique({
    where: { slug: courseSlug, status: "PUBLISHED" },
    select: { id: true, slug: true },
  });

  if (!course) return { error: "Course not found" };

  const existing = await getUserEnrollment(userId, course.id);
  if (existing) return { alreadyEnrolled: true, courseSlug: course.slug };

  await db.enrollment.create({
    data: { userId, courseId: course.id },
  });

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/dashboard/courses");

  return { courseSlug: course.slug };
}

// ── Lesson progress ───────────────────────────────────────────────────────────

export async function getLessonAccess(lessonId: string, userId: string | undefined) {
  return getLessonWithAccess(lessonId, userId);
}

export async function completeLessonForUser(
  userId: string,
  lessonId: string
): Promise<{ error?: string; newlyUnlockedAchievements?: any[] }> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: { course: { select: { id: true, slug: true } } },
      },
    },
  });

  if (!lesson) return { error: "Lesson not found" };

  const { id: courseId, slug: courseSlug } = lesson.module.course;

  const enrollment = await getUserEnrollment(userId, courseId);
  if (!enrollment) return { error: "Not enrolled" };

  // findUnique + create avoids transactions (HTTP adapter limitation)
  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  const newlyUnlockedAchievements = [];

  if (!existing) {
    await db.lessonProgress.create({
      data: {
        userId,
        lessonId,
        percentComplete: 100,
        completedAt: new Date(),
      },
    });
  } else if (!existing.completedAt) {
    await db.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        percentComplete: 100,
        completedAt: new Date(),
      },
    });
  }

  if (!existing || !existing.completedAt) {
    // A: Record Daily Activity and Streak calculations
    const streakInfo = await recordUserActivity(userId);
    if (streakInfo.streakIncreased) {
      const activeUnlocks = await checkAndAwardAchievements(userId, "STREAK_DAYS", streakInfo.newStreak);
      newlyUnlockedAchievements.push(...activeUnlocks);
    }

    // B: Check platform-wide LESSON_COUNT achievements
    const totalLessonsCompleted = await db.lessonProgress.count({
      where: { userId, percentComplete: { gte: 100 } },
    });
    const lessonUnlocks = await checkAndAwardAchievements(userId, "LESSON_COUNT", totalLessonsCompleted);
    newlyUnlockedAchievements.push(...lessonUnlocks);

    // C: Increment Daily & Weekly LESSON_WATCH Quests
    await incrementQuestProgress(userId, "LESSON_WATCH", 1);
  }

  // Auto-complete enrollment when all lessons are done
  const [totalLessons, completedCount] = await Promise.all([
    db.lesson.count({ where: { module: { courseId } } }),
    db.lessonProgress.count({
      where: {
        userId,
        percentComplete: { gte: 100 },
        lesson: { module: { courseId } },
      },
    }),
  ]);

  if (totalLessons > 0 && completedCount >= totalLessons) {
    await db.enrollment.updateMany({
      where: { userId, courseId, status: "ACTIVE" },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    // C: Check COURSE_COMPLETE achievements
    const completedCoursesCount = await db.enrollment.count({
      where: { userId, status: "COMPLETED" },
    });
    const courseUnlocks = await checkAndAwardAchievements(userId, "COURSE_COMPLETE", completedCoursesCount);
    newlyUnlockedAchievements.push(...courseUnlocks);
  }

  revalidatePath(`/courses/${courseSlug}/watch/${lessonId}`);

  return { newlyUnlockedAchievements };
}

export async function updateLessonPlaybackProgress(
  userId: string,
  lessonId: string,
  data: { lastSeekTime: number; percentComplete: number }
): Promise<{ error?: string; progress?: { lastSeekTime: number; percentComplete: number; isCompleted: boolean } }> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      contentType: true,
      duration: true,
      module: {
        select: { course: { select: { id: true } } },
      },
    },
  });

  if (!lesson) return { error: "Lesson not found" };
  if (lesson.contentType !== "VIDEO") return { error: "Playback progress is only available for video lessons." };

  const enrollment = await getUserEnrollment(userId, lesson.module.course.id);
  if (!enrollment) return { error: "Not enrolled" };

  const safeSeek = Number.isFinite(data.lastSeekTime)
    ? Math.max(0, data.lastSeekTime)
    : 0;
  const safePercent = Number.isFinite(data.percentComplete)
    ? Math.min(100, Math.max(0, Math.round(data.percentComplete)))
    : 0;

  const existingProgress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: {
      percentComplete: true,
      completedAt: true,
    },
  });

  if (existingProgress?.completedAt) {
    const progress = await db.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        lastSeekTime: safeSeek,
        percentComplete: Math.max(existingProgress.percentComplete, safePercent, 100),
      },
      select: {
        lastSeekTime: true,
        percentComplete: true,
        completedAt: true,
      },
    });

    return {
      progress: {
        lastSeekTime: progress.lastSeekTime,
        percentComplete: progress.percentComplete,
        isCompleted: !!progress.completedAt,
      },
    };
  }

  if (safePercent >= 95) {
    const result = await completeLessonForUser(userId, lessonId);
    if (result.error) return { error: result.error };

    const progress = await db.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        lastSeekTime: safeSeek,
        percentComplete: 100,
      },
      select: {
        lastSeekTime: true,
        percentComplete: true,
        completedAt: true,
      },
    });

    return {
      progress: {
        lastSeekTime: progress.lastSeekTime,
        percentComplete: progress.percentComplete,
        isCompleted: !!progress.completedAt,
      },
    };
  }

  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      lastSeekTime: safeSeek,
      percentComplete: safePercent,
    },
    update: {
      lastSeekTime: safeSeek,
      percentComplete: safePercent,
    },
    select: {
      lastSeekTime: true,
      percentComplete: true,
      completedAt: true,
    },
  });

  return {
    progress: {
      lastSeekTime: progress.lastSeekTime,
      percentComplete: progress.percentComplete,
      isCompleted: !!progress.completedAt,
    },
  };
}

// ── Course player ─────────────────────────────────────────────────────────────

export async function getPlayerData(slug: string, userId: string) {
  return getCourseForPlayer(slug, userId);
}

export async function getProgressSet(userId: string, lessonIds: string[]) {
  return getLessonProgress(userId, lessonIds);
}
