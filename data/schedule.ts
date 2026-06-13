import { addMonths, endOfMonth, startOfMonth } from "date-fns";

import { db } from "@/lib/db";
import type { ScheduleEvent } from "@/components/dashboard/schedule/EventCard";
import type { MentorAvailabilityInput } from "@/lib/mentor-booking-slots";
import {
  DEFAULT_SCHEDULE_TIME_ZONE,
  formatScheduleDate,
  formatScheduleDateKey,
  formatScheduleTime,
  normalizeScheduleTimeZone,
} from "@/lib/schedule-time";

type DbScheduleEvent = {
  viewerId?: string;
  id: string;
  type: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  meetingUrl: string | null;
  course: { id: string; title: string; slug: string } | null;
  attendees?: { reminderEnabled: boolean }[];
  mentorBooking?: {
    id: string;
    status: string;
    price: unknown;
    currency: string;
    rescheduleRequestedById: string | null;
    proposedStartsAt: Date | null;
    proposedEndsAt: Date | null;
    proposedTimezone: string | null;
    rescheduleNote: string | null;
    availability: MentorAvailabilityInput | null;
    mentor: {
      mentorAvailabilities: MentorAvailabilityInput[];
    };
  } | null;
};

function toEventStatus(
  status: string,
  startsAt: Date,
  endsAt: Date | null,
  startedAt: Date | null,
  endedAt: Date | null,
  mentorBookingStatus?: string | null
): ScheduleEvent["status"] {
  const now = new Date();

  if (mentorBookingStatus) {
    if (["CANCELLED", "CANCELLED_BY_STUDENT", "CANCELLED_BY_MENTOR", "DECLINED"].includes(mentorBookingStatus)) {
      return "LOCKED";
    }
    if (mentorBookingStatus === "COMPLETED") return "ENDED";
    if (mentorBookingStatus === "AWAITING_COMPLETION" || mentorBookingStatus === "DISPUTED") return "ACTION_REQUIRED";
    if (mentorBookingStatus === "RESCHEDULE_REQUESTED") return "ACTION_REQUIRED";
    if (endsAt && endsAt < now) return "ACTION_REQUIRED";
    if (startedAt) return "LIVE";
    if (startsAt <= now && (!endsAt || endsAt >= now)) return "WAITING";
    return "UPCOMING";
  }

  if (status === "CANCELLED") return "LOCKED";
  if (status === "COMPLETED" || endedAt) return "ENDED";
  if (endsAt && endsAt < now) return "ENDED";
  if (startedAt) return "LIVE";
  if (startsAt <= now && (!endsAt || endsAt >= now)) return "WAITING";

  return "UPCOMING";
}

function toActionLabel(event: DbScheduleEvent) {
  if (event.type === "LIVE_SESSION") {
    return event.meetingUrl ? "Join session" : "View details";
  }

  if (event.type === "EXAM") return "View details";
  if (event.type === "MENTORSHIP") return "View booking";
  if (event.type === "DEADLINE") return "View deadline";

  return "View details";
}

function formatTimeRange(startsAt: Date, endsAt: Date | null, timeZone: string) {
  const start = formatScheduleTime(startsAt, timeZone);
  if (!endsAt) return start;
  return `${start} - ${formatScheduleTime(endsAt, timeZone)}`;
}

function serializeMentorAvailability(availability: MentorAvailabilityInput) {
  return {
    ...availability,
    bookings: availability.bookings?.map((booking) => ({
      ...booking,
      startsAt: booking.startsAt instanceof Date ? booking.startsAt.toISOString() : booking.startsAt,
    })),
  };
}

