import { NextResponse } from "next/server";

import { fulfillPaystackTransaction } from "@/lib/payments/ledger";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { getFirstPlayableLessonForCourseSlug } from "@/lib/services/courses.service";
import { getAppBaseUrl } from "@/lib/payments/url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
  const baseUrl = await getAppBaseUrl();

  if (!reference) {
    return NextResponse.redirect(`${baseUrl}/dashboard/courses?payment=missing-reference`);
  }

  try {
    const result = await verifyPaystackTransaction(reference);
    if (!result.status || !result.data) {
      return NextResponse.redirect(`${baseUrl}/dashboard/courses?payment=verify-failed`);
    }

    const fulfilled = await fulfillPaystackTransaction(result.data);
    const mentorBookingId = "mentorBookingId" in fulfilled ? fulfilled.mentorBookingId : undefined;
    const courseSlug = "courseSlug" in fulfilled ? fulfilled.courseSlug : undefined;

    if (!fulfilled.success) {
      if (mentorBookingId) {
        return NextResponse.redirect(`${baseUrl}/mentorship?bookingError=${encodeURIComponent("Mentorship payment was not completed. The slot has been released.")}`);
      }
      return NextResponse.redirect(`${baseUrl}/dashboard/courses?payment=pending`);
    }

    if (mentorBookingId) {
      return NextResponse.redirect(`${baseUrl}/dashboard/schedule?booking=confirmed`);
    }

    if (!courseSlug) {
      return NextResponse.redirect(`${baseUrl}/dashboard/courses?payment=pending`);
    }

    const firstLesson = await getFirstPlayableLessonForCourseSlug(courseSlug);
    const destination = firstLesson
      ? `/courses/${courseSlug}/watch/${firstLesson.id}`
      : `/courses/${courseSlug}?payment=success`;

    return NextResponse.redirect(`${baseUrl}${destination}`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/dashboard/courses?payment=error`);
  }
}
