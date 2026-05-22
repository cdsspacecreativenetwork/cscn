import { db } from "@/lib/db";

export async function getCourseAnalyticsAdmin(courseId: string) {
  const [enrollments, lessonProgressRows, lessons] = await Promise.all([
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
      select: { id: true, title: true, module: { select: { title: true } } },
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

  return {
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    completionRate,
    lessonCompletions,
    enrollmentsOverTime,
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
      instructor: { select: { id: true, name: true, image: true } },
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
    select: { status: true, instructorId: true },
  });
  if (!course) throw new Error("Not found");
  const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  
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
      finalExamId: true,
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
              videoUrl: true,
              duration: true,
              isPreview: true,
              transcript: true,
              bodyContent: true,
              contentType: true,
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
