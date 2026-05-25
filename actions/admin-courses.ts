"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { submitCourseReview } from "@/data/course-reviews";
import { adminToggleCoursePublish } from "@/data/admin-courses";
import { postFeedback } from "@/data/course-feedback";
import type { ReviewStatus } from "@prisma/client";
import { assertEmailVerifiedByUserId } from "@/lib/trust-gates";
import { createNotification } from "@/data/notifications";

async function requireAdmin(scope?: "courses" | "billing") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const { role } = session.user;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  await assertEmailVerifiedByUserId(session.user.id);

  if (role !== "SUPER_ADMIN") {
    const permissions = session.user as typeof session.user & {
      canManageCourses?: boolean;
      canManageBilling?: boolean;
    };
    if (scope === "courses" && !permissions.canManageCourses) {
      throw new Error("You do not have permission to manage courses.");
    }
    if (scope === "billing" && !permissions.canManageBilling) {
      throw new Error("You do not have permission to approve pricing.");
    }
  }

  return session.user.id;
}

export async function adminTogglePublishAction(courseId: string) {
  await requireAdmin("courses");
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
    const adminId = await requireAdmin("courses");
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
    await requireAdmin("courses");

    if (currentOrder !== null) {
      await db.course.update({ where: { id: courseId }, data: { featuredOrder: null } });
      const remaining = await db.course.findMany({
        where: { featuredOrder: { not: null } },
        orderBy: { featuredOrder: "asc" },
        select: { id: true },
      });
      await Promise.all(
        remaining.map((course, index) =>
          db.course.update({ where: { id: course.id }, data: { featuredOrder: index + 1 } })
        )
      );
    } else {
      const course = await db.course.findUnique({ where: { id: courseId }, select: { status: true } });
      if (course?.status !== "PUBLISHED") {
        return { error: "Only published courses can be featured on the homepage." };
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
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update featured status" };
  }
}

export async function reorderFeaturedCoursesAction(orderedIds: string[]) {
  try {
    await requireAdmin("courses");
    const cleanIds = Array.from(new Set(orderedIds)).slice(0, 8);
    await Promise.all(
      cleanIds.map((id, index) =>
        db.course.update({
          where: { id },
          data: { featuredOrder: index + 1 },
        })
      )
    );
    revalidatePath("/dashboard/admin/courses");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reorder featured courses" };
  }
}

export async function adminArchiveCourseAction(courseId: string) {
  try {
    await requireAdmin("courses");
    await db.course.update({ where: { id: courseId }, data: { status: "ARCHIVED" } });
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to archive course" };
  }
}

export async function adminRestoreCourseAction(courseId: string) {
  try {
    await requireAdmin("courses");
    await db.course.update({ where: { id: courseId }, data: { status: "DRAFT" } });
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to restore course" };
  }
}

export async function postFeedbackAction(courseId: string, body: string) {
  try {
    const adminId = await requireAdmin("courses");
    const item = await postFeedback(courseId, adminId, body.trim());
    revalidatePath(`/dashboard/admin/courses/${courseId}`);
    revalidatePath(`/dashboard/instructor/courses/${courseId}`);
    return { success: true, item };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post feedback" };
  }
}

export async function approvePricingProposalAction(proposalId: string) {
  try {
    const adminId = await requireAdmin("billing");
    const proposal = await db.coursePricingProposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        status: true,
        proposedPrice: true,
        currency: true,
        courseId: true,
        course: { select: { title: true, instructorId: true } },
      },
    });

    if (!proposal) return { error: "Pricing proposal not found." };
    if (proposal.status !== "PENDING") return { error: "This pricing proposal has already been reviewed." };

    await db.$transaction([
      db.course.update({
        where: { id: proposal.courseId },
        data: {
          price: proposal.proposedPrice,
          baseCurrency: proposal.currency,
        },
      }),
      db.coursePricingProposal.update({
        where: { id: proposal.id },
        data: {
          status: "APPROVED",
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      }),
    ]);

    await createNotification(
      proposal.course.instructorId,
      "SYSTEM",
      `Pricing approved: ${proposal.course.title}`,
      `Your proposed course price has been approved and is now live in ${proposal.currency}.`,
      { courseId: proposal.courseId, proposalId: proposal.id }
    );

    revalidatePath(`/dashboard/admin/courses/${proposal.courseId}`);
    revalidatePath("/dashboard/admin/courses");
    revalidatePath(`/dashboard/instructor/courses/${proposal.courseId}`);
    revalidatePath("/dashboard/instructor/courses");
    revalidatePath("/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to approve pricing." };
  }
}

export async function rejectPricingProposalAction(proposalId: string, adminNote?: string) {
  try {
    const adminId = await requireAdmin("billing");
    const proposal = await db.coursePricingProposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        status: true,
        courseId: true,
        course: { select: { title: true, instructorId: true } },
      },
    });

    if (!proposal) return { error: "Pricing proposal not found." };
    if (proposal.status !== "PENDING") return { error: "This pricing proposal has already been reviewed." };

    await db.coursePricingProposal.update({
      where: { id: proposal.id },
      data: {
        status: "REJECTED",
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNote: adminNote?.trim() || null,
      },
    });

    await createNotification(
      proposal.course.instructorId,
      "SYSTEM",
      `Pricing needs changes: ${proposal.course.title}`,
      adminNote?.trim() || "Your proposed course price was not approved. Please review and submit another price.",
      { courseId: proposal.courseId, proposalId: proposal.id }
    );

    revalidatePath(`/dashboard/admin/courses/${proposal.courseId}`);
    revalidatePath("/dashboard/admin/courses");
    revalidatePath(`/dashboard/instructor/courses/${proposal.courseId}`);
    revalidatePath("/dashboard/instructor/courses");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reject pricing." };
  }
}
