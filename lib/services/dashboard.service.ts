import { db } from "@/lib/db";
import { getActiveAnnouncementsForRole } from "@/data/announcements";
import { getInstructorEarningsSummary } from "@/data/admin-billing";

export interface CourseData {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: string;
  enrollmentCount: number;
  rating?: number;
  price?: number | null;
}

export interface EnrollmentData {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  categoryName: string;
  instructorName: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  nextActivity?: string;
  nextActivityType?: string;
  nextActivityDuration?: string;
  nextLessonId?: string;
}

export interface AnnouncementData {
  id: string;
  emoji: string;
  title: string;
  time: string;
  body?: string;
  linkUrl?: string | null;
}

export interface ScheduleData {
  id: string;
  time: string;
  duration: string;
  title: string;
  type: string;
}

export interface InstructorDashboardData {
  totalStudents: number;
  monthlyRevenue: number;
  avgCourseRating: number;
  activeCoursesCount: number;
  availableEarnings: number;
  pendingEarnings: number;
  payoutThreshold: number;
  earningsCurrency: string;
  myCourses: CourseData[];
  studentEnrollments: EnrollmentData[];
  announcements: AnnouncementData[];
  schedule: ScheduleData[];
  recommendations: RecommendationData[];
  isNewInstructor: boolean;
}

export interface RecommendationData {
  id: string;
  title: string;
  slug: string;
  firstLessonId?: string;
  shortDesc: string | null;
  difficulty: string;
  category: string;
  activity: string;
  type: string;
  duration: string;
  thumbnail: string | null;
}

export interface StudentDashboardData {
  coursesEnrolled: number;
  hoursSpent: string;
  completionRate: number;
  learningStreak: string;
  activeEnrollments: EnrollmentData[];
  announcements: AnnouncementData[];
  recommendations: RecommendationData[];
  schedule: ScheduleData[];
}

