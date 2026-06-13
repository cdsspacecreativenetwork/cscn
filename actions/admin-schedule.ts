"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createNotification } from "@/data/notifications";
import { hasAnyAdminPermission } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireScheduleAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const canManageSchedule = hasAnyAdminPermission(session.user, [
    "canManageCourses",
    "canManageInstructors",
    "canManageSettings",
  ]);

  if (!canManageSchedule) redirect("/dashboard/admin");
  return { ...session.user, id: session.user.id };
}

function scheduleRedirect(params: string): never {
  redirect(`/dashboard/admin/platform-events${params}`);
}

function metadataObject(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return metadata as Record<string, unknown>;
}

async function notifyKnownAttendees(eventId: string, title: string, body: string) {
  const attendees = await db.scheduleEventAttendee.findMany({
    where: { eventId },
    select: { userId: true },
  });

  const userIds = Array.from(new Set(attendees.map((attendee) => attendee.userId)));
  await Promise.all(
    userIds.map((userId) =>
      createNotification(userId, "SYSTEM", title, body, {
        href: "/dashboard/schedule",
        eventId,
        kind: "LIVE_SESSION",
      })
    )
  );
}

async function notifyBillingAdmins(title: string, body: string, eventId: string) {
  const admins = await db.user.findMany({
    where: {
      OR: [
        { role: "SUPER_ADMIN" },
        { role: "ADMIN", canManageBilling: true },
      ],
    },
    select: { id: true },
  });

  for (const admin of admins) {
    await createNotification(
      admin.id,
      "SYSTEM",
      title,
      body,
      { href: "/dashboard/admin/billing", eventId, kind: "REFUND_REVIEW" },
      { actionRequired: true, actionLabel: "Review refund", actionUrl: "/dashboard/admin/billing" }
    );
  }
}

export async function cancelAdminScheduleEventAction(formData: FormData) {
  const user = await requireScheduleAdmin();

  const eventId = requireString(formData, "eventId");
  const reason = requireString(formData, "reason");
  const requestRefund = formData.get("requestRefund") === "on";
  if (!eventId) scheduleRedirect("?error=missing-event");

  const event = await db.scheduleEvent.update({
    where: { id: eventId },
    data: {
      status: "CANCELLED",
      metadata: {
        adminCancellationReason: reason || "Cancelled by CSCN operations",
        adminCancelledAt: new Date().toISOString(),
      },
    },
    select: { id: true, title: true, type: true },
  });

  const booking = await db.mentorBooking.findFirst({
    where: { scheduleEventId: event.id },
    select: { id: true },
  });

  if (booking) {
    await db.mentorBooking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });
  }

  await db.scheduleEventAttendee.updateMany({
    where: { eventId: event.id },
    data: { status: "CANCELLED" },
  });

  await notifyKnownAttendees(event.id, "Schedule event cancelled", `${event.title} has been cancelled by CSCN operations.`);

  if (requestRefund && event.type === "MENTORSHIP") {
    await openMentorshipRefundCase(event.id, user.id, `Admin cancellation${reason ? `: ${reason}` : ""}`);
  }

  revalidatePath("/dashboard/admin/schedule");
  revalidatePath("/dashboard/admin/platform-events");
  revalidatePath("/dashboard/schedule");
  scheduleRedirect("?cancelled=1");
}

export async function completeAdminScheduleEventAction(formData: FormData) {
  await requireScheduleAdmin();

  const eventId = requireString(formData, "eventId");
  if (!eventId) scheduleRedirect("?error=missing-event");

  const event = await db.scheduleEvent.update({
    where: { id: eventId },
    data: { status: "COMPLETED" },
    select: { id: true, type: true },
  });

  if (event.type === "MENTORSHIP") {
    const booking = await db.mentorBooking.findFirst({
      where: { scheduleEventId: event.id },
      select: { id: true },
    });

    if (booking) {
      await db.mentorBooking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED" },
      });
    }
  }

  revalidatePath("/dashboard/admin/schedule");
  revalidatePath("/dashboard/admin/platform-events");
  revalidatePath("/dashboard/schedule");
  scheduleRedirect("?completed=1");
}

async function openMentorshipRefundCase(eventId: string, requestedById: string, reason: string) {
  const event = await db.scheduleEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true },
  });

  if (!event) return { error: "missing-event" };

  const booking = await db.mentorBooking.findFirst({
    where: { scheduleEventId: event.id },
    include: {
      student: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
      mentor: { select: { name: true, firstName: true, lastName: true, email: true } },
      purchaseOrder: {
        include: {
          payments: {
            where: { status: "SUCCEEDED" },
            orderBy: { paidAt: "desc" },
            take: 1,
            select: { id: true },
          },
          refunds: {
            where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING", "SUCCEEDED"] } },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!booking?.purchaseOrder || booking.purchaseOrder.status !== "PAID") return { error: "not-paid" };
  if (booking.purchaseOrder.refunds.length > 0) return { error: "refund-exists" };

  const paymentId = booking.purchaseOrder.payments[0]?.id ?? null;

  const refund = await db.refund.create({
    data: {
      orderId: booking.purchaseOrder.id,
      paymentId,
      requestedById,
      amount: booking.purchaseOrder.amount,
      currency: booking.purchaseOrder.currency,
      reason,
      status: "REQUESTED",
    },
    select: { id: true },
  });

  if (booking.student?.id) {
    await createNotification(
      booking.student.id,
      "SYSTEM",
      "Refund review opened",
      `CSCN operations opened a refund review for ${event.title}. Finance will review and process it if eligible.`,
      { href: "/dashboard/purchases", eventId: event.id, refundId: refund.id, kind: "REFUND_REVIEW" }
    );
  }

  await notifyBillingAdmins(
    "Mentorship refund review needed",
    `${event.title} has a requested refund case from Platform Events.`,
    event.id
  );

  return { refundId: refund.id };
}

export async function requestMentorshipRefundReviewAction(formData: FormData) {
  const user = await requireScheduleAdmin();

  const eventId = requireString(formData, "eventId");
  const reason = requireString(formData, "reason") || "Admin requested refund review for mentorship event.";
  if (!eventId) scheduleRedirect("?error=missing-event");

  const result = await openMentorshipRefundCase(eventId, user.id, reason);

  revalidatePath("/dashboard/admin/schedule");
  revalidatePath("/dashboard/admin/platform-events");
  revalidatePath("/dashboard/admin/billing");

  if ("error" in result && result.error) scheduleRedirect(`?error=${result.error}`);
  scheduleRedirect("?refund=1");
}

export async function reviewScheduleAttentionAction(formData: FormData) {
  const user = await requireScheduleAdmin();

  const eventId = requireString(formData, "eventId");
  const note = requireString(formData, "note");
  if (!eventId) scheduleRedirect("?error=missing-event");

  const event = await db.scheduleEvent.findUnique({
    where: { id: eventId },
    select: { metadata: true },
  });

  if (!event) scheduleRedirect("?error=missing-event");

  await db.scheduleEvent.update({
    where: { id: eventId },
    data: {
      metadata: {
        ...metadataObject(event.metadata),
        adminAttentionReviewedAt: new Date().toISOString(),
        adminAttentionReviewedBy: user.id,
        adminAttentionReviewNote: note || "Reviewed by CSCN operations",
      },
    },
  });

  revalidatePath("/dashboard/admin/schedule");
  revalidatePath("/dashboard/admin/platform-events");
  scheduleRedirect("?reviewed=1");
}
