"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { createConfirmedMentorshipSchedule } from "@/data/mentor-bookings";
import { createNotification } from "@/data/notifications";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePaymentReference } from "@/lib/payments/ledger";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { getAppBaseUrl } from "@/lib/payments/url";
import { formatScheduleDateTime, parseLocalDateTimeInZone } from "@/lib/schedule-time";

function parseSlotKey(slotKey: string) {
  const parts = slotKey.split("-");
  if (parts.length < 5) return null;

  const slotStart = Number(parts.at(-1));
  const dateKey = parts.slice(-4, -1).join("-");
  const availabilityId = parts.slice(0, -4).join("-");

  if (!availabilityId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isFinite(slotStart)) {
    return null;
  }

  return { availabilityId, dateKey, slotStart };
}

function minutesToTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function getLocalDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const dateKey = `${pick("year")}-${pick("month")}-${pick("day")}`;
  const minutes = Number(pick("hour")) * 60 + Number(pick("minute"));
  const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return { dateKey, minutes, weekday };
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function cleanNote(value: FormDataEntryValue | null, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 1000);
}

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const RESCHEDULE_CUTOFF_MINUTES = 12 * 60;

function isInsideRescheduleCutoff(startsAt: Date) {
  return startsAt.getTime() <= Date.now() + RESCHEDULE_CUTOFF_MINUTES * 60_000;
}

type RescheduleAvailabilityWindow = {
  id: string;
  type: "WEEKLY" | "DATE";
  weekday: number | null;
  date: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  sessionDuration: number;
  bufferMinutes: number;
};

function findMatchingAvailabilityWindow(
  windows: RescheduleAvailabilityWindow[],
  proposedStartsAt: Date,
  proposedEndsAt: Date
) {
  const proposedDurationMinutes = Math.round((proposedEndsAt.getTime() - proposedStartsAt.getTime()) / 60_000);

  return windows.find((window) => {
    const local = getLocalDateParts(proposedStartsAt, window.timezone);
    const startMinutes = Number(window.startTime.split(":")[0]) * 60 + Number(window.startTime.split(":")[1]);
    const endMinutes = Number(window.endTime.split(":")[0]) * 60 + Number(window.endTime.split(":")[1]);
    const isWeeklyMatch = window.type === "WEEKLY" && window.weekday === local.weekday;
    const isDateMatch = window.type === "DATE" && window.date === local.dateKey;

    return (
      (isWeeklyMatch || isDateMatch) &&
      local.minutes >= startMinutes &&
      local.minutes + proposedDurationMinutes <= endMinutes &&
      proposedDurationMinutes <= window.sessionDuration
    );
  });
}

async function setMentorBookingStatus(
  bookingId: string,
  status:
    | "AWAITING_COMPLETION"
    | "COMPLETED"
    | "CANCELLED_BY_STUDENT"
    | "CANCELLED_BY_MENTOR"
    | "RESCHEDULE_REQUESTED"
    | "CONFIRMED"
    | "DISPUTED",
  metadata?: Record<string, unknown>
) {
  await db.$executeRaw`
    UPDATE "MentorBooking"
    SET
      "status" = ${status}::"MentorBookingStatus",
      "updatedAt" = NOW()
    WHERE "id" = ${bookingId}
  `;

  if (metadata) {
    await db.$executeRaw`
      UPDATE "ScheduleEvent"
      SET
        "metadata" = COALESCE("metadata", '{}'::jsonb) || ${JSON.stringify(metadata)}::jsonb,
        "updatedAt" = NOW()
      WHERE "id" = (
        SELECT "scheduleEventId"
        FROM "MentorBooking"
        WHERE "id" = ${bookingId}
      )
    `;
  }
}

async function cancelMentorBookingHold(bookingId: string) {
  await db.$executeRaw`
    UPDATE "MentorBooking"
    SET
      "status" = 'CANCELLED'::"MentorBookingStatus",
      "availabilityId" = NULL,
      "updatedAt" = NOW()
    WHERE "id" = ${bookingId}
  `;
}

