import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

type EnrollmentAccessErrorCode =
  | "COURSE_NOT_FOUND"
  | "PAYMENT_REQUIRED"
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_PAID"
  | "PAYMENT_MISMATCH";

type EnrollmentAccessFailure = {
  success: false;
  code: EnrollmentAccessErrorCode;
  error: string;
};

type EnrollmentAccessSuccess = {
  success: true;
  courseId: string;
  courseSlug: string;
  alreadyEnrolled: boolean;
};

export type EnrollmentAccessResult = EnrollmentAccessFailure | EnrollmentAccessSuccess;

function amountsMatch(left: unknown, right: unknown) {
  return Math.abs(Number(left ?? 0) - Number(right ?? 0)) <= 0.01;
}

async function activateEnrollment(userId: string, courseId: string) {
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, status: true },
  });

  if (existing?.status === "ACTIVE" || existing?.status === "COMPLETED") {
    return true;
  }

  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: { status: "ACTIVE", completedAt: null },
  });

  return false;
}

function revalidateEnrollmentSurfaces(courseSlug: string) {
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard/courses");
}

export async function enrollInPublishedFreeCourse(
  userId: string,
  courseSlug: string,
  options: { revalidate?: boolean } = {}
): Promise<EnrollmentAccessResult> {
  const course = await db.course.findUnique({
    where: { slug: courseSlug, status: "PUBLISHED" },
    select: { id: true, slug: true, price: true },
  });

  if (!course) {
    return { success: false, code: "COURSE_NOT_FOUND", error: "Course not found." };
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true, status: true },
  });
  if (existing?.status === "ACTIVE" || existing?.status === "COMPLETED") {
    return {
      success: true,
      courseId: course.id,
      courseSlug: course.slug,
      alreadyEnrolled: true,
    };
  }

  if (Number(course.price ?? 0) > 0) {
    return {
      success: false,
      code: "PAYMENT_REQUIRED",
      error: "Payment is required before enrolling in this course.",
    };
  }

  await activateEnrollment(userId, course.id);
  if (options.revalidate !== false) revalidateEnrollmentSurfaces(course.slug);

  return {
    success: true,
    courseId: course.id,
    courseSlug: course.slug,
    alreadyEnrolled: false,
  };
}

export async function grantPaidCourseAccess(
  orderId: string,
  options: { revalidate?: boolean } = {}
): Promise<EnrollmentAccessResult> {
  const order = await db.purchaseOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      amount: true,
      currency: true,
      paidAt: true,
      course: { select: { id: true, slug: true } },
      payments: {
        where: { status: "SUCCEEDED" },
        orderBy: { paidAt: "desc" },
        select: { amount: true, currency: true, paidAt: true },
      },
    },
  });

  if (!order?.courseId || !order.course) {
    return {
      success: false,
      code: "ORDER_NOT_FOUND",
      error: "Paid course order was not found.",
    };
  }

  if (order.status !== "PAID" || !order.paidAt) {
    return {
      success: false,
      code: "ORDER_NOT_PAID",
      error: "The course order has not been paid.",
    };
  }

  const matchingPayment = order.payments.find(
    (payment) =>
      payment.paidAt &&
      payment.currency === order.currency &&
      amountsMatch(payment.amount, order.amount)
  );

  if (!matchingPayment) {
    return {
      success: false,
      code: "PAYMENT_MISMATCH",
      error: "No matching successful payment was found for this order.",
    };
  }

  const alreadyEnrolled = await activateEnrollment(order.userId, order.courseId);
  if (options.revalidate !== false) revalidateEnrollmentSurfaces(order.course.slug);

  return {
    success: true,
    courseId: order.courseId,
    courseSlug: order.course.slug,
    alreadyEnrolled,
  };
}
