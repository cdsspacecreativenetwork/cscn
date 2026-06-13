import "server-only";

import { db } from "@/lib/db";
import { createGoogleMeetForScheduleEvent, getConnectedGoogleCalendar } from "@/lib/integrations/google-calendar";
import { queueScheduleReminders } from "@/data/schedule-reminders";

export async function createConfirmedMentorshipSchedule(bookingId: string) {
  const booking = await db.mentorBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      mentorId: true,
      studentId: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      topic: true,
      studentNote: true,
      meetingUrl: true,
      scheduleEventId: true,
      mentor: { select: { name: true } },
      student: { select: { name: true, email: true } },
    },
  });

  if (!booking || !booking.studentId) return null;
  if (booking.scheduleEventId) return booking.scheduleEventId;

  const title = `Mentorship with ${booking.mentor.name ?? "your mentor"}`;
  const event = await db.scheduleEvent.create({
    data: {
      type: "MENTORSHIP",
      status: "SCHEDULED",
      audience: "SELECTED_USERS",
      title,
      description: booking.studentNote || booking.topic || "Mentorship session",
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      timezone: booking.timezone,
      meetingUrl: booking.meetingUrl,
      meetingProvider: "MANUAL",
      meetingStatus: booking.meetingUrl ? "READY" : "NONE",
      createdById: booking.mentorId,
      metadata: { mentorBookingId: booking.id },
    },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
    },
  });

  await db.mentorBooking.update({
    where: { id: booking.id },
    data: { scheduleEventId: event.id },
  });

  const attendee = await db.scheduleEventAttendee.create({
    data: {
      eventId: event.id,
      userId: booking.studentId,
      status: "REGISTERED",
      reminderEnabled: true,
    },
    select: { id: true },
  });
  await queueScheduleReminders(attendee.id);

  const connection = await getConnectedGoogleCalendar(booking.mentorId);
  if (connection) {
    try {
      const result = await createGoogleMeetForScheduleEvent({
        connection,
        event,
        courseTitle: null,
      });

      if (result.meetingUrl) {
        await db.mentorBooking.update({
          where: { id: booking.id },
          data: { meetingUrl: result.meetingUrl },
        });
      }
    } catch {
      await db.scheduleEvent.update({
        where: { id: event.id },
        data: { meetingStatus: "FAILED" },
      });
    }
  }

  return event.id;
}
