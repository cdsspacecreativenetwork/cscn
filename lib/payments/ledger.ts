import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  amountFromPaystackMinorUnit,
  type PaystackTransaction,
} from "@/lib/payments/paystack";
import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";

const INSTRUCTOR_SHARE_PERCENT = 80;
const EARNING_HOLD_DAYS = 14;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function generatePaymentReference(prefix = "cscn") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

async function createInvoiceIfMissing(orderId: string, input: {
  userId: string;
  amount: number;
  currency: string;
}) {
  const existing = await db.invoice.findUnique({ where: { orderId }, select: { id: true } });
  if (existing) return existing;

  return db.invoice.create({
    data: {
      orderId,
      userId: input.userId,
      number: `INV-${Date.now()}-${orderId.slice(-6).toUpperCase()}`,
      amount: input.amount,
      currency: input.currency,
      status: "PAID",
      issuedAt: new Date(),
      metadata: { paidAt: new Date().toISOString() },
    },
    select: { id: true },
  });
}

async function createInstructorEarningIfMissing(input: {
  instructorId: string;
  courseId: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  paidAt: Date;
}) {
  const existing = await db.instructorEarning.findFirst({
    where: { orderId: input.orderId, paymentId: input.paymentId, instructorId: input.instructorId },
    select: { id: true },
  });
  if (existing) return existing;

  const platformFee = Number(((input.amount * (100 - INSTRUCTOR_SHARE_PERCENT)) / 100).toFixed(2));
  const instructorAmount = Number((input.amount - platformFee).toFixed(2));

  return db.instructorEarning.create({
    data: {
      instructorId: input.instructorId,
      courseId: input.courseId,
      orderId: input.orderId,
      paymentId: input.paymentId,
      grossAmount: input.amount,
      platformFee,
      instructorAmount,
      currency: input.currency,
      sharePercent: INSTRUCTOR_SHARE_PERCENT,
      status: "PENDING",
      holdUntil: addDays(input.paidAt, EARNING_HOLD_DAYS),
    },
    select: { id: true },
  });
}

export async function fulfillPaidCourseOrder(input: {
  orderId: string;
  paymentId: string;
  providerReference: string;
  amount: number;
  currency: string;
  channel?: string | null;
  paidAt?: Date | null;
  rawPayload?: unknown;
}) {
  const order = await db.purchaseOrder.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      amount: true,
      currency: true,
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          instructorId: true,
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order || !order.courseId || !order.course) {
    return { error: "Order not found or not attached to a course." };
  }

  const expectedAmount = toNumber(order.amount);
  if (input.currency !== order.currency || Math.abs(input.amount - expectedAmount) > 0.01) {
    await db.payment.update({
      where: { id: input.paymentId },
      data: {
        status: "FAILED",
        rawPayload: input.rawPayload === undefined ? undefined : input.rawPayload as Prisma.InputJsonValue,
      },
    });
    return { error: "Payment amount or currency does not match the order." };
  }

  const paidAt = input.paidAt ?? new Date();
  const payment = await db.payment.update({
    where: { id: input.paymentId },
    data: {
      status: "SUCCEEDED",
      channel: input.channel ?? null,
      providerReference: input.providerReference,
      rawPayload: input.rawPayload === undefined ? undefined : input.rawPayload as Prisma.InputJsonValue,
      paidAt,
    },
    select: { id: true },
  });

  await db.purchaseOrder.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      provider: "PAYSTACK",
      providerReference: input.providerReference,
      paidAt,
    },
  });

  await db.enrollment.upsert({
    where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
    create: { userId: order.userId, courseId: order.courseId },
    update: { status: "ACTIVE", completedAt: null },
  });

  await createInvoiceIfMissing(order.id, {
    userId: order.userId,
    amount: input.amount,
    currency: input.currency,
  });

  await createInstructorEarningIfMissing({
    instructorId: order.course.instructorId,
    courseId: order.courseId,
    orderId: order.id,
    paymentId: payment.id,
    amount: input.amount,
    currency: input.currency,
    paidAt,
  });

  await createNotification(
    order.userId,
    "SYSTEM",
    "Course payment confirmed",
    `You now have access to ${order.course.title}.`,
    { courseId: order.courseId, orderId: order.id, area: "billing" }
  );

  await createNotification(
    order.course.instructorId,
    "NEW_ENROLLMENT",
    "New paid enrollment",
    `${order.user.name ?? order.user.email ?? "A learner"} purchased ${order.course.title}.`,
    { courseId: order.courseId, orderId: order.id, area: "earnings" }
  );

  await createAuditLog({
    actorId: order.userId,
    actorName: order.user.name,
    actorEmail: order.user.email,
    action: "payment.course_fulfilled",
    entityType: "PURCHASE_ORDER",
    entityId: order.id,
    entityName: order.course.title,
    metadata: {
      provider: "PAYSTACK",
      providerReference: input.providerReference,
      amount: input.amount,
      currency: input.currency,
    },
  });

  revalidatePath(`/courses/${order.course.slug}`);
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard/instructor/earnings");

  return { success: true, courseSlug: order.course.slug };
}

export async function fulfillPaystackTransaction(transaction: PaystackTransaction) {
  const reference = transaction.reference;
  const payment = await db.payment.findUnique({
    where: { providerReference: reference },
    select: { id: true, orderId: true, status: true },
  });

  if (!payment) return { error: "Payment reference was not found." };
  if (payment.status === "SUCCEEDED") {
    const order = await db.purchaseOrder.findUnique({
      where: { id: payment.orderId },
      select: { course: { select: { slug: true } } },
    });
    return { success: true, alreadyProcessed: true, courseSlug: order?.course?.slug };
  }

  if (transaction.status !== "success") {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: transaction.status === "abandoned" ? "CANCELLED" : "FAILED",
        rawPayload: transaction as Prisma.InputJsonValue,
      },
    });
    return { error: `Paystack transaction is ${transaction.status}.` };
  }

  return fulfillPaidCourseOrder({
    orderId: payment.orderId,
    paymentId: payment.id,
    providerReference: reference,
    amount: amountFromPaystackMinorUnit(transaction.amount),
    currency: transaction.currency,
    channel: transaction.channel,
    paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
    rawPayload: transaction,
  });
}