async function setLinkedScheduleStatus(
  bookingId: string,
  status: "COMPLETED" | "CANCELLED",
  actorId: string | null = null
) {
  const endedAt = status === "COMPLETED" ? new Date() : null;
  await db.$executeRaw`
    UPDATE "ScheduleEvent"
    SET
      "status" = ${status}::"ScheduleEventStatus",
      "endedAt" = ${endedAt},
      "endedById" = ${actorId},
      "updatedAt" = NOW()
    WHERE "id" = (
      SELECT "scheduleEventId"
      FROM "MentorBooking"
      WHERE "id" = ${bookingId}
    )
  `;
}

async function requestMentorshipRefundReview({
  bookingId,
  requestedById,
  reason,
}: {
  bookingId: string;
  requestedById: string;
  reason: string;
}) {
  const order = await db.purchaseOrder.findFirst({
    where: {
      mentorBookingId: bookingId,
      status: "PAID",
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      payments: {
        where: { status: "SUCCEEDED" },
        orderBy: { paidAt: "desc" },
        take: 1,
        select: { id: true },
      },
      refunds: {
        where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!order || order.refunds.length > 0) return false;

  await db.refund.create({
    data: {
      orderId: order.id,
      paymentId: order.payments[0]?.id ?? null,
      requestedById,
      amount: order.amount,
      currency: order.currency,
      reason,
      status: "REQUESTED",
    },
  });

  return true;
}

function revalidateMentorshipBookingSurfaces() {
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/instructor/mentorship");
  revalidatePath("/dashboard/admin/mentorship");
  revalidatePath("/dashboard/admin/platform-events");
  revalidatePath("/dashboard/admin/billing");
}

async function getValidatedBookingSlot({
  mentorId,
  slotKey,
  studentId,
}: {
  mentorId: string;
  slotKey: string;
  studentId: string;
}) {
  const parsed = parseSlotKey(slotKey);
  if (!parsed) return { error: "That mentorship slot is invalid." as const };

  const mentor = await db.user.findFirst({
    where: {
      id: mentorId,
      mentorshipEligible: true,
      mentorshipEnabled: true,
      publicProfileStatus: "PUBLIC",
    },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
      mentorshipFree: true,
      mentorshipPrice: true,
      mentorshipCurrency: true,
      mentorAvailabilities: {
        where: {
          id: parsed.availabilityId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          type: true,
          weekday: true,
          date: true,
          startTime: true,
          endTime: true,
          timezone: true,
          sessionDuration: true,
          bufferMinutes: true,
        },
      },
    },
  });

  if (!mentor) return { error: "This mentor is not currently available for bookings." as const };
  if (mentor.id === studentId) return { error: "You cannot book a mentorship session with yourself." as const };

  const availability = mentor.mentorAvailabilities[0];
  if (!availability) return { error: "This mentorship availability is no longer active." as const };

  const date = new Date(`${parsed.dateKey}T00:00:00`);
  const isWeeklyMatch = availability.type === "WEEKLY" && availability.weekday === date.getDay();
  const isDateMatch = availability.type === "DATE" && availability.date === parsed.dateKey;
  if (!isWeeklyMatch && !isDateMatch) return { error: "This date is outside the mentor availability window." as const };

  const startMinutes = Number(availability.startTime.split(":")[0]) * 60 + Number(availability.startTime.split(":")[1]);
  const endMinutes = Number(availability.endTime.split(":")[0]) * 60 + Number(availability.endTime.split(":")[1]);
  const step = Math.max(15, availability.sessionDuration + availability.bufferMinutes);
  const isAligned =
    parsed.slotStart >= startMinutes &&
    parsed.slotStart + availability.sessionDuration <= endMinutes &&
    (parsed.slotStart - startMinutes) % step === 0;

  if (!isAligned) return { error: "This time is outside the mentor availability window." as const };

  const startsAt = parseLocalDateTimeInZone(`${parsed.dateKey}T${minutesToTime(parsed.slotStart)}`, availability.timezone);
  if (!startsAt) return { error: "We could not calculate the session time." as const };
  if (startsAt.getTime() <= Date.now()) return { error: "This mentorship slot has already passed." as const };

  const endsAt = addMinutes(startsAt, availability.sessionDuration);
  const existing = await db.mentorBooking.findFirst({
    where: {
      availabilityId: availability.id,
      startsAt,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { id: true },
  });

  if (existing) return { error: "This mentorship slot has already been booked." as const };

  const amount = mentor.mentorshipFree ? 0 : toNumber(mentor.mentorshipPrice);
  const currency = (mentor.mentorshipCurrency || "NGN").toUpperCase();
  if (!mentor.mentorshipFree && amount <= 0) {
    return { error: "This mentor has not set a valid paid session price yet." as const };
  }

  return {
    mentor,
    availability,
    startsAt,
    endsAt,
    amount,
    currency,
  };
}

export async function createMentorBookingAction(formData: FormData) {
  const user = await currentUser();
  const mentorId = String(formData.get("mentorId") ?? "");
  const slotKey = String(formData.get("slotKey") ?? "");
  const topic = String(formData.get("topic") ?? "").trim().slice(0, 120) || null;
  const studentNote = String(formData.get("studentNote") ?? "").trim().slice(0, 1000) || null;
  const returnTo = String(formData.get("returnTo") ?? "/mentorship");

  if (!user?.id || !user.email) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  const slot = await getValidatedBookingSlot({ mentorId, slotKey, studentId: user.id });
  if ("error" in slot && slot.error) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bookingError=${encodeURIComponent(slot.error)}`);
  }

  let bookingId = "";
  try {
    const booking = await db.mentorBooking.create({
      data: {
        mentorId: slot.mentor.id,
        studentId: user.id,
        availabilityId: slot.availability.id,
        status: slot.amount > 0 ? "PENDING" : "CONFIRMED",
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timezone: slot.availability.timezone,
        topic,
        studentNote,
        price: slot.amount > 0 ? slot.amount : null,
        currency: slot.currency,
      },
      select: { id: true },
    });
    bookingId = booking.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bookingError=${encodeURIComponent("This mentorship slot has already been booked.")}`);
    }
    throw error;
  }

  if (slot.amount <= 0) {
    await createConfirmedMentorshipSchedule(bookingId);
    await createNotification(
      user.id,
      "SYSTEM",
      "Mentorship booked",
      `Your session with ${slot.mentor.name ?? "your mentor"} has been confirmed.`,
      { kind: "MENTORSHIP", mentorBookingId: bookingId, area: "schedule" },
      { actionRequired: true, actionLabel: "View schedule", actionUrl: "/dashboard/schedule" }
    );
    await createNotification(
      slot.mentor.id,
      "SYSTEM",
      "New mentorship booking",
      `${user.name ?? user.email} booked a mentorship session.`,
      { kind: "MENTORSHIP", mentorBookingId: bookingId, area: "mentorship" },
      { actionRequired: true, actionLabel: "View bookings", actionUrl: "/dashboard/instructor/mentorship" }
    );

    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/instructor/mentorship");
    redirect("/dashboard/schedule?booking=confirmed");
  }

  if (slot.currency !== "NGN") {
    await cancelMentorBookingHold(bookingId);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bookingError=${encodeURIComponent("Paystack currently supports NGN mentorship checkout only.")}`);
  }

  const reference = generatePaymentReference("cscn_mentor");
  const order = await db.purchaseOrder.create({
    data: {
      userId: user.id,
      mentorBookingId: bookingId,
      type: "MENTORSHIP",
      status: "PENDING",
      amount: slot.amount,
      currency: slot.currency,
      provider: "PAYSTACK",
      providerReference: reference,
      metadata: {
        mentorId: slot.mentor.id,
        mentorBookingId: bookingId,
        slotKey,
        topic,
      },
    },
    select: { id: true },
  });

  await db.payment.create({
    data: {
      orderId: order.id,
      userId: user.id,
      provider: "PAYSTACK",
      status: "PENDING",
      amount: slot.amount,
      currency: slot.currency,
      providerReference: reference,
    },
  });

  const baseUrl = await getAppBaseUrl();
  const callbackUrl = `${baseUrl}/api/payments/paystack/callback?reference=${encodeURIComponent(reference)}`;
  const initialized = await initializePaystackTransaction({
    email: user.email,
    amount: slot.amount,
    currency: slot.currency,
    reference,
    callbackUrl,
    metadata: {
      orderId: order.id,
      mentorBookingId: bookingId,
      mentorId: slot.mentor.id,
      userId: user.id,
      type: "MENTORSHIP",
    },
  }).catch((error) => ({
    status: false,
    message: error instanceof Error ? error.message : "Unable to initialize Paystack checkout.",
    data: undefined,
  }));

  if (!initialized.status || !initialized.data?.authorization_url) {
    await db.payment.update({
      where: { providerReference: reference },
      data: { status: "FAILED" },
    });
    await db.purchaseOrder.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    await cancelMentorBookingHold(bookingId);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bookingError=${encodeURIComponent(initialized.message || "Unable to initialize Paystack checkout.")}`);
  }

  revalidatePath("/dashboard/admin/billing");
  redirect(initialized.data.authorization_url);
}

export async function requestMentorBookingRescheduleAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.id) return { error: "Please sign in to request a reschedule." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const note = cleanNote(formData.get("note"), "Reschedule requested.");
  const timezone = requireString(formData, "timezone") || "Africa/Lagos";
  const proposedDate = requireString(formData, "proposedDate");
  const proposedTime = requireString(formData, "proposedTime");
  const proposedStartValue = proposedDate && proposedTime ? `${proposedDate}T${proposedTime}` : requireString(formData, "proposedStartsAt");
  const proposedStartsAt = parseLocalDateTimeInZone(proposedStartValue, timezone);
  if (!bookingId) return { error: "Booking is missing." };
  if (!proposedStartsAt) return { error: "Choose the new date and time you want." };
  if (proposedStartsAt.getTime() <= Date.now() + 30 * 60_000) {
    return { error: "Choose a time at least 30 minutes from now." };
  }

  const booking = await db.mentorBooking.findFirst({
    where: {
      id: bookingId,
      status: { in: ["CONFIRMED", "AWAITING_COMPLETION"] },
      OR: [{ studentId: user.id }, { mentorId: user.id }],
    },
    select: {
      id: true,
      mentorId: true,
      studentId: true,
      topic: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      availabilityId: true,
      student: { select: { name: true, email: true } },
      mentor: { select: { name: true, email: true } },
    },
  });

  if (!booking) return { error: "This booking cannot be rescheduled." };
  if (isInsideRescheduleCutoff(booking.startsAt)) {
    return { error: "This session is too close to start time to request a reschedule. Please cancel or contact support." };
  }

  const originalDurationMs = booking.endsAt.getTime() - booking.startsAt.getTime();
  if (originalDurationMs <= 0) return { error: "This booking has an invalid session duration." };
  const proposedEndsAt = addMinutes(proposedStartsAt, Math.round(originalDurationMs / 60_000));

  const availabilityWindows = await db.mentorAvailability.findMany({
    where: {
      mentorId: booking.mentorId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      type: true,
      weekday: true,
      date: true,
      startTime: true,
      endTime: true,
      timezone: true,
      sessionDuration: true,
      bufferMinutes: true,
    },
    orderBy: [{ type: "asc" }, { weekday: "asc" }, { date: "asc" }, { startTime: "asc" }],
  });
  const matchingAvailability = findMatchingAvailabilityWindow(availabilityWindows, proposedStartsAt, proposedEndsAt);
  if (!matchingAvailability) return { error: "Choose one of the mentor's available reschedule slots." };

  if (matchingAvailability) {
    const bufferMinutes = matchingAvailability.bufferMinutes ?? 0;
    const proposedWindowStart = proposedStartsAt;
    const proposedWindowEnd = addMinutes(proposedEndsAt, bufferMinutes);
    const conflictingBooking = await db.mentorBooking.findFirst({
      where: {
        id: { not: booking.id },
        availabilityId: matchingAvailability.id,
        status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED", "AWAITING_COMPLETION"] },
        startsAt: { lt: proposedWindowEnd },
        endsAt: { gt: proposedWindowStart },
      },
      select: { id: true },
    });

    if (conflictingBooking) return { error: "That proposed time is no longer available." };
  }

  await db.$executeRaw`
    UPDATE "MentorBooking"
    SET
      "status" = 'RESCHEDULE_REQUESTED'::"MentorBookingStatus",
      "rescheduleRequestedById" = ${user.id},
      "rescheduleRequestedAt" = NOW(),
      "proposedStartsAt" = ${proposedStartsAt},
      "proposedEndsAt" = ${proposedEndsAt},
      "proposedTimezone" = ${timezone},
      "rescheduleNote" = ${note},
      "rescheduleRespondedAt" = NULL,
      "rescheduleResponseNote" = NULL,
      "updatedAt" = NOW()
    WHERE "id" = ${booking.id}
  `;

  await db.$executeRaw`
    UPDATE "ScheduleEvent"
    SET
      "metadata" = COALESCE("metadata", '{}'::jsonb) || ${JSON.stringify({
        rescheduleRequestedById: user.id,
        rescheduleRequestedAt: new Date().toISOString(),
        proposedStartsAt: proposedStartsAt.toISOString(),
        proposedEndsAt: proposedEndsAt.toISOString(),
        proposedTimezone: timezone,
        proposedAvailabilityId: matchingAvailability.id,
        rescheduleNote: note,
      })}::jsonb,
      "updatedAt" = NOW()
    WHERE "id" = (
      SELECT "scheduleEventId"
      FROM "MentorBooking"
      WHERE "id" = ${booking.id}
    )
  `;

  const targetUserId = user.id === booking.mentorId ? booking.studentId : booking.mentorId;
  if (targetUserId) {
    await createNotification(
      targetUserId,
      "SYSTEM",
      "Mentorship reschedule requested",
      `${user.name ?? user.email ?? "The other party"} proposed ${formatScheduleDateTime(proposedStartsAt, timezone)}.`,
      {
        kind: "MENTORSHIP_RESCHEDULE_REQUESTED",
        mentorBookingId: booking.id,
        proposedStartsAt: proposedStartsAt.toISOString(),
        proposedEndsAt: proposedEndsAt.toISOString(),
        proposedTimezone: timezone,
        proposedAvailabilityId: matchingAvailability.id,
        note,
      },
      {
        actionRequired: true,
        actionLabel: "Review booking",
        actionUrl: user.id === booking.mentorId ? "/dashboard/schedule" : "/dashboard/instructor/mentorship",
      }
    );
  }

  revalidateMentorshipBookingSurfaces();
  return { success: "Reschedule request sent." };
}

export async function acceptMentorBookingRescheduleAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.id) return { error: "Please sign in to accept this reschedule." };

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Booking is missing." };

  const booking = await db.mentorBooking.findFirst({
    where: {
      id: bookingId,
      status: "RESCHEDULE_REQUESTED",
      proposedStartsAt: { not: null },
      proposedEndsAt: { not: null },
      OR: [{ mentorId: user.id }, { studentId: user.id }],
      NOT: { rescheduleRequestedById: user.id },
    },
    select: {
      id: true,
      mentorId: true,
      studentId: true,
      rescheduleRequestedById: true,
      availabilityId: true,
      proposedStartsAt: true,
      proposedEndsAt: true,
      proposedTimezone: true,
      scheduleEventId: true,
      topic: true,
      student: { select: { name: true, email: true } },
      mentor: { select: { name: true, email: true } },
    },
  });

  if (!booking || !booking.proposedStartsAt || !booking.proposedEndsAt) {
    return { error: "This reschedule request is no longer available." };
  }

  const availabilityWindows = await db.mentorAvailability.findMany({
    where: {
      mentorId: booking.mentorId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      type: true,
      weekday: true,
      date: true,
      startTime: true,
      endTime: true,
      timezone: true,
      sessionDuration: true,
      bufferMinutes: true,
    },
    orderBy: [{ type: "asc" }, { weekday: "asc" }, { date: "asc" }, { startTime: "asc" }],
  });
  const matchingAvailability = findMatchingAvailabilityWindow(
    availabilityWindows,
    booking.proposedStartsAt,
    booking.proposedEndsAt
  );
  if (!matchingAvailability) return { error: "This proposed time is no longer inside your active availability." };

  if (matchingAvailability) {
    const proposedWindowEnd = addMinutes(booking.proposedEndsAt, matchingAvailability.bufferMinutes ?? 0);
    const conflictingBooking = await db.mentorBooking.findFirst({
      where: {
        id: { not: booking.id },
        availabilityId: matchingAvailability.id,
        status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED", "AWAITING_COMPLETION"] },
        startsAt: { lt: proposedWindowEnd },
        endsAt: { gt: booking.proposedStartsAt },
      },
      select: { id: true },
    });

    if (conflictingBooking) return { error: "That proposed time has already been booked." };
  }

  await db.$executeRaw`
    UPDATE "MentorBooking"
    SET
      "status" = 'CONFIRMED'::"MentorBookingStatus",
      "availabilityId" = ${matchingAvailability.id},
      "startsAt" = ${booking.proposedStartsAt},
      "endsAt" = ${booking.proposedEndsAt},
      "timezone" = ${booking.proposedTimezone ?? "Africa/Lagos"},
      "rescheduleRespondedAt" = NOW(),
      "rescheduleResponseNote" = 'Accepted',
      "updatedAt" = NOW()
    WHERE "id" = ${booking.id}
  `;

  if (booking.scheduleEventId) {
    await db.$executeRaw`
      UPDATE "ScheduleEvent"
      SET
        "startsAt" = ${booking.proposedStartsAt},
        "endsAt" = ${booking.proposedEndsAt},
        "timezone" = ${booking.proposedTimezone ?? "Africa/Lagos"},
        "status" = 'SCHEDULED'::"ScheduleEventStatus",
        "metadata" = COALESCE("metadata", '{}'::jsonb) || ${JSON.stringify({
          mentorBookingId: booking.id,
          rescheduleAcceptedAt: new Date().toISOString(),
        })}::jsonb,
        "updatedAt" = NOW()
      WHERE "id" = ${booking.scheduleEventId}
    `;
  }

  if (booking.studentId) {
    const targetUserId = user.id === booking.studentId ? booking.mentorId : booking.studentId;
    await createNotification(
      targetUserId,
      "SYSTEM",
      "Mentorship reschedule accepted",
      `${user.name ?? user.email ?? "The other party"} accepted the new time: ${formatScheduleDateTime(booking.proposedStartsAt, booking.proposedTimezone ?? "Africa/Lagos")}.`,
      { kind: "MENTORSHIP_RESCHEDULE_ACCEPTED", mentorBookingId: booking.id },
      {
        actionRequired: true,
        actionLabel: "View booking",
        actionUrl: user.id === booking.studentId ? "/dashboard/instructor/mentorship" : "/dashboard/schedule",
      }
    );
  }

  revalidateMentorshipBookingSurfaces();
  return { success: "Reschedule accepted." };
}

export async function declineMentorBookingRescheduleAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.id) return { error: "Please sign in to decline this reschedule." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const note = cleanNote(formData.get("note"), "The mentor declined this reschedule request.");
  if (!bookingId) return { error: "Booking is missing." };

  const booking = await db.mentorBooking.findFirst({
    where: {
      id: bookingId,
      status: "RESCHEDULE_REQUESTED",
      OR: [{ mentorId: user.id }, { studentId: user.id }],
      NOT: { rescheduleRequestedById: user.id },
    },
    select: {
      id: true,
      mentorId: true,
      studentId: true,
      topic: true,
    },
  });

  if (!booking) return { error: "This reschedule request is no longer available." };

  await db.$executeRaw`
    UPDATE "MentorBooking"
    SET
      "status" = 'CONFIRMED'::"MentorBookingStatus",
      "rescheduleRespondedAt" = NOW(),
      "rescheduleResponseNote" = ${note},
      "updatedAt" = NOW()
    WHERE "id" = ${booking.id}
  `;

  const targetUserId = user.id === booking.studentId ? booking.mentorId : booking.studentId;
  if (targetUserId) {
    await createNotification(
      targetUserId,
      "SYSTEM",
      "Mentorship reschedule declined",
      note,
      { kind: "MENTORSHIP_RESCHEDULE_DECLINED", mentorBookingId: booking.id },
      {
        actionRequired: true,
        actionLabel: "View booking",
        actionUrl: user.id === booking.studentId ? "/dashboard/instructor/mentorship" : "/dashboard/schedule",
      }
    );
  }

  revalidateMentorshipBookingSurfaces();
  return { success: "Reschedule declined. The original booking time remains active." };
}

