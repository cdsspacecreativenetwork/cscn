"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { submitCourseReview } from "@/data/course-reviews";
import { adminToggleCoursePublish } from "@/data/admin-courses";
import { postFeedback } from "@/data/course-feedback";
import type { ReviewStatus } from "@prisma/client";
import { assertEmailVerifiedByUserId } from "@/lib/trust-gates";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const { role } = session.user;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  await assertEmailVerifiedByUserId(session.user.id);
  return session.user.id;
}

export async function adminTogglePublishAction(courseId: string) {
  await requireAdmin();
  const result = await adminToggleCoursePublish(courseId);
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
  return result;
}

export async function reviewCourseAction(
  courseId: string,
  status: ReviewStatus,
  comment?: string
) {
  try {
    const adminId = await requireAdmin();
    await submitCourseReview(courseId, adminId, status, comment?.trim() || undefined);
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit review" };
  }
}

export async function toggleFeatureAction(
  courseId: string,
  currentOrder: number | null
) {
  try {
    await requireAdmin();

    if (currentOrder !== null) {
      await db.course.update({ where: { id: courseId }, data: { featuredOrder: null } });
    } else {
      const course = await db.course.findUnique({ where: { id: courseId }, select: { status: true } });
      if (course?.status === "PENDING_REVIEW") {
        return { error: "Cannot feature a course that is currently under review." };
      }
      const featured = await db.course.findMany({
        where: { featuredOrder: { not: null } },
        select: { featuredOrder: true },
      });
      const used = new Set(featured.map((c) => c.featuredOrder));
      let slot: number | null = null;
      for (let i = 1; i <= 8; i++) {
        if (!used.has(i)) { slot = i; break; }
      }
      if (!slot) return { error: "All 8 featured slots are in use. Remove one first." };
      await db.course.update({ where: { id: courseId }, data: { featuredOrder: slot } });
    }

    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update featured status" };
  }
}

export async function adminArchiveCourseAction(courseId: string) {
  try {
    await requireAdmin();
    await db.course.update({ where: { id: courseId }, data: { status: "ARCHIVED" } });
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to archive course" };
  }
}

export async function adminRestoreCourseAction(courseId: string) {
  try {
    await requireAdmin();
    await db.course.update({ where: { id: courseId }, data: { status: "DRAFT" } });
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to restore course" };
  }
}

export async function postFeedbackAction(courseId: string, body: string) {
  try {
    const adminId = await requireAdmin();
    const item = await postFeedback(courseId, adminId, body.trim());
    revalidatePath(`/dashboard/admin/courses/${courseId}`);
    revalidatePath(`/dashboard/instructor/courses/${courseId}`);
    return { success: true, item };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post feedback" };
  }
}
