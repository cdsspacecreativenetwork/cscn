import type { EmailOutboxType } from "@prisma/client";

import { db } from "@/lib/db";
import { sendLiveSessionReminderEmail, sendLiveSessionUpdateEmail } from "@/lib/mail";

const DEFAULT_BATCH_SIZE = 25;

type LiveSessionReminderPayload = {
  sessionTitle: string;
  sessionTime: string;
  reminderLabel: string;
  scheduleUrl?: string;
};

type LiveSessionUpdatePayload = {
  sessionTitle: string;
  message: string;
  updateLabel: string;
  scheduleUrl?: string;
};

type QueueEmailInput = {
  recipientUserId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  type: EmailOutboxType;
  subject: string;
  payload: LiveSessionReminderPayload | LiveSessionUpdatePayload;
  nextAttemptAt?: Date;
};

export async function queueEmail(input: QueueEmailInput) {
  return db.emailOutbox.create({
    data: {
      recipientUserId: input.recipientUserId,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      type: input.type,
      subject: input.subject,
      payload: input.payload,
      nextAttemptAt: input.nextAttemptAt,
    },
    select: { id: true },
  });
}

export async function queueLiveSessionReminderEmail({
  recipientUserId,
  recipientEmail,
  recipientName,
  sessionTitle,
  sessionTime,
  reminderLabel,
  scheduleUrl,
}: {
  recipientUserId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  sessionTitle: string;
  sessionTime: string;
  reminderLabel: string;
  scheduleUrl?: string;
}) {
  return queueEmail({
    recipientUserId,
    recipientEmail,
    recipientName,
    type: "LIVE_SESSION_REMINDER",
    subject: `${reminderLabel}: ${sessionTitle}`,
    payload: { sessionTitle, sessionTime, reminderLabel, scheduleUrl },
  });
}

export async function queueLiveSessionUpdateEmail({
  recipientUserId,
  recipientEmail,
  recipientName,
  sessionTitle,
  message,
  updateLabel,
  scheduleUrl,
}: {
  recipientUserId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  sessionTitle: string;
  message: string;
  updateLabel: string;
  scheduleUrl?: string;
}) {
  return queueEmail({
    recipientUserId,
    recipientEmail,
    recipientName,
    type: "LIVE_SESSION_UPDATE",
    subject: `${updateLabel}: ${sessionTitle}`,
    payload: { sessionTitle, message, updateLabel, scheduleUrl },
  });
}

function retryDelayMs(attempts: number) {
  return Math.min(60 * 60 * 1000, 2 ** attempts * 60 * 1000);
}

async function deliverOutboxEmail(job: {
  recipientEmail: string;
  recipientName: string | null;
  type: EmailOutboxType;
  payload: unknown;
}) {
  if (job.type === "LIVE_SESSION_REMINDER") {
    const payload = job.payload as LiveSessionReminderPayload;
    return sendLiveSessionReminderEmail({
      email: job.recipientEmail,
      name: job.recipientName,
      sessionTitle: payload.sessionTitle,
      sessionTime: payload.sessionTime,
      reminderLabel: payload.reminderLabel,
      scheduleUrl: payload.scheduleUrl,
    });
  }

  if (job.type === "LIVE_SESSION_UPDATE") {
    const payload = job.payload as LiveSessionUpdatePayload;
    return sendLiveSessionUpdateEmail({
      email: job.recipientEmail,
      name: job.recipientName,
      sessionTitle: payload.sessionTitle,
      message: payload.message,
      updateLabel: payload.updateLabel,
      scheduleUrl: payload.scheduleUrl,
    });
  }

  return { error: `Unsupported email type: ${job.type}` };
}

export async function processPendingEmailOutbox(limit = DEFAULT_BATCH_SIZE) {
  const now = new Date();
  const jobs = await db.emailOutbox.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      nextAttemptAt: { lte: now },
      attempts: { lt: 3 },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;
  let dead = 0;

  for (const job of jobs) {
    await db.emailOutbox.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    const result = await deliverOutboxEmail(job).catch((error) => ({
      error: error instanceof Error ? error.message : "Failed to deliver queued email.",
    }));

    if ("success" in result) {
      sent += 1;
      await db.emailOutbox.update({
        where: { id: job.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          lastError: null,
        },
      });
      continue;
    }

    const attempts = job.attempts + 1;
    const isDead = attempts >= job.maxAttempts;
    if (isDead) dead += 1;
    else failed += 1;

    await db.emailOutbox.update({
      where: { id: job.id },
      data: {
        status: isDead ? "DEAD" : "FAILED",
        attempts,
        failedAt: new Date(),
        lastError: result.error,
        nextAttemptAt: new Date(Date.now() + retryDelayMs(attempts)),
      },
    });
  }

  return { queued: jobs.length, sent, failed, dead };
}
