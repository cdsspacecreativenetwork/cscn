import { db } from "@/lib/db";

export const COURSES_PAGE_SIZE = 12;

// ── Public catalog ──────────────────────────────────────────────────────────

export async function getPublishedCourses(page = 1, categorySlug?: string) {
  const where = {
    status: "PUBLISHED" as const,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * COURSES_PAGE_SIZE,
      take: COURSES_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDesc: true,
        thumbnail: true,
        difficulty: true,
        previewCount: true,
        category: { select: { name: true, slug: true } },
        instructor: { select: { id: true, name: true, image: true, headline: true } },
        _count: { select: { modules: true, enrollments: true } },
        modules: {
          select: {
            _count: { select: { lessons: true } },
          },
        },
      },
    }),
    db.course.count({ where }),
  ]);

  return {
    courses,
    total,
    page,
    totalPages: Math.ceil(total / COURSES_PAGE_SIZE),
  };
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}

// ── Course detail (public) ──────────────────────────────────────────────────

export async function getCourseBySlug(slug: string) {
  return db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shortDesc: true,
      thumbnail: true,
      promoVideo: true,
      difficulty: true,
      previewCount: true,
      requirements: true,
      includes: true,
      category: { select: { name: true, slug: true } },
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          bio: true,
        },
      },
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              duration: true,
              isPreview: true,
              contentType: true,
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

// ── Enrollment ──────────────────────────────────────────────────────────────

export async function getUserEnrollment(userId: string, courseId: string) {
  return db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

export async function getUserEnrollments(userId: string) {
  return db.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          difficulty: true,
          instructor: { select: { name: true } },
          modules: {
            select: { _count: { select: { lessons: true } } },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });
}

// ── Lesson + progress ───────────────────────────────────────────────────────

export async function getLessonWithAccess(
  lessonId: string,
  userId: string | undefined
) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              previewCount: true,
              status: true,
              instructorId: true,
            },
          },
        },
      },
      resources: true,
    },
  });

  if (!lesson || lesson.module.course.status !== "PUBLISHED") return null;

  const course = lesson.module.course;

  // Instructors and admins always have access — handled at the page level
  // Here we just return the lesson; access gating happens in the page
  return { lesson, course };
}

export async function getLessonProgress(userId: string, lessonIds: string[]) {
  const rows = await db.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds } },
    select: { lessonId: true },
  });
  return new Set(rows.map((r) => r.lessonId));
}

// ── Dashboard enrollments ────────────────────────────────────────────────────

export async function getEnrollmentsForDashboard(userId: string) {
  return db.enrollment.findMany({
    where: { userId, status: { not: "CANCELLED" } },
    select: {
      id: true,
      status: true,
      enrolledAt: true,
      completedAt: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          difficulty: true,
          duration: true,
          category: { select: { name: true } },
          instructor: { select: { name: true, image: true } },
          modules: {
            orderBy: { position: "asc" },
            select: {
              _count: { select: { lessons: true } },
              lessons: {
                orderBy: { position: "asc" },
                take: 1,
                select: { id: true },
              },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });
}

// ── Course player (enrolled view) ────────────────────────────────────────────

export async function getCourseForPlayer(slug: string, userId: string) {
  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      instructorId: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              duration: true,
              isPreview: true,
              contentType: true,
              videoUrl: true,
              transcript: true,
              resources: true,
            },
          },
        },
      },
    },
  });

  if (!course) return null;

  const enrollment = await getUserEnrollment(userId, course.id);

  // Flatten all lesson IDs to fetch progress in one query
  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedSet = await getLessonProgress(userId, allLessonIds);

  return { course, enrollment, completedSet };
}