// Helper to format date relative or static strings
function formatDateString(date: Date | null): string {
  if (!date) return "Recently";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function mapDashboardAnnouncements(
  announcements: Awaited<ReturnType<typeof getActiveAnnouncementsForRole>>
): AnnouncementData[] {
  return announcements.map((announcement) => ({
    id: announcement.id,
    emoji: announcement.priority >= 7 ? "!" : "i",
    title: announcement.title,
    time: formatDateString(announcement.publishedAt || announcement.createdAt),
    body: announcement.body,
    linkUrl: announcement.linkUrl,
  }));
}

const difficultyRank = { ALL_LEVELS: 1, BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 } as const;

function getSafeThumbnail(thumbnail: string | null) {
  if (!thumbnail) return null;
  if (thumbnail.includes("img.youtube.com") || thumbnail.includes("i.ytimg.com")) {
    return thumbnail.replace("maxresdefault.jpg", "hqdefault.jpg");
  }
  return thumbnail;
}

function getNextDifficulty(difficulties: string[]) {
  const highest = Math.max(0, ...difficulties.map((difficulty) => difficultyRank[difficulty as keyof typeof difficultyRank] ?? 0));
  if (highest <= 1) return "INTERMEDIATE";
  if (highest === 2) return "ADVANCED";
  return "ADVANCED";
}

async function getRecommendedCourses(userId: string, limit = 3): Promise<RecommendationData[]> {
  const enrollments = await db.enrollment.findMany({
    where: { userId, status: { not: "CANCELLED" } },
    select: {
      status: true,
      course: {
        select: {
          id: true,
          categoryId: true,
          difficulty: true,
        },
      },
    },
  });

  const preferredCategoryIds = new Set(
    enrollments
      .map((enrollment) => enrollment.course.categoryId)
      .filter((categoryId): categoryId is string => Boolean(categoryId))
  );
  const completedCategoryIds = new Set(
    enrollments
      .filter((enrollment) => enrollment.status === "COMPLETED")
      .map((enrollment) => enrollment.course.categoryId)
      .filter((categoryId): categoryId is string => Boolean(categoryId))
  );
  const nextDifficulty = getNextDifficulty(enrollments.map((enrollment) => enrollment.course.difficulty));

  const candidates = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      instructorId: { not: userId },
      enrollments: { none: { userId } },
      modules: {
        some: {
          isPublished: true,
          lessons: { some: { isPublished: true } },
        },
      },
    },
    orderBy: [
      { featuredOrder: "asc" },
      { updatedAt: "desc" },
    ],
    take: 40,
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      shortDesc: true,
      difficulty: true,
      updatedAt: true,
      featuredOrder: true,
      categoryId: true,
      category: { select: { name: true } },
      _count: { select: { enrollments: true, ratings: true } },
      modules: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        take: 1,
        select: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            take: 1,
            select: { id: true, title: true, contentType: true, duration: true },
          },
        },
      },
    },
  });

  if (candidates.length === 0) return [];

  const ratingRows = await db.courseRating.groupBy({
    by: ["courseId"],
    where: { courseId: { in: candidates.map((course) => course.id) } },
    _avg: { rating: true },
  });
  const ratingMap = new Map(ratingRows.map((row) => [row.courseId, row._avg.rating ?? 0]));
  const now = Date.now();

  return candidates
    .map((course) => {
      const sameCategoryBoost = course.categoryId && preferredCategoryIds.has(course.categoryId) ? 45 : 0;
      const completedPathBoost = course.categoryId && completedCategoryIds.has(course.categoryId) ? 12 : 0;
      const difficultyBoost = course.difficulty === nextDifficulty ? 20 : 0;
      const featuredBoost = course.featuredOrder ? Math.max(0, 18 - course.featuredOrder) : 0;
      const popularityBoost = Math.min(course._count.enrollments, 100) * 0.18;
      const ratingBoost = (ratingMap.get(course.id) ?? 0) * 5;
      const freshnessDays = Math.max(0, (now - course.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      const freshnessBoost = Math.max(0, 10 - freshnessDays / 14);
      const coldStartBoost = enrollments.length === 0 ? 8 : 0;

      return {
        course,
        score:
          sameCategoryBoost +
          completedPathBoost +
          difficultyBoost +
          featuredBoost +
          popularityBoost +
          ratingBoost +
          freshnessBoost +
          coldStartBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ course }) => {
      const firstLesson = course.modules[0]?.lessons[0];
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDesc: course.shortDesc,
        difficulty: course.difficulty,
        category: course.category?.name ?? "CSCN",
        firstLessonId: firstLesson?.id,
        activity: firstLesson?.title ?? "Start with the course introduction",
        type: firstLesson?.contentType === "ARTICLE" ? "Reading" : "Video",
        duration: firstLesson?.duration ? `${firstLesson.duration} minutes` : "Self-paced",
        thumbnail: getSafeThumbnail(course.thumbnail),
      };
    });
}

