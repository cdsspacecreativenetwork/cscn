"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  getCourseRatingSummary,
  upsertCourseRating,
} from "@/data/course-ratings";
import { db } from "@/lib/db";

export async function submitCourseRatingAction(
  courseId: string,
  data: { rating: number; comment?: string | null }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const rating = await upsertCourseRating(courseId, session.user.id, data);
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { slug: true },
    });

    if (course?.slug) {
      revalidatePath(`/courses/${course.slug}`);
      revalidatePath(`/dashboard/courses`);
    }

    const summary = await getCourseRatingSummary(courseId);
    return { rating, summary };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save rating.",
    };
  }
}
