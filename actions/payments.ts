"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enrollUser, getFirstPlayableLessonForCourseSlug } from "@/lib/services/courses.service";
import { generatePaymentReference } from "@/lib/payments/ledger";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { getAppBaseUrl } from "@/lib/payments/url";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function startCourseCheckoutAction(courseSlug: string) {
  const user = await currentUser();
  if (!user?.id || !user.email) {
    return { error: "Sign in before enrolling in this course." };
  }
  const rateLimit = await enforceRateLimit("course-checkout", user.id, RATE_LIMITS.checkout);
  if (!rateLimit.allowed) return { error: `Too many checkout attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` };

  const course = await db.course.findUnique({
    where: { slug: courseSlug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      baseCurrency: true,
      instructorId: true,
    },
  });

  if (!course) return { error: "Course not found." };

  const existingEnrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true },
  });
  if (existingEnrollment) {
    const firstLesson = await getFirstPlayableLessonForCourseSlug(course.slug);
    return {
      success: true,
      alreadyEnrolled: true,
      redirectUrl: firstLesson ? `/courses/${course.slug}/watch/${firstLesson.id}` : `/courses/${course.slug}`,
    };
  }

  const amount = Number(course.price ?? 0);
  if (amount <= 0) {
    const enrollment = await enrollUser(user.id, course.slug);
    if (enrollment.error) return { error: enrollment.error };
    return {
      success: true,
      redirectUrl: enrollment.firstLessonId
        ? `/courses/${course.slug}/watch/${enrollment.firstLessonId}`
        : `/courses/${course.slug}`,
    };
  }

  const currency = course.baseCurrency || "NGN";
  if (currency !== "NGN") {
    return { error: "Paystack checkout currently supports NGN courses only. Stripe support will handle other currencies later." };
  }
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return { error: "Checkout is unavailable in this local preview because Paystack is not configured." };
  }

  const reference = generatePaymentReference("cscn_course");
  const order = await db.purchaseOrder.create({
    data: {
      userId: user.id,
      courseId: course.id,
      type: "COURSE",
      status: "PENDING",
      amount,
      currency,
      provider: "PAYSTACK",
      providerReference: reference,
      metadata: {
        courseSlug: course.slug,
        courseTitle: course.title,
        instructorId: course.instructorId,
      },
    },
    select: { id: true },
  });

  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      userId: user.id,
      provider: "PAYSTACK",
      status: "PENDING",
      amount,
      currency,
      providerReference: reference,
    },
    select: { id: true },
  });

  const baseUrl = await getAppBaseUrl();
  const callbackUrl = `${baseUrl}/api/payments/paystack/callback?reference=${encodeURIComponent(reference)}`;
  let initialized;
  try {
    initialized = await initializePaystackTransaction({
      email: user.email,
      amount,
      currency,
      reference,
      callbackUrl,
      metadata: {
        orderId: order.id,
        courseId: course.id,
        courseSlug: course.slug,
        userId: user.id,
        type: "COURSE",
      },
    });
  } catch (error: unknown) {
    await Promise.all([
      db.purchaseOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
      db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
    ]);
    console.error("Course checkout initialization failed:", error);
    return { error: "Checkout is temporarily unavailable. Please try again later." };
  }

  if (!initialized.status || !initialized.data?.authorization_url) {
    await Promise.all([
      db.purchaseOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
      db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
    ]);
    return { error: initialized.message || "Unable to initialize Paystack checkout." };
  }

  revalidatePath("/dashboard/admin/billing");
  return {
    success: true,
    authorizationUrl: initialized.data.authorization_url,
    reference,
  };
}

export async function redirectToCourseCheckoutAction(courseSlug: string) {
  const result = await startCourseCheckoutAction(courseSlug);
  if (result.authorizationUrl) redirect(result.authorizationUrl);
  if (result.redirectUrl) redirect(result.redirectUrl);
  return result;
}
