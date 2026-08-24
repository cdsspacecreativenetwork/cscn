import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import { fulfillPaystackTransaction } from "@/lib/payments/ledger";
import {
  amountFromPaystackMinorUnit,
  verifyPaystackSignature,
  type PaystackTransaction,
} from "@/lib/payments/paystack";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/http-security";

export const runtime = "nodejs";

type TransferEventData = Record<string, unknown> & {
  reference?: string;
  transfer_code?: string;
  transferred_at?: string;
  reason?: string;
  amountMajor?: number;
};

async function processTransferEvent(data: TransferEventData, event: string) {
  const reference = String(data.reference ?? data.transfer_code ?? "");
  if (!reference) return;

  const payout = await db.payout.findFirst({
    where: {
      OR: [
        { providerReference: reference },
        { metadata: { path: ["transferCode"], equals: data.transfer_code ?? "" } },
      ],
    },
    select: { id: true, payoutRequestId: true },
  });
  if (!payout) return;

  const isSuccess = event === "transfer.success";
  const isFailed = event === "transfer.failed" || event === "transfer.reversed";

  if (isSuccess) {
    await db.payout.update({
      where: { id: payout.id },
      data: {
        status: "PAID",
        paidAt: data.transferred_at ? new Date(data.transferred_at) : new Date(),
        metadata: data as Prisma.InputJsonValue,
      },
    });
    if (payout.payoutRequestId) {
      await db.payoutRequest.update({
        where: { id: payout.payoutRequestId },
        data: { status: "PAID" },
      });
      await db.instructorEarning.updateMany({
        where: { payoutRequestId: payout.payoutRequestId, status: "REQUESTED" },
        data: { status: "PAID", paidAt: new Date() },
      });
    }
  }

  if (isFailed) {
    await db.payout.update({
      where: { id: payout.id },
      data: { status: "FAILED", metadata: data as Prisma.InputJsonValue },
    });
    if (payout.payoutRequestId) {
      await db.payoutRequest.update({
        where: { id: payout.payoutRequestId },
        data: { status: "REJECTED", adminNote: data.reason ?? "Paystack transfer failed or was reversed." },
      });
      await db.instructorEarning.updateMany({
        where: { payoutRequestId: payout.payoutRequestId, status: "REQUESTED" },
        data: { status: "AVAILABLE", payoutRequestId: null },
      });
    }
  }
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await readTextBody(request, 1_000_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    throw error;
  }
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const event = String(payload?.event ?? "unknown");
  const data = (payload?.data ?? {}) as Record<string, unknown>;
  const eventId = String(
    data.id ?? data.reference ?? data.transfer_code ?? createHash("sha256").update(rawBody).digest("hex"),
  );

  try {
    await db.webhookEvent.create({
      data: {
        provider: "PAYSTACK",
        eventId,
        eventType: event,
        rawPayload: payload as Prisma.InputJsonValue,
      },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event === "charge.success") {
      await fulfillPaystackTransaction(data as PaystackTransaction);
    }

    if (event.startsWith("transfer.")) {
      if (typeof data.amount === "number") {
        data.amountMajor = amountFromPaystackMinorUnit(data.amount);
      }
      await processTransferEvent(data as TransferEventData, event);
    }

    await db.webhookEvent.update({
      where: { provider_eventId: { provider: "PAYSTACK", eventId } },
      data: { processedAt: new Date() },
    });
  } catch (error) {
    await db.webhookEvent.delete({
      where: { provider_eventId: { provider: "PAYSTACK", eventId } },
    }).catch(() => undefined);
    console.error("Paystack webhook processing failed:", { event, eventId, error });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
