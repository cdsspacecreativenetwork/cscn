"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { cancelScheduleReminders, queueScheduleReminders } from "@/data/schedule-reminders";
import { db } from "@/lib/db";
import { createGoogleCalendarEvent, getConnectedGoogleCalendar } from "@/lib/integrations/google-calendar";

export async function setScheduleReminderAction(eventId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Please sign in to manage reminders." };
  }

  const event = await db.scheduleEvent.findFirst({
    where: {
      id: eventId,
      status: { not: "CANCELLED" },
      OR: [
        { audience: "ALL_STUDENTS" },
        {
          audience: "SELECTED_USERS",
          attendees: { some: { userId: session.user.id, status: { not: "CANCELLED" } } },
        },
        {
          audience: "COURSE_ENROLLEES",
          course: {
            enrollments: {
              some: {
                userId: session.user.id,
                status: "ACTIVE",
              },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!event) {
    return { error: "You do not have access to this scheduled event." };
  }

  const existingAttendee = await db.scheduleEventAttendee.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });
  const attendee = existingAttendee
    ? await db.scheduleEventAttendee.update({
        where: { id: existingAttendee.id },
        data: {
          reminderEnabled: enabled,
          status: "REGISTERED",
        },
        select: { id: true },
      })
    : await db.scheduleEventAttendee.create({
        data: {
          eventId,
          userId: session.user.id,
          status: "REGISTERED",
          reminderEnabled: enabled,
        },
        select: { id: true },
      });

  if (enabled) {
    await queueScheduleReminders(attendee.id);
  } else {
    await cancelScheduleReminders(attendee.id);
  }

  revalidatePath("/dashboard/schedule");

  return {
    success: enabled
      ? "Reminder enabled. We will notify you before this session starts."
      : "Reminder disabled for this event.",
  };
}

export async function addScheduleEventToGoogleCalendarAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Please sign in to add this event to Google Calendar." };
  }

  const event = await db.scheduleEvent.findFirst({
    where: {
      id: eventId,
      status: { in: ["SCHEDULED", "LIVE"] },
      OR: [
        { audience: "ALL_STUDENTS" },
        {
          audience: "SELECTED_USERS",
          attendees: { some: { userId: session.user.id, status: { not: "CANCELLED" } } },
        },
        {
          audience: "COURSE_ENROLLEES",
          course: {
            enrollments: {
              some: {
                userId: session.user.id,
                status: "ACTIVE",
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      meetingUrl: true,
    },
  });

  if (!event) {
    return { error: "You do not have access to this scheduled event." };
  }

  const connection = await getConnectedGoogleCalendar(session.user.id);
  if (!connection) {
    return { error: "Connect Google Calendar first, then try again." };
  }

  try {
    await createGoogleCalendarEvent({ connection, event });
    return { success: "Event saved to your Google Calendar." };
  } catch {
    return { error: "We could not save this event to Google Calendar. Please reconnect Google Calendar and try again." };
  }
}
