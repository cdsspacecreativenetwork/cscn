"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";

const WITHDRAWAL_THRESHOLD = 5000;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function requestInstructorPayoutAction() {
  const user = await currentUser();
  if (!user?.id) return { error: "Unauthorized." };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      payoutSetup: true,
      payoutMethod: true,
      payoutDetails: true,
      instructorProfileEnabled: true,
    },
  });
  if (!dbUser) return { error: "User not found." };
  if (!dbUser.instructorProfileEnabled && dbUser.role !== "INSTRUCTOR" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") {
    return { error: "Only instructors can request payouts." };
  }
  if (!dbUser.payoutSetup || !dbUser.payoutMethod) {
    return { error: "Complete your payout settings before requesting a withdrawal." };
  }

  const availableRows = await db.instructorEarning.findMany({
    where: { instructorId: user.id, status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
    select: { id: true, instructorAmount: true, currency: true },
  });
  if (availableRows.length === 0) return { error: "No available earnings to withdraw yet." };

  const currency = availableRows[0]?.currency ?? "NGN";
  const eligibleRows = availableRows.filter((row) => row.currency === currency);
  const amount = eligibleRows.reduce((sum, row) => sum + toNumber(row.instructorAmount), 0);
  if (amount < WITHDRAWAL_THRESHOLD) {
    return { error: `You need at least ${currency} ${WITHDRAWAL_THRESHOLD.toLocaleString()} available before withdrawal.` };
  }

  const request = await db.payoutRequest.create({
    data: {
      instructorId: user.id,
      amount,
      currency,
      payoutMethod: dbUser.payoutMethod,
      payoutDetails: dbUser.payoutDetails === null ? Prisma.JsonNull : dbUser.payoutDetails,
      status: "REQUESTED",
    },
    select: { id: true },
  });

  await db.instructorEarning.updateMany({
    where: { id: { in: eligibleRows.map((row) => row.id) } },
    data: { status: "REQUESTED", payoutRequestId: request.id },
  });

  await createAuditLog({
    actorId: user.id,
    actorName: dbUser.name,
    actorEmail: dbUser.email,
    action: "payout.requested",
    entityType: "PAYOUT_REQUEST",
    entityId: request.id,
    entityName: `${dbUser.name ?? dbUser.email} payout`,
    metadata: { amount, currency, earningCount: eligibleRows.length },
  });

  const financeAdmins = await db.user.findMany({
    where: {
      OR: [
        { role: "SUPER_ADMIN" },
        { role: "ADMIN", canManageBilling: true },
      ],
    },
    select: { id: true },
  });
  await Promise.all(
    financeAdmins
      .filter((admin) => admin.id !== user.id)
      .map((admin) =>
        createNotification(
          admin.id,
          "SYSTEM",
          "Payout request needs finance review",
          `${dbUser.name ?? dbUser.email ?? "An instructor"} requested ${currency} ${amount.toLocaleString()} for withdrawal.`,
          { payoutRequestId: request.id, amount, currency, area: "billing" }
        )
      )
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/instructor/earnings");
  revalidatePath("/dashboard/admin/billing");
  return { success: true };
}

async function requireBillingAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");
  if (session.user.role !== "SUPER_ADMIN" && !hasAdminPermission(session.user, "canManageBilling")) {
    throw new Error("You do not have permission to manage billing.");
  }
  return session.user;
}

