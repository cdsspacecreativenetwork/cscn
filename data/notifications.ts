import { db } from "@/lib/db";
import type { NotificationActionStatus, NotificationType, Prisma } from "@prisma/client";

type CreateNotificationOptions = {
  actionRequired?: boolean;
  actionStatus?: NotificationActionStatus;
  actionLabel?: string;
  actionUrl?: string;
  expiresAt?: Date;
};

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  data?: Record<string, unknown>,
  options: CreateNotificationOptions = {}
) {
  // Fetch user notification preferences
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { payoutDetails: true }
  });

  if (user) {
    const details = (user.payoutDetails as any) || {};
    const prefs = details._notifications || {
      emailNotifications: true,
      pushNotifications: true,
      courseReminders: true,
      marketingEmails: false,
      weeklyDigest: true
    };

    const isScheduleAlert = data?.kind === "LIVE_SESSION" || data?.kind === "SCHEDULE_REMINDER";

    const isCourseAlert = [
      "COURSE_INVITE",
      "COURSE_FEEDBACK",
      "COURSE_FEEDBACK_RESOLVED",
      "COURSE_PUBLISHED",
      "COURSE_REJECTED",
      "COURSE_CHANGES_REQUESTED",
      "NEW_ENROLLMENT"
    ].includes(type) || isScheduleAlert;

    if (isCourseAlert && !prefs.courseReminders) {
      // User disabled course and reminder alerts
      return { skipped: true, reason: "Course reminders disabled" };
    }
  }

  return db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data as Prisma.InputJsonValue | undefined,
      actionRequired: options.actionRequired ?? type === "COURSE_INVITE",
      actionStatus: options.actionRequired || type === "COURSE_INVITE" ? options.actionStatus ?? "PENDING" : options.actionStatus,
      actionLabel: options.actionLabel,
      actionUrl: options.actionUrl,
      expiresAt: options.expiresAt,
    },
    select: { id: true },
  });
}

export async function getNotifications(userId: string, limit = 30) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      data: true,
      seenAt: true,
      readAt: true,
      actionRequired: true,
      actionStatus: true,
      actionLabel: true,
      actionUrl: true,
      expiresAt: true,
      emailSentAt: true,
      emailFailedAt: true,
      createdAt: true,
    },
  });
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(notificationId: string, userId: string) {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, actionRequired: true, actionStatus: true },
  });

  if (!notification) return { count: 0 };

  await db.notification.update({
    where: { id: notification.id },
    data: {
      seenAt: new Date(),
      readAt: new Date(),
      actionStatus:
        notification.actionRequired && notification.actionStatus === "PENDING"
          ? "COMPLETED"
          : notification.actionStatus,
    },
  });

  return { count: 1 };
}

export async function markAllRead(userId: string) {
  const notifications = await db.notification.findMany({
    where: {
      userId,
      readAt: null,
      OR: [
        { actionRequired: false },
        { actionStatus: { in: ["COMPLETED", "DISMISSED", "EXPIRED"] } },
      ],
    },
    select: { id: true },
  });

  const now = new Date();
  for (const notification of notifications) {
    await db.notification.update({
      where: { id: notification.id },
      data: { seenAt: now, readAt: now },
    });
  }

  return { count: notifications.length };
}

export async function markVisibleNotificationsSeen(userId: string, notificationIds: string[]) {
  const uniqueIds = Array.from(new Set(notificationIds)).filter(Boolean);
  if (uniqueIds.length === 0) return { seen: 0, read: 0 };

  const notifications = await db.notification.findMany({
    where: {
      userId,
      id: { in: uniqueIds },
    },
    select: {
      id: true,
      seenAt: true,
      readAt: true,
      actionRequired: true,
      actionStatus: true,
    },
  });

  const now = new Date();
  let read = 0;
  for (const notification of notifications) {
    const shouldAutoRead =
      !notification.actionRequired ||
      notification.actionStatus === "COMPLETED" ||
      notification.actionStatus === "DISMISSED" ||
      notification.actionStatus === "EXPIRED";

    await db.notification.update({
      where: { id: notification.id },
      data: {
        seenAt: notification.seenAt ?? now,
        readAt: shouldAutoRead ? notification.readAt ?? now : notification.readAt,
      },
    });

    if (shouldAutoRead && !notification.readAt) read += 1;
  }

  return { seen: notifications.length, read };
}

export async function markNotificationActionCompleted(notificationId: string, userId: string) {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) return { count: 0 };

  await db.notification.update({
    where: { id: notification.id },
    data: {
      seenAt: new Date(),
      readAt: new Date(),
      actionStatus: "COMPLETED",
    },
  });

  return { count: 1 };
}
