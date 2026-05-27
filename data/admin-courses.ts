import { db } from "@/lib/db";

export async function getCourseAnalyticsAdmin(courseId: string) {
  const [enrollments, lessonProgressRows, lessons, watchSegments] = await Promise.all([
    db.enrollment.findMany({
      where: { courseId },
      select: { status: true, enrolledAt: true },
      orderBy: { enrolledAt: "asc" },
    }),
    db.lessonProgress.findMany({
      where: {
        percentComplete: { gte: 100 },
        lesson: { module: { courseId } },
      },
      select: { lessonId: true },
    }),
    db.lesson.findMany({
      where: { module: { courseId } },
      orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
      select: { id: true, title: true, contentType: true, module: { select: { title: true } } },
    }),
    db.lessonWatchSegment.groupBy({
      by: ["lessonId", "segmentIndex"],
      where: { lesson: { module: { courseId } } },
      _count: { userId: true },
      _sum: { secondsWatched: true },
      orderBy: [{ lessonId: "asc" }, { segmentIndex: "asc" }],
    }),
  ]);

  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED").length;
  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE").length;
  const completionRate =
    totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  const completionMap = new Map<string, number>();
  for (const row of lessonProgressRows) {
    completionMap.set(row.lessonId, (completionMap.get(row.lessonId) ?? 0) + 1);
  }
  const lessonCompletions = lessons.map((l) => ({
    lessonId: l.id,
    title: l.title,
    moduleTitle: l.module.title,
    count: completionMap.get(l.id) ?? 0,
  }));

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyMap = new Map<string, number>();
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const e of enrollments) {
    if (e.enrolledAt >= thirtyDaysAgo) {
      const key = e.enrolledAt.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }
  const enrollmentsOverTime = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const watchSegmentMap = new Map<string, { segmentIndex: number; label: string; viewers: number; secondsWatched: number }[]>();
  for (const segment of watchSegments) {
    const startSeconds = segment.segmentIndex * 30;
    const endSeconds = startSeconds + 30;
    const label = `${Math.floor(startSeconds / 60)}:${String(startSeconds % 60).padStart(2, "0")}-${Math.floor(endSeconds / 60)}:${String(endSeconds % 60).padStart(2, "0")}`;
    const current = watchSegmentMap.get(segment.lessonId) ?? [];
    current.push({
      segmentIndex: segment.segmentIndex,
      label,
      viewers: segment._count.userId,
      secondsWatched: segment._sum.secondsWatched ?? 0,
    });
    watchSegmentMap.set(segment.lessonId, current);
  }

  const watchDropOff = lessons
    .filter((lesson) => lesson.contentType === "VIDEO")
    .map((lesson) => ({
      lessonId: lesson.id,
      title: lesson.title,
      moduleTitle: lesson.module.title,
      segments: watchSegmentMap.get(lesson.id) ?? [],
    }));

  return {
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    completionRate,
    lessonCompletions,
    enrollmentsOverTime,
    watchDropOff,
  };
}

export async function getAllCoursesAdmin(adminId: string) {
  return db.course.findMany({
    where: {
      OR: [
        { status: { not: "DRAFT" } },
        { instructorId: adminId },
        { instructors: { some: { userId: adminId } } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      status: true,
      difficulty: true,
      featuredOrder: true,
      createdAt: true,
      updatedAt: true,
      instructorId: true,
      instructor: { select: { id: true, name: true, image: true, payoutSetup: true, payoutDetails: true } },
      price: true,
      baseCurrency: true,
      pricingProposals: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          proposedPrice: true,
          currentPriceSnapshot: true,
          currency: true,
          status: true,
          createdAt: true,
          submittedBy: { select: { name: true, email: true } },
        },
      },
      category: { select: { name: true } },
      _count: { select: { enrollments: true } },
      modules: { select: { _count: { select: { lessons: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

import { checkAndAwardAchievements } from "@/lib/services/achievements.service";

export async function adminToggleCoursePublish(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      status: true,
      instructorId: true,
      thumbnail: true,
      promoVideo: true,
      price: true,
      instructor: { select: { payoutSetup: true, payoutDetails: true } },
      modules: {
        where: { isPublished: true },
        take: 1,
        select: {
          lessons: {
            where: { isPublished: true },
            take: 1,
            select: { id: true },
          },
        },
      },
      pricingProposals: {
        where: { status: "PENDING" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!course) throw new Error("Not found");
  const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  if (newStatus === "PUBLISHED" && course.pricingProposals.length > 0) {
    throw new Error("Approve or reject the pending course price before publishing this course.");
  }

  if (newStatus === "PUBLISHED") {
    if (!course.thumbnail) {
      throw new Error("Add a course thumbnail before publishing this course.");
    }
    if (!course.promoVideo) {
      throw new Error("Add a course trailer before publishing this course.");
    }
    if (!course.modules.some((module) => module.lessons.length > 0)) {
      throw new Error("Publish at least one module and one lesson before publishing this course.");
    }
  }

  if (newStatus === "PUBLISHED" && course.price && Number(course.price) > 0) {
    const payoutDetails = (course.instructor.payoutDetails as { payoutCountry?: unknown; preferredCurrency?: unknown }) || {};
    if (!course.instructor.payoutSetup || !payoutDetails.payoutCountry || !payoutDetails.preferredCurrency) {
      throw new Error("Complete the instructor payout region and payout setup before publishing a paid course.");
    }
  }
  
  const updated = await db.course.update({
    where: { id: courseId },
    data: { status: newStatus },
    select: { status: true },
  });

  if (newStatus === "PUBLISHED") {
    // A: Check lifetime published courses count for this instructor
    const publishedCount = await db.course.count({
      where: { instructorId: course.instructorId, status: "PUBLISHED" },
    });
    // B: Trigger PUBLISH_COURSE achievements check
    await checkAndAwardAchievements(course.instructorId, "PUBLISH_COURSE", publishedCount);
  }

  return updated;
}

export async function getStudioCourseAdmin(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shortDesc: true,
      thumbnail: true,
      promoVideo: true,
      difficulty: true,
      status: true,
      previewCount: true,
      categoryId: true,
      requirements: true,
      includes: true,
      certificateEnabled: true,
      examGated: true,
      metaTitle: true,
      metaDescription: true,
      price: true,
      baseCurrency: true,
      instructor: { select: { payoutDetails: true } },
      pricingProposals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          proposedPrice: true,
          currentPriceSnapshot: true,
          currency: true,
          status: true,
          adminNote: true,
          createdAt: true,
          reviewedAt: true,
        },
      },
      finalExamId: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          isPublished: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              videoUrl: true,
              overview: true,
              duration: true,
              isPublished: true,
              isPreview: true,
              transcript: true,
              bodyContent: true,
              contentType: true,
              quiz: {
                select: {
                  id: true,
                  mode: true,
                  instructions: true,
                  passingScore: true,
                  maxAttempts: true,
                  showAnswers: true,
                  gateUntilPassed: true,
                  shuffleQuestions: true,
                  timeLimitMinutes: true,
                  questions: {
                    orderBy: { position: "asc" },
                    select: {
                      id: true,
                      type: true,
                      prompt: true,
                      explanation: true,
                      points: true,
                      position: true,
                      required: true,
                      options: {
                        orderBy: { position: "asc" },
                        select: { id: true, text: true, isCorrect: true, position: true },
                      },
                    },
                  },
                },
              },
              muxStatus: true,
              muxPlaybackId: true,
              resources: {
                select: { id: true, title: true, url: true, type: true },
              },
            },
          },
        },
      },
    },
  });
}
