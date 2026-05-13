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

// Preview: bypass PUBLISHED status check for instructors/admins
export async function getCoursePreview(slug: string, userId: string) {
  const course = await db.course.findFirst({
    where: {
      slug,
      OR: [
        { instructorId: userId },
        { instructors: { some: { userId } } },
        { instructor: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } },
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
            select: { id: true, title: true, duration: true, isPreview: true },
          },
        },
      },
    },
  });
  return course;
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
): Promise<{ error?: string }> {
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

  if (!existing) {
    await db.lessonProgress.create({
      data: { userId, lessonId },
    });
  }

  // Auto-complete enrollment when all lessons are done
  const [totalLessons, completedCount] = await Promise.all([
    db.lesson.count({ where: { module: { courseId } } }),
    db.lessonProgress.count({
      where: { userId, lesson: { module: { courseId } } },
    }),
  ]);

  if (totalLessons > 0 && completedCount >= totalLessons) {
    await db.enrollment.updateMany({
      where: { userId, courseId, status: "ACTIVE" },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  revalidatePath(`/courses/${courseSlug}/watch/${lessonId}`);

  return {};
}

// ── Course player ─────────────────────────────────────────────────────────────

export async function getPlayerData(slug: string, userId: string) {
  return getCourseForPlayer(slug, userId);
}

export async function getProgressSet(userId: string, lessonIds: string[]) {
  return getLessonProgress(userId, lessonIds);
}
