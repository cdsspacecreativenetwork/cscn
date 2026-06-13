import { createNotification } from "@/data/notifications";
import { db } from "@/lib/db";
import { sendLiveSessionReminderEmail } from "@/lib/mail";
import { formatScheduleDateTime } from "@/lib/schedule-time";

const REMINDER_OFFSETS_MS = {
  BEFORE_45_MINUTES: 45 * 60 * 1000,
  JOIN_WINDOW: 15 * 60 * 1000,
} as const;

type ReminderKind = keyof typeof REMINDER_OFFSETS_MS;

function reminderScheduledFor(startsAt: Date, kind: ReminderKind) {
  return new Date(startsAt.getTime() - REMINDER_OFFSETS_MS[kind]);
}

export async function queueScheduleReminders(attendeeId: string) {
  const attendee = await db.scheduleEventAttendee.findUnique({
    where: { id: attendeeId },
    select: {
      id: true,
      eventId: true,
      userId: true,
      reminderEnabled: true,
      event: {
        select: {
          startsAt: true,
          status: true,
        },
      },
    },
  });

  if (!attendee?.reminderEnabled || attendee.event.status === "CANCELLED") return;

  const now = Date.now();
  const reminders = (Object.keys(REMINDER_OFFSETS_MS) as ReminderKind[])
    .map((kind) => ({
      eventId: attendee.eventId,
      attendeeId: attendee.id,
      userId: attendee.userId,
      kind,
      scheduledFor: reminderScheduledFor(attendee.event.startsAt, kind),
    }))
    .filter((reminder) => reminder.scheduledFor.getTime() > now);

  for (const reminder of reminders) {
    const existingReminder = await db.scheduleReminderDelivery.findUnique({
      where: {
        attendeeId_kind: {
          attendeeId: reminder.attendeeId,
          kind: reminder.kind,
        },
      },
      select: { id: true },
    });

    if (existingReminder) {
      await db.scheduleReminderDelivery.update({
        where: { id: existingReminder.id },
        data: {
          status: "PENDING",
          scheduledFor: reminder.scheduledFor,
          cancelledAt: null,
          deliveredAt: null,
        },
      });
      continue;
    }

    await db.scheduleReminderDelivery.create({
      data: reminder,
    });
  }
}

export async function cancelScheduleReminders(attendeeId: string) {
  const reminders = await db.scheduleReminderDelivery.findMany({
    where: {
      attendeeId,
      status: "PENDING",
    },
    select: { id: true },
  });

  const cancelledAt = new Date();
  for (const reminder of reminders) {
    await db.scheduleReminderDelivery.update({
      where: { id: reminder.id },
      data: {
        status: "CANCELLED",
        cancelledAt,
      },
    });
  }
}

export async function cancelEventScheduleReminders(eventId: string) {
  const reminders = await db.scheduleReminderDelivery.findMany({
    where: {
      eventId,
      status: "PENDING",
    },
    select: { id: true },
  });

  const cancelledAt = new Date();
  for (const reminder of reminders) {
    await db.scheduleReminderDelivery.update({
      where: { id: reminder.id },
      data: {
        status: "CANCELLED",
        cancelledAt,
      },
    });
  }
}

