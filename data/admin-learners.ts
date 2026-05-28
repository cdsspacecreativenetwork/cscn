import { db } from "@/lib/db";

export type AdminLearnersFilter = {
  page?: number;
  query?: string;
  sort?: string;
  status?: string;
};

export const ADMIN_LEARNERS_PAGE_SIZE = 25;

function getSort(sort?: string) {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "name") return { name: "asc" as const };
  if (sort === "last-active") return { updatedAt: "desc" as const };
  return { createdAt: "desc" as const };
}

export async function getAdminLearners(filters: AdminLearnersFilter = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const query = filters.query?.trim();
  const where = {
    role: "USER" as const,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { headline: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.status === "active" ? { enrollments: { some: { status: "ACTIVE" as const } } } : {}),
    ...(filters.status === "completed" ? { enrollments: { some: { status: "COMPLETED" as const } } } : {}),
    ...(filters.status === "not-started" ? { enrollments: { none: {} } } : {}),
  };

  const [learners, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: getSort(filters.sort),
      skip: (page - 1) * ADMIN_LEARNERS_PAGE_SIZE,
      take: ADMIN_LEARNERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        createdAt: true,
        updatedAt: true,
        currentStreak: true,
        longestStreak: true,
        enrollments: {
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
                certificateEnabled: true,
                modules: {
                  select: {
                    lessons: { select: { id: true } },
                  },
                },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        watchSegments: {
          select: { secondsWatched: true, lastSeenAt: true },
        },
        progress: {
          select: { lessonId: true, percentComplete: true, completedAt: true },
        },
        achievements: {
          select: { id: true },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  return {
    learners: learners.map((learner) => {
      const totalLessons = learner.enrollments.reduce(
        (sum, enrollment) =>
          sum + enrollment.course.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0),
        0
      );
      const completedLessons = learner.progress.filter((row) => row.percentComplete >= 100 || row.completedAt).length;
      const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
      const activeEnrollments = learner.enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length;
      const completedEnrollments = learner.enrollments.filter((enrollment) => enrollment.status === "COMPLETED").length;
      const certificateReady = learner.enrollments.filter(
        (enrollment) => enrollment.completedAt && enrollment.course.certificateEnabled
      ).length;
      const secondsWatched = learner.watchSegments.reduce((sum, row) => sum + row.secondsWatched, 0);
      const lastActivity = [
        learner.updatedAt,
        ...learner.watchSegments.map((row) => row.lastSeenAt),
        ...learner.progress.map((row) => row.completedAt).filter((date): date is Date => Boolean(date)),
      ].sort((a, b) => b.getTime() - a.getTime())[0];

      return {
        id: learner.id,
        name: learner.name,
        email: learner.email,
        image: learner.image,
        headline: learner.headline,
        createdAt: learner.createdAt,
        lastActivity,
        enrollments: learner.enrollments.length,
        activeEnrollments,
        completedEnrollments,
        certificateReady,
        progressPercent,
        hoursWatched: Math.floor(secondsWatched / 3600),
        currentStreak: learner.currentStreak,
        longestStreak: learner.longestStreak,
        achievements: learner.achievements.length,
        recentCourse: learner.enrollments[0]?.course
          ? {
              title: learner.enrollments[0].course.title,
              slug: learner.enrollments[0].course.slug,
            }
          : null,
      };
    }),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_LEARNERS_PAGE_SIZE)),
  };
}

export async function getAdminLearnerStats() {
  const [totalLearners, enrolledLearners, completedLearners, certificateReady, activeEnrollments] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where: { role: "USER", enrollments: { some: {} } } }),
    db.user.count({ where: { role: "USER", enrollments: { some: { status: "COMPLETED" } } } }),
    db.enrollment.count({ where: { completedAt: { not: null }, course: { certificateEnabled: true } } }),
    db.enrollment.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    totalLearners,
    enrolledLearners,
    notStartedLearners: Math.max(0, totalLearners - enrolledLearners),
    completedLearners,
    certificateReady,
    activeEnrollments,
  };
}
