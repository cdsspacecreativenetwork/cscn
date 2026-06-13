import { addDays, subDays } from "date-fns";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  formatScheduleDate,
  formatScheduleTime,
  normalizeScheduleTimeZone,
} from "@/lib/schedule-time";

export type AdminScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  audience: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  date: string;
  time: string;
  meetingUrl: string | null;
  courseTitle: string | null;
  creatorName: string | null;
  attendeeCount: number;
  enrolledStudents: number;
  needsMeetingLink: boolean;
  startsSoon: boolean;
  hasNoAttendees: boolean;
  attentionReviewed: boolean;
  attentionReviewedAt: string | null;
  mentorship: {
    bookingId: string;
    status: string;
    topic: string | null;
    studentName: string | null;
    mentorName: string | null;
    price: string | null;
    currency: string;
    orderId: string | null;
    orderStatus: string | null;
    refundId: string | null;
    refundStatus: string | null;
    canRequestRefund: boolean;
  } | null;
};

type ScheduleMetadata = {
  adminAttentionReviewedAt?: string;
  adminAttentionReviewedBy?: string;
  adminAttentionReviewNote?: string;
  mentorBookingId?: string;
};

function metadataObject(metadata: Prisma.JsonValue | null): ScheduleMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return metadata as ScheduleMetadata;
}

function formatTimeRange(startsAt: Date, endsAt: Date | null, timezone: string) {
  const start = formatScheduleTime(startsAt, timezone);
  if (!endsAt) return start;
  return `${start} - ${formatScheduleTime(endsAt, timezone)}`;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(safePage, pageCount);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    pageCount,
    total: items.length,
  };
}

