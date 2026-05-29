import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { fulfillPaystackTransaction } from "@/lib/payments/ledger";
import {
  amountFromPaystackMinorUnit,
  verifyPaystackSignature,
  type PaystackTransaction,
} from "@/lib/payments/paystack";

export const runtime = "nodejs";

async function processTransferEvent(data: any, event: string) {
  const reference = String(data?.reference ?? data?.transfer_code ?? "");
  if (!reference) return;

  const payout = await db.payout.findFirst({
    where: {
      OR: [
        { providerReference: reference },
        { metadata: { path: ["transferCode"], equals: data?.transfer_code } },
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
        paidAt: data?.transferred_at ? new Date(data.transferred_at) : new Date(),
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
        data: { status: "REJECTED", adminNote: data?.reason ?? "Paystack transfer failed or was reversed." },
      });
      await db.instructorEarning.updateMany({
        where: { payoutRequestId: payout.payoutRequestId, status: "REQUESTED" },
        data: { status: "AVAILABLE", payoutRequestId: null },
      });
    }
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const event = String(payload?.event ?? "unknown");
  const data = payload?.data ?? {};
  const eventId = String(data?.id ?? data?.reference ?? data?.transfer_code ?? `${event}:${Date.now()}`);

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

  if (event === "charge.success") {
    await fulfillPaystackTransaction(data as PaystackTransaction);
  }

  if (event.startsWith("transfer.")) {
    if (typeof data?.amount === "number") {
      data.amountMajor = amountFromPaystackMinorUnit(data.amount);
    }
    await processTransferEvent(data, event);
  }

  await db.webhookEvent.update({
    where: { provider_eventId: { provider: "PAYSTACK", eventId } },
    data: { processedAt: new Date() },
  });

  return NextResponse.json({ received: true });
}