export function mapScheduleEvent(event: DbScheduleEvent, viewerTimeZone?: string | null): ScheduleEvent {
  const hostTimeZone = normalizeScheduleTimeZone(event.timezone);
  const timeZone = normalizeScheduleTimeZone(viewerTimeZone ?? hostTimeZone);
  const mentorAvailability = event.mentorBooking?.mentor.mentorAvailabilities.length
    ? event.mentorBooking.mentor.mentorAvailabilities
    : event.mentorBooking?.availability
      ? [event.mentorBooking.availability]
      : undefined;

  return {
    id: event.id,
    type: event.type as ScheduleEvent["type"],
    title: event.title,
    subtitle: event.course?.title ?? undefined,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    date: formatScheduleDate(event.startsAt, timeZone),
    dateKey: formatScheduleDateKey(event.startsAt, timeZone),
    time: formatTimeRange(event.startsAt, event.endsAt, timeZone),
    timezone: timeZone,
    hostTimezone: hostTimeZone,
    status: toEventStatus(event.status, event.startsAt, event.endsAt, event.startedAt, event.endedAt, event.mentorBooking?.status),
    mentorBookingId: event.mentorBooking?.id,
    mentorBookingStatus: event.mentorBooking?.status,
    mentorBookingPrice: event.mentorBooking?.price == null ? null : String(event.mentorBooking.price),
    mentorBookingCurrency: event.mentorBooking?.currency,
    mentorAvailability: mentorAvailability?.map(serializeMentorAvailability),
    rescheduleRequestedByViewer: event.mentorBooking?.rescheduleRequestedById === event.viewerId,
    proposedStartsAt: event.mentorBooking?.proposedStartsAt?.toISOString() ?? null,
    proposedEndsAt: event.mentorBooking?.proposedEndsAt?.toISOString() ?? null,
    proposedTimezone: event.mentorBooking?.proposedTimezone ?? null,
    rescheduleNote: event.mentorBooking?.rescheduleNote ?? null,
    actionLabel: toActionLabel(event),
    meetingUrl: event.meetingUrl ?? undefined,
    reminderEnabled: event.attendees?.some((attendee) => attendee.reminderEnabled) ?? false,
  };
}

export async function getStudentScheduleEvents(userId: string) {
  const now = new Date();
  const rangeStart = startOfMonth(addMonths(now, -1));
  const rangeEnd = endOfMonth(addMonths(now, 6));

  const [viewer, events] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    }),
    db.scheduleEvent.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE", "COMPLETED"] },
        startsAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        OR: [
          { audience: "ALL_STUDENTS" },
          {
            audience: "SELECTED_USERS",
            attendees: { some: { userId, status: { not: "CANCELLED" } } },
          },
          {
            audience: "COURSE_ENROLLEES",
            course: {
              enrollments: {
                some: {
                  userId,
                  status: "ACTIVE",
                },
              },
            },
          },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        attendees: {
          where: { userId },
          select: { reminderEnabled: true },
        },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const bookings = await db.mentorBooking.findMany({
    where: {
      scheduleEventId: { in: events.map((event) => event.id) },
      studentId: userId,
    },
    select: {
      id: true,
      status: true,
      scheduleEventId: true,
      price: true,
      currency: true,
      rescheduleRequestedById: true,
      proposedStartsAt: true,
      proposedEndsAt: true,
      proposedTimezone: true,
      rescheduleNote: true,
      availability: {
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
          maxBookings: true,
          bookings: {
            where: {
              status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED", "AWAITING_COMPLETION"] },
            },
            select: {
              startsAt: true,
              status: true,
            },
          },
        },
      },
      mentor: {
        select: {
          mentorAvailabilities: {
            where: { status: "ACTIVE" },
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
              maxBookings: true,
              bookings: {
                where: {
                  status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED", "AWAITING_COMPLETION"] },
                },
                select: {
                  startsAt: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const bookingsByEventId = new Map(bookings.map((booking) => [booking.scheduleEventId, booking]));

  const viewerTimeZone = normalizeScheduleTimeZone(viewer?.timezone ?? DEFAULT_SCHEDULE_TIME_ZONE);
  return events.map((event) =>
    mapScheduleEvent(
      {
        ...event,
        viewerId: userId,
        mentorBooking: bookingsByEventId.get(event.id) ?? null,
      },
      viewerTimeZone
    )
  );
}

export async function getInstructorLiveSessions(instructorId: string) {
  const sessions = await db.scheduleEvent.findMany({
    where: {
      type: "LIVE_SESSION",
      OR: [
        { createdById: instructorId },
        { course: { instructorId } },
        { course: { instructors: { some: { userId: instructorId } } } },
      ],
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });

  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    description: session.description,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt?.toISOString() ?? null,
    timezone: session.timezone,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    meetingUrl: session.meetingUrl,
    courseTitle: session.course?.title ?? "Unlinked session",
    enrolledStudents: session.course?._count.enrollments ?? 0,
  }));
}