export async function cancelMentorBookingAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.id) return { error: "Please sign in to cancel this session." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const reason = cleanNote(formData.get("reason"), "Session cancelled.");
  if (!bookingId) return { error: "Booking is missing." };

  const booking = await db.mentorBooking.findFirst({
    where: {
      id: bookingId,
      status: { in: ["PENDING", "CONFIRMED", "AWAITING_COMPLETION", "RESCHEDULE_REQUESTED"] },
      OR: [{ studentId: user.id }, { mentorId: user.id }],
    },
    select: {
      id: true,
      mentorId: true,
      studentId: true,
      price: true,
      currency: true,
      topic: true,
      startsAt: true,
    },
  });

  if (!booking) return { error: "This booking cannot be cancelled." };

  const cancelledByStudent = user.id === booking.studentId;
  const refundReviewCreated =
    Number(booking.price ?? 0) > 0
      ? await requestMentorshipRefundReview({
          bookingId: booking.id,
          requestedById: user.id,
          reason: `Mentorship cancelled by ${cancelledByStudent ? "student" : "mentor"}: ${reason}`,
        })
      : false;

  await setMentorBookingStatus(
    booking.id,
    cancelledByStudent ? "CANCELLED_BY_STUDENT" : "CANCELLED_BY_MENTOR",
    {
      cancelledById: user.id,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
      refundReviewNeeded: Number(booking.price ?? 0) > 0,
      refundReviewCreated,
    }
  );
  await setLinkedScheduleStatus(booking.id, "CANCELLED", user.id);

  const targetUserId = cancelledByStudent ? booking.mentorId : booking.studentId;
  if (targetUserId) {
    await createNotification(
      targetUserId,
      "SYSTEM",
      "Mentorship session cancelled",
      reason || "A mentorship session was cancelled.",
      { kind: "MENTORSHIP_CANCELLED", mentorBookingId: booking.id, refundReviewNeeded: Number(booking.price ?? 0) > 0 },
      {
        actionRequired: Number(booking.price ?? 0) > 0,
        actionLabel: Number(booking.price ?? 0) > 0 ? "Review booking" : "View schedule",
        actionUrl: cancelledByStudent ? "/dashboard/instructor/mentorship" : "/dashboard/schedule",
      }
    );
  }

  revalidateMentorshipBookingSurfaces();
  return {
    success:
      Number(booking.price ?? 0) > 0
        ? "Session cancelled. A refund review has been opened for finance."
        : "Session cancelled.",
  };
}