export async function getInstructorDashboardData(userId: string, role?: string | null): Promise<InstructorDashboardData> {
  // 1. Fetch courses taught by this instructor
  const courses = await db.course.findMany({
    where: {
      OR: [
        { instructorId: userId },
        { instructors: { some: { userId } } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      status: true,
      price: true,
      _count: { select: { enrollments: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        select: { userId: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const distinctStudents = new Set<string>();
  let activeCoursesCount = 0;

  const myCourses: CourseData[] = courses.map(c => {
    if (c.status === 'PUBLISHED') activeCoursesCount++;
    c.enrollments.forEach(e => distinctStudents.add(e.userId));
    const priceNum = c.price ? Number(c.price) : 0; // Real value fallback

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      thumbnail: getSafeThumbnail(c.thumbnail),
      status: c.status,
      enrollmentCount: c._count.enrollments,
      price: c.price ? priceNum : null,
    };
  });

  const isNewInstructor = courses.length === 0;
  const earnings = await getInstructorEarningsSummary(userId);

  // 2. Fetch student enrollments for this instructor (compact learning strip)
  const rawEnrollments = await db.enrollment.findMany({
    where: { userId, status: 'ACTIVE' },
    select: {
      id: true,
      enrolledAt: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          category: { select: { name: true } },
          instructor: { select: { name: true } },
          modules: {
            select: {
              lessons: {
                select: { id: true, title: true, duration: true, contentType: true },
              },
            },
          },
        },
      },
    },
  });

  const instructorRecentWatchSegments = await db.lessonWatchSegment.findMany({
    where: { userId },
    orderBy: { lastSeenAt: 'desc' },
    take: 100,
    select: {
      lastSeenAt: true,
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  });
  const instructorLastInteractionByCourse = new Map<string, Date>();
  for (const segment of instructorRecentWatchSegments) {
    const courseId = segment.lesson.module.courseId;
    if (!instructorLastInteractionByCourse.has(courseId)) {
      instructorLastInteractionByCourse.set(courseId, segment.lastSeenAt);
    }
  }
  const sortedInstructorEnrollments = [...rawEnrollments].sort((a, b) => {
    const aTime = instructorLastInteractionByCourse.get(a.course.id)?.getTime() ?? a.enrolledAt.getTime();
    const bTime = instructorLastInteractionByCourse.get(b.course.id)?.getTime() ?? b.enrolledAt.getTime();
    return bTime - aTime;
  });

  const studentEnrollments: EnrollmentData[] = await Promise.all(
    sortedInstructorEnrollments.map(async (e) => {
      const allLessons = e.course.modules.flatMap(m => m.lessons);
      const totalLessons = allLessons.length;

      const progressRows = await db.lessonProgress.findMany({
        where: {
          userId,
          percentComplete: { gte: 100 },
          lesson: { module: { courseId: e.course.id } },
        },
        select: { lessonId: true },
      });
      const completedIds = new Set(progressRows.map(r => r.lessonId));
      const completedLessons = completedIds.size;

      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const nextLesson = allLessons.find(l => !completedIds.has(l.id)) || allLessons[0];

      return {
        id: e.id,
        courseId: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        thumbnail: getSafeThumbnail(e.course.thumbnail),
        categoryName: e.course.category?.name || "CSCN",
        instructorName: e.course.instructor?.name || "Instructor",
        progressPercent,
        completedLessons,
        totalLessons,
        nextActivity: nextLesson?.title,
        nextActivityType: nextLesson?.contentType === 'ARTICLE' ? 'Reading' : 'Video',
        nextActivityDuration: nextLesson?.duration ? `${nextLesson.duration} minutes` : undefined,
        nextLessonId: nextLesson?.id,
      };
    })
  );

  const announcements = mapDashboardAnnouncements(await getActiveAnnouncementsForRole(role ?? "INSTRUCTOR"));

  const ratingAggregation = await db.courseRating.aggregate({
    where: {
      course: {
        OR: [
          { instructorId: userId },
          { instructors: { some: { userId } } },
        ],
      },
    },
    _avg: { rating: true },
  });
  const avgCourseRating = ratingAggregation._avg.rating
    ? Number(ratingAggregation._avg.rating.toFixed(1))
    : 0;

  if (isNewInstructor) {
    return {
      totalStudents: 0,
      monthlyRevenue: 0,
      avgCourseRating: 0.0,
      activeCoursesCount: 0,
      availableEarnings: earnings.available,
      pendingEarnings: earnings.pending,
      payoutThreshold: earnings.threshold,
      earningsCurrency: earnings.displayCurrency,
      myCourses: [],
      studentEnrollments: [],
      announcements,
      schedule: [],
      recommendations: await getRecommendedCourses(userId),
      isNewInstructor: true,
    };
  }

  return {
    totalStudents: distinctStudents.size,
    monthlyRevenue: earnings.thisMonth,
    avgCourseRating,
    activeCoursesCount,
    availableEarnings: earnings.available,
    pendingEarnings: earnings.pending,
    payoutThreshold: earnings.threshold,
    earningsCurrency: earnings.displayCurrency,
    myCourses,
    studentEnrollments,
    announcements,
    schedule: [],
    recommendations: await getRecommendedCourses(userId),
    isNewInstructor: false,
  };
}

export async function getStudentDashboardData(userId: string, role?: string | null): Promise<StudentDashboardData> {
  const rawEnrollments = await db.enrollment.findMany({
    where: { userId, status: { not: 'CANCELLED' } },
    select: {
      id: true,
      status: true,
      enrolledAt: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          category: { select: { name: true } },
          instructor: { select: { name: true } },
          modules: {
            select: {
              lessons: {
                select: { id: true, title: true, duration: true, contentType: true },
              },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  const recentWatchSegments = await db.lessonWatchSegment.findMany({
    where: { userId },
    orderBy: { lastSeenAt: 'desc' },
    take: 100,
    select: {
      lastSeenAt: true,
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  });
  const lastInteractionByCourse = new Map<string, Date>();
  for (const segment of recentWatchSegments) {
    const courseId = segment.lesson.module.courseId;
    if (!lastInteractionByCourse.has(courseId)) {
      lastInteractionByCourse.set(courseId, segment.lastSeenAt);
    }
  }
  const sortedEnrollments = [...rawEnrollments].sort((a, b) => {
    const aTime = lastInteractionByCourse.get(a.course.id)?.getTime() ?? a.enrolledAt.getTime();
    const bTime = lastInteractionByCourse.get(b.course.id)?.getTime() ?? b.enrolledAt.getTime();
    return bTime - aTime;
  });

  let totalHoursSpent = 0;
  let totalCompletedLessonsAcrossAll = 0;
  let totalLessonsAcrossAll = 0;

  const activeEnrollments: EnrollmentData[] = await Promise.all(
    sortedEnrollments.map(async (e) => {
      const allLessons = e.course.modules.flatMap(m => m.lessons);
      const totalLessons = allLessons.length;
      totalLessonsAcrossAll += totalLessons;

      const progressRows = await db.lessonProgress.findMany({
        where: {
          userId,
          percentComplete: { gte: 100 },
          lesson: { module: { courseId: e.course.id } },
        },
        select: { lessonId: true },
      });
      const completedIds = new Set(progressRows.map(r => r.lessonId));
      const completedLessons = completedIds.size;
      totalCompletedLessonsAcrossAll += completedLessons;

      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const nextLesson = allLessons.find(l => !completedIds.has(l.id)) || allLessons[0];

      return {
        id: e.id,
        courseId: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        thumbnail: getSafeThumbnail(e.course.thumbnail),
        categoryName: e.course.category?.name || "CSCN",
        instructorName: e.course.instructor?.name || "Instructor",
        progressPercent,
        completedLessons,
        totalLessons,
        nextActivity: nextLesson?.title,
        nextActivityType: nextLesson?.contentType === 'ARTICLE' ? 'Reading' : 'Video',
        nextActivityDuration: nextLesson?.duration ? `${nextLesson.duration} minutes` : undefined,
        nextLessonId: nextLesson?.id,
      };
    })
  );

  const watchSummary = await db.lessonWatchSegment.aggregate({
    where: { userId },
    _sum: { secondsWatched: true },
  });
  totalHoursSpent = Math.floor((watchSummary._sum.secondsWatched ?? 0) / 3600);

  // Calculate streak gracefully regardless of Prisma Client generation state
  let streakRows: any[] = [];
  if (db.dailyActivity) {
    streakRows = await db.dailyActivity.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  let streakCount = 0;
  if (streakRows.length > 0) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let currentDate = streakRows[0].date === todayStr ? todayStr : (streakRows[0].date === yesterdayStr ? yesterdayStr : null);
    if (currentDate) {
      streakCount = 1;
      let currObj = new Date(currentDate);
      for (let i = 1; i < streakRows.length; i++) {
        currObj.setDate(currObj.getDate() - 1);
        const expectedStr = currObj.toISOString().slice(0, 10);
        if (streakRows[i].date === expectedStr) {
          streakCount++;
        } else {
          break;
        }
      }
    }
  }

  const hoursSpentStr = `${totalHoursSpent}h`;
  const completionRate = totalLessonsAcrossAll > 0 ? Math.round((totalCompletedLessonsAcrossAll / totalLessonsAcrossAll) * 100) : 0;

  const announcements = mapDashboardAnnouncements(await getActiveAnnouncementsForRole(role ?? "USER"));

  return {
    coursesEnrolled: rawEnrollments.length,
    hoursSpent: hoursSpentStr,
    completionRate,
    learningStreak: `${streakCount}d`,
    activeEnrollments,
    announcements,
    recommendations: await getRecommendedCourses(userId),
    schedule: [],
  };
}