export async function approvePayoutRequestAction(requestId: string) {
  try {
    const admin = await requireBillingAdmin();
    const request = await db.payoutRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
      select: {
        id: true,
        amount: true,
        currency: true,
        instructor: { select: { name: true, email: true } },
      },
    });
    await createAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorEmail: admin.email,
      action: "payout.approved",
      entityType: "PAYOUT_REQUEST",
      entityId: request.id,
      entityName: `${request.instructor.name ?? request.instructor.email} payout`,
      metadata: { amount: request.amount, currency: request.currency },
    });
    await db.payoutRequest.findUnique({
      where: { id: request.id },
      select: { instructorId: true },
    }).then((row) => row && createNotification(
      row.instructorId,
      "SYSTEM",
      "Payout request approved",
      `Finance approved your ${request.currency} ${toNumber(request.amount).toLocaleString()} withdrawal request.`,
      { payoutRequestId: request.id, area: "billing" }
    ));
    revalidatePath("/dashboard/admin/billing");
    revalidatePath("/dashboard/instructor/earnings");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to approve payout." };
  }
}

export async function rejectPayoutRequestAction(requestId: string, adminNote?: string) {
  try {
    const admin = await requireBillingAdmin();
    const request = await db.payoutRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date(), adminNote: adminNote?.trim() || null },
      select: {
        id: true,
        amount: true,
        currency: true,
        instructor: { select: { name: true, email: true } },
      },
    });
    await db.instructorEarning.updateMany({
      where: { payoutRequestId: requestId, status: "REQUESTED" },
      data: { status: "AVAILABLE", payoutRequestId: null },
    });
    await createAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorEmail: admin.email,
      action: "payout.rejected",
      entityType: "PAYOUT_REQUEST",
      entityId: request.id,
      entityName: `${request.instructor.name ?? request.instructor.email} payout`,
      metadata: { amount: request.amount, currency: request.currency, hasNote: Boolean(adminNote?.trim()) },
    });
    await db.payoutRequest.findUnique({
      where: { id: request.id },
      select: { instructorId: true },
    }).then((row) => row && createNotification(
      row.instructorId,
      "SYSTEM",
      "Payout request rejected",
      adminNote?.trim() || "Finance rejected your payout request and returned the earnings to your available balance.",
      { payoutRequestId: request.id, area: "billing" }
    ));
    revalidatePath("/dashboard/admin/billing");
    revalidatePath("/dashboard/instructor/earnings");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to reject payout." };
  }
}

export async function markPayoutPaidAction(requestId: string, providerReference?: string) {
  try {
    const admin = await requireBillingAdmin();
    const request = await db.payoutRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        instructorId: true,
        payoutMethod: true,
        instructor: { select: { name: true, email: true } },
      },
    });
    if (!request) return { error: "Payout request not found." };
    if (request.status !== "APPROVED") return { error: "Approve this payout before marking it paid." };

    const payout = await db.payout.create({
      data: {
        payoutRequestId: request.id,
        instructorId: request.instructorId,
        amount: request.amount,
        currency: request.currency,
        provider: request.payoutMethod === "crypto" ? "CRYPTO" : request.payoutMethod === "stripe" ? "STRIPE" : "MANUAL",
        providerReference: providerReference?.trim() || null,
        status: "PAID",
        paidAt: new Date(),
      },
      select: { id: true },
    });
    await db.payoutRequest.update({
      where: { id: request.id },
      data: { status: "PAID", reviewedById: admin.id, reviewedAt: new Date() },
    });
    await db.instructorEarning.updateMany({
      where: { payoutRequestId: request.id, status: "REQUESTED" },
      data: { status: "PAID", paidAt: new Date() },
    });
    await createAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorEmail: admin.email,
      action: "payout.paid",
      entityType: "PAYOUT",
      entityId: payout.id,
      entityName: `${request.instructor.name ?? request.instructor.email} payout`,
      metadata: { payoutRequestId: request.id, amount: request.amount, currency: request.currency, providerReference },
    });
    await createNotification(
      request.instructorId,
      "SYSTEM",
      "Payout marked as paid",
      `Finance marked your ${request.currency} ${toNumber(request.amount).toLocaleString()} payout as paid.`,
      { payoutRequestId: request.id, payoutId: payout.id, area: "billing" }
    );
    revalidatePath("/dashboard/admin/billing");
    revalidatePath("/dashboard/instructor/earnings");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to mark payout paid." };
  }
}