export async function getAdminScheduleOverview({
  attentionPage = 1,
  eventsPage = 1,
}: {
  attentionPage?: number;
  eventsPage?: number;
} = {}) {
  const now = new Date();
  const todayEnd = addDays(now, 1);
  const sevenDays = addDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const [events, todayCount, upcomingCount, missingMeetingLinks, cancelledCount, noAttendeeCount] = await Promise.all([
    db.scheduleEvent.findMany({
      where: {
        startsAt: { gte: thirtyDaysAgo },
      },
      include: {
        createdBy: { select: { name: true, firstName: true, lastName: true, email: true } },
        attendees: { select: { id: true } },
        course: {
          select: {
            title: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { startsAt: "desc" },
      take: 60,
    }),
    db.scheduleEvent.count({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        startsAt: { gte: now, lt: todayEnd },
      },
    }),
    db.scheduleEvent.count({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        startsAt: { gte: now, lt: sevenDays },
      },
    }),
    db.scheduleEvent.count({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        type: { in: ["LIVE_SESSION", "MENTORSHIP"] },
        meetingUrl: null,
        startsAt: { gte: now },
      },
    }),
    db.scheduleEvent.count({
      where: {
        status: "CANCELLED",
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    db.scheduleEvent.count({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        startsAt: { gte: now },
        attendees: { none: {} },
      },
    }),
  ]);

  const eventIds = events.map((event) => event.id);
  const mentorshipBookings = eventIds.length
    ? await db.mentorBooking.findMany({
        where: { scheduleEventId: { in: eventIds } },
        include: {
          mentor: { select: { name: true, firstName: true, lastName: true, email: true } },
          student: { select: { name: true, firstName: true, lastName: true, email: true } },
          purchaseOrder: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              refunds: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { id: true, status: true },
              },
            },
          },
        },
      })
    : [];
  const bookingByEventId = new Map(mentorshipBookings.map((booking) => [booking.scheduleEventId, booking]));

  const mappedEvents: AdminScheduleEvent[] = events.map((event) => {
    const timezone = normalizeScheduleTimeZone(event.timezone);
    const attendeeCount = event.attendees.length;
    const enrolledStudents = event.course?._count.enrollments ?? 0;
    const metadata = metadataObject(event.metadata);
    const booking = bookingByEventId.get(event.id);
    const latestRefund = booking?.purchaseOrder?.refunds[0] ?? null;
    const creatorName =
      event.createdBy?.name ||
      [event.createdBy?.firstName, event.createdBy?.lastName].filter(Boolean).join(" ") ||
      event.createdBy?.email ||
      null;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      status: event.status,
      audience: event.audience,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      timezone,
      date: formatScheduleDate(event.startsAt, timezone),
      time: formatTimeRange(event.startsAt, event.endsAt, timezone),
      meetingUrl: event.meetingUrl,
      courseTitle: event.course?.title ?? null,
      creatorName,
      attendeeCount,
      enrolledStudents,
      needsMeetingLink: ["LIVE_SESSION", "MENTORSHIP"].includes(event.type) && !event.meetingUrl && event.status !== "CANCELLED",
      startsSoon: event.startsAt >= now && event.startsAt <= addDays(now, 1) && event.status === "SCHEDULED",
      hasNoAttendees: attendeeCount === 0 && event.status !== "CANCELLED",
      attentionReviewed: Boolean(metadata.adminAttentionReviewedAt),
      attentionReviewedAt: metadata.adminAttentionReviewedAt ?? null,
      mentorship: booking
        ? {
            bookingId: booking.id,
            status: booking.status,
            topic: booking.topic,
            studentName:
              booking.student?.name ||
              [booking.student?.firstName, booking.student?.lastName].filter(Boolean).join(" ") ||
              booking.student?.email ||
              null,
            mentorName:
              booking.mentor?.name ||
              [booking.mentor?.firstName, booking.mentor?.lastName].filter(Boolean).join(" ") ||
              booking.mentor?.email ||
              null,
            price: booking.price?.toString() ?? booking.purchaseOrder?.amount.toString() ?? null,
            currency: booking.currency || booking.purchaseOrder?.currency || "NGN",
            orderId: booking.purchaseOrder?.id ?? null,
            orderStatus: booking.purchaseOrder?.status ?? null,
            refundId: latestRefund?.id ?? null,
            refundStatus: latestRefund?.status ?? null,
            canRequestRefund:
              Boolean(booking.purchaseOrder?.id) &&
              booking.purchaseOrder?.status === "PAID" &&
              !["REQUESTED", "APPROVED", "PROCESSING", "SUCCEEDED"].includes(latestRefund?.status ?? ""),
          }
        : null,
    };
  });

  const activeEvents = mappedEvents.filter((event) => event.status === "SCHEDULED" || event.status === "LIVE");
  const attentionEvents = activeEvents.filter(
    (event) => !event.attentionReviewed && (event.needsMeetingLink || event.startsSoon || event.hasNoAttendees)
  );
  const refundReadyEvents = mappedEvents.filter((event) => event.mentorship?.canRequestRefund && event.status === "CANCELLED");
  const attentionQueue = [...attentionEvents, ...refundReadyEvents.filter((event) => !event.attentionReviewed)];
  const paginatedAttention = paginate(attentionQueue, attentionPage, 5);
  const paginatedEvents = paginate(mappedEvents, eventsPage, 12);

  return {
    stats: [
      { label: "Today", value: todayCount, helper: "Active sessions in the next 24h" },
      { label: "Next 7 days", value: upcomingCount, helper: "Scheduled learning events" },
      { label: "Missing links", value: missingMeetingLinks, helper: "Live events without a join URL" },
      { label: "Cancelled", value: cancelledCount, helper: "Cancelled in the last 30 days" },
    ],
    answers: [
      { question: "What is happening today?", answer: `${todayCount} active schedule item${todayCount === 1 ? "" : "s"} in the next 24 hours.` },
      { question: "What needs attention?", answer: `${attentionQueue.length} event${attentionQueue.length === 1 ? "" : "s"} need operational review.` },
      { question: "What is coming soon?", answer: `${upcomingCount} event${upcomingCount === 1 ? "" : "s"} are scheduled in the next 7 days.` },
      { question: "Which sessions lack meeting links?", answer: `${missingMeetingLinks} live/mentorship event${missingMeetingLinks === 1 ? "" : "s"} need links before students can join.` },
      { question: "Were students attached?", answer: `${noAttendeeCount} upcoming event${noAttendeeCount === 1 ? "" : "s"} currently have no attendee records.` },
      { question: "What changed recently?", answer: `${cancelledCount} event${cancelledCount === 1 ? "" : "s"} were cancelled in the last 30 days.` },
      { question: "What is the notification coverage?", answer: "Course sessions create attendee records and in-app notifications for enrolled students." },
      { question: "What can admin do here?", answer: "Review risk, open meeting links, cancel sessions, mark completed sessions, and open refund review cases for paid mentorship events." },
    ],
    attentionEvents: paginatedAttention.items,
    attentionPagination: {
      page: paginatedAttention.currentPage,
      pageCount: paginatedAttention.pageCount,
      total: paginatedAttention.total,
    },
    events: paginatedEvents.items,
    eventsPagination: {
      page: paginatedEvents.currentPage,
      pageCount: paginatedEvents.pageCount,
      total: paginatedEvents.total,
    },
  };
}