export async function markMentorBookingCompletedAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.id) return { error: "Please sign in to complete this session." };

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Booking is missing." };

  const booking = await db.mentorBooking.findFirst({
    where: {
      id: bookingId,
      mentorId: user.id,
      status: { in: ["CONFIRMED", "AWAITING_COMPLETION"] },
      endsAt: { lte: new Date(Date.now() + 15 * 60 * 1000) },
    },
    select: {
      id: true,
      studentId: true,
      topic: true,
    },
  });

  if (!booking) return { error: "This session is not ready to be marked completed." };

  await setMentorBookingStatus(booking.id, "COMPLETED", {
    completedById: user.id,
    completedAt: new Date().toISOString(),
  });
  await setLinkedScheduleStatus(booking.id, "COMPLETED", user.id);

  if (booking.studentId) {
    await createNotification(
      booking.studentId,
      "SYSTEM",
      "Mentorship marked completed",
      "Your mentor marked the session as completed. Report an issue if this is not correct.",
      { kind: "MENTORSHIP_COMPLETED", mentorBookingId: booking.id },
      {
        actionRequired: true,
        actionLabel: "Review session",
        actionUrl: "/dashboard/schedule",
      }
    );
  }

  revalidateMentorshipBookingSurfaces();
  return { success: "Session marked completed." };
}

export async function reportMentorBookingIssueAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.id) return { error: "Please sign in to report an issue." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const note = cleanNote(formData.get("note"));
  if (!bookingId) return { error: "Booking is missing." };
  if (!note) return { error: "Tell us what happened so admin can review it." };

  const booking = await db.mentorBooking.findFirst({
    where: {
      id: bookingId,
      status: { in: ["CONFIRMED", "AWAITING_COMPLETION", "COMPLETED"] },
      OR: [{ studentId: user.id }, { mentorId: user.id }],
    },
    select: {
      id: true,
      mentorId: true,
      studentId: true,
      price: true,
    },
  });

  if (!booking) return { error: "This booking cannot be disputed." };

  await setMentorBookingStatus(booking.id, "DISPUTED", {
    disputedById: user.id,
    disputedAt: new Date().toISOString(),
    disputeNote: note,
    refundReviewNeeded: Number(booking.price ?? 0) > 0,
  });

  await createNotification(
    booking.mentorId,
    "SYSTEM",
    "Mentorship issue reported",
    note,
    { kind: "MENTORSHIP_DISPUTED", mentorBookingId: booking.id },
    {
      actionRequired: true,
      actionLabel: "Review booking",
      actionUrl: "/dashboard/instructor/mentorship",
    }
  );

  revalidateMentorshipBookingSurfaces();
  return { success: "Issue reported. Admin can review this booking." };
}
