import { db } from "@/lib/db";
import type { NotificationType, Prisma } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  data?: Record<string, unknown>
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

    // Filter notification creation based on user preferences
    if (type === "SYSTEM" && !prefs.emailNotifications) {
      // User disabled system/general email notification alerts
      return { skipped: true, reason: "SYSTEM notifications disabled" };
    }

    const isCourseAlert = [
      "COURSE_INVITE",
      "COURSE_FEEDBACK",
      "COURSE_FEEDBACK_RESOLVED",
      "COURSE_PUBLISHED",
      "COURSE_REJECTED",
      "COURSE_CHANGES_REQUESTED",
      "NEW_ENROLLMENT"
    ].includes(type);

    if (isCourseAlert && !prefs.courseReminders) {
      // User disabled course and reminder alerts
      return { skipped: true, reason: "Course reminders disabled" };
    }
  }

  return db.notification.create({
    data: { userId, type, title, body, data: data as Prisma.InputJsonValue | undefined },
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
      readAt: true,
      createdAt: true,
    },
  });
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
