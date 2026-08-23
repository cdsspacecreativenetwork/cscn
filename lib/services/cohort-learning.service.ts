import { db } from "@/lib/db";

const membershipStatuses = ["ACTIVE", "COMPLETED"] as const;

export async function getLearnerCohorts(userId: string) {
  return db.cohortMembership.findMany({
    where: { userId, role: "LEARNER", status: { in: [...membershipStatuses] } },
    orderBy: { cohort: { startsAt: "asc" } },
    select: {
      id: true,
      status: true,
      joinedAt: true,
      completedAt: true,
      cohort: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          scheduleSummary: true,
          program: {
            select: {
              title: true,
              shortDescription: true,
              estimatedDurationWeeks: true,
              school: { select: { name: true } },
              _count: { select: { courses: true } },
            },
          },
        },
      },
    },
  });
}

export async function getCohortLearningDashboard(userId: string, cohortSlug: string) {
  const membership = await db.cohortMembership.findFirst({
    where: {
      userId,
      role: "LEARNER",
      status: { in: [...membershipStatuses] },
      cohort: { slug: cohortSlug },
    },
    select: {
      id: true,
      status: true,
      joinedAt: true,
      completedAt: true,
      cohort: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          scheduleSummary: true,
          weeklySchedule: true,
          graduationRules: true,
          projects: {
            where: { status: "PUBLISHED" },
            orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              brief: true,
              dueAt: true,
              submissions: {
                where: { userId },
                select: { status: true, currentVersion: true },
                take: 1,
              },
              _count: { select: { rubricCriteria: true } },
            },
          },
          leadInstructor: { select: { name: true, image: true, headline: true } },
          program: {
            select: {
              title: true,
              shortDescription: true,
              estimatedDurationWeeks: true,
              school: { select: { name: true } },
              courses: {
                orderBy: { position: "asc" },
                select: {
                  position: true,
                  required: true,
                  minimumCompletionPercentage: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      shortDesc: true,
                      thumbnail: true,
                      modules: {
                        where: { isPublished: true },
                        orderBy: { position: "asc" },
                        select: {
                          lessons: {
                            where: { isPublished: true },
                            orderBy: { position: "asc" },
                            select: {
                              id: true,
                              title: true,
                              progress: {
                                where: { userId },
                                select: { percentComplete: true, completedAt: true },
                              },
                            },
                          },
                        },
                      },
                      enrollments: {
                        where: { userId, status: "ACTIVE" },
                        select: { id: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!membership) return null;

  const now = new Date();
  const [announcements, schedule] = await Promise.all([
    db.announcement.findMany({
      where: {
        cohortId: membership.cohort.id,
        status: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, body: true, priority: true, linkUrl: true, publishedAt: true, createdAt: true },
    }),
    db.scheduleEvent.findMany({
      where: {
        cohortId: membership.cohort.id,
        audience: "COHORT_MEMBERS",
        status: { in: ["SCHEDULED", "LIVE"] },
        startsAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: { id: true, type: true, status: true, title: true, description: true, startsAt: true, endsAt: true, timezone: true, meetingUrl: true },
    }),
  ]);

  const courses = membership.cohort.program.courses.map((item) => {
    const lessons = item.course.modules.flatMap((module) => module.lessons);
    const completedLessons = lessons.filter((lesson) => lesson.progress[0]?.completedAt || lesson.progress[0]?.percentComplete === 100).length;
    const progress = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
    const nextLesson = lessons.find((lesson) => !lesson.progress[0]?.completedAt && lesson.progress[0]?.percentComplete !== 100) ?? lessons[0] ?? null;
    return {
      id: item.course.id,
      title: item.course.title,
      slug: item.course.slug,
      shortDesc: item.course.shortDesc,
      thumbnail: item.course.thumbnail,
      position: item.position,
      required: item.required,
      minimumCompletionPercentage: item.minimumCompletionPercentage,
      lessonCount: lessons.length,
      completedLessons,
      progress,
      enrolled: item.course.enrollments.length > 0,
      nextLessonId: nextLesson?.id ?? null,
      nextLessonTitle: nextLesson?.title ?? null,
    };
  });

  const requiredCourses = courses.filter((course) => course.required);
  const overallProgress = requiredCourses.length
    ? Math.round(requiredCourses.reduce((sum, course) => sum + course.progress, 0) / requiredCourses.length)
    : 0;

  return {
    membership,
    announcements,
    schedule,
    courses,
    overallProgress,
    startsInFuture: membership.cohort.startsAt.getTime() > now.getTime(),
  };
}
