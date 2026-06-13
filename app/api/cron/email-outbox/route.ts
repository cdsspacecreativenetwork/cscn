import { NextResponse } from "next/server";

import { processPendingEmailOutbox } from "@/data/email-outbox";

async function runEmailOutbox(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const bearerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const providedSecret = request.headers.get("x-cron-secret") || bearerSecret;
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processPendingEmailOutbox();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return runEmailOutbox(request);
}

export async function POST(request: Request) {
  return runEmailOutbox(request);
}
