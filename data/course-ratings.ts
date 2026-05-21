import { db } from "@/lib/db";

export async function getCourseRatingSummary(courseId: string) {
  const result = await db.courseRating.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    average: result._avg.rating ? Number(result._avg.rating.toFixed(1)) : 0,
    count: result._count.rating,
  };
}

export async function getUserCourseRating(courseId: string, studentId: string) {
  return db.courseRating.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: {
      id: true,
      rating: true,
      comment: true,
      updatedAt: true,
    },
  });
}

export async function upsertCourseRating(
  courseId: string,
  studentId: string,
  data: { rating: number; comment?: string | null }
) {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: studentId, courseId } },
    select: { id: true, status: true },
  });

  if (!enrollment) {
    throw new Error("You must be enrolled before rating this course.");
  }

  if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }

  return db.courseRating.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    create: {
      courseId,
      studentId,
      rating: data.rating,
      comment: data.comment?.trim() || null,
    },
    update: {
      rating: data.rating,
      comment: data.comment?.trim() || null,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      updatedAt: true,
    },
  });
}