export async function processDueScheduleReminders(limit = 100) {
  const now = new Date();
  const reminders = await db.scheduleReminderDelivery.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
      attendee: {
        reminderEnabled: true,
        status: { not: "CANCELLED" },
      },
      event: {
        status: { in: ["SCHEDULED", "LIVE"] },
        startsAt: { gt: now },
      },
    },
    include: {
      attendee: {
        select: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          timezone: true,
          courseId: true,
        },
      },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });

  for (const reminder of reminders) {
    const title =
      reminder.kind === "JOIN_WINDOW"
        ? "Live session opens soon"
        : "Live session reminder";
    const body =
      reminder.kind === "JOIN_WINDOW"
        ? `${reminder.event.title} opens in about 15 minutes.`
        : `${reminder.event.title} starts ${formatScheduleDateTime(reminder.event.startsAt, reminder.event.timezone)}.`;
    const sessionTime = formatScheduleDateTime(reminder.event.startsAt, reminder.event.timezone);
    const reminderLabel =
      reminder.kind === "JOIN_WINDOW"
        ? "Your live session opens soon"
        : "Your live session starts in 45 minutes";
    const attendeeUser = reminder.attendee.user;

    const notification = await createNotification(reminder.userId, "SYSTEM", title, body, {
      href: "/dashboard/schedule",
      eventId: reminder.event.id,
      courseId: reminder.event.courseId,
      kind: "SCHEDULE_REMINDER",
      reminderKind: reminder.kind,
    });

    if ("id" in notification && attendeeUser.email) {
      const emailResult = await sendLiveSessionReminderEmail({
        email: attendeeUser.email,
        name: attendeeUser.name,
        sessionTitle: reminder.event.title,
        sessionTime,
        reminderLabel,
      });

      if (emailResult && "success" in emailResult) {
        await db.notification.update({
          where: { id: notification.id },
          data: { emailSentAt: new Date() },
        });
      } else {
        await db.notification.update({
          where: { id: notification.id },
          data: {
            emailFailedAt: new Date(),
            emailError: emailResult?.error ?? "Email failed",
          },
        });
      }
    }

    await db.scheduleReminderDelivery.update({
      where: { id: reminder.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });
  }

  return { processed: reminders.length };
}

export async function expirePastScheduleEvents() {
  const now = new Date();

  const endedMentorshipEvents = await db.scheduleEvent.findMany({
    where: {
      type: "MENTORSHIP",
      status: { in: ["SCHEDULED", "LIVE"] },
      OR: [
        { endsAt: { lt: now } },
        { endsAt: null, startsAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) } },
      ],
    },
    select: { id: true },
  });

  for (const event of endedMentorshipEvents) {
    await db.$executeRaw`
      UPDATE "MentorBooking"
      SET
        "status" = 'AWAITING_COMPLETION'::"MentorBookingStatus",
        "updatedAt" = NOW()
      WHERE "scheduleEventId" = ${event.id}
        AND "status" = 'CONFIRMED'::"MentorBookingStatus"
    `;

    await db.$executeRaw`
      UPDATE "ScheduleEvent"
      SET
        "status" = 'COMPLETED'::"ScheduleEventStatus",
        "endedAt" = ${now},
        "updatedAt" = NOW()
      WHERE "id" = ${event.id}
    `;
  }

  const endedWithExplicitEnd = await db.scheduleEvent.findMany({
    where: {
      type: "LIVE_SESSION",
      status: { in: ["SCHEDULED", "LIVE"] },
      endsAt: { lt: now },
    },
    select: { id: true },
  });

  const fallbackExpiry = new Date(now.getTime() - 60 * 60 * 1000);
  const endedWithoutEnd = await db.scheduleEvent.findMany({
    where: {
      type: "LIVE_SESSION",
      status: { in: ["SCHEDULED", "LIVE"] },
      endsAt: null,
      startsAt: { lt: fallbackExpiry },
    },
    select: { id: true },
  });

  const expiredEvents = [...endedWithExplicitEnd, ...endedWithoutEnd];
  const updatedAt = new Date();
  for (const event of expiredEvents) {
    await db.$executeRaw`
      UPDATE "ScheduleEvent"
      SET
        "status" = 'COMPLETED'::"ScheduleEventStatus",
        "endedAt" = ${updatedAt},
        "updatedAt" = NOW()
      WHERE "id" = ${event.id}
    `;
  }

  return { expired: expiredEvents.length + endedMentorshipEvents.length };
}

export async function expirePendingMentorshipPaymentHolds() {
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  const pendingOrders = await db.purchaseOrder.findMany({
    where: {
      type: "MENTORSHIP",
      status: "PENDING",
      createdAt: { lt: staleBefore },
      mentorBooking: {
        status: "PENDING",
      },
    },
    select: {
      id: true,
      mentorBookingId: true,
      payments: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
    take: 100,
  });

  for (const order of pendingOrders) {
    await db.purchaseOrder.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    for (const payment of order.payments) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });
    }

    if (order.mentorBookingId) {
      await db.$executeRaw`
        UPDATE "MentorBooking"
        SET
          "status" = 'CANCELLED'::"MentorBookingStatus",
          "availabilityId" = NULL,
          "updatedAt" = NOW()
        WHERE "id" = ${order.mentorBookingId}
      `;
    }
  }

  return { expiredPaymentHolds: pendingOrders.length };
}
