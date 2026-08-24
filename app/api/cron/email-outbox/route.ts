import { NextResponse } from "next/server";

import { processPendingEmailOutbox } from "@/data/email-outbox";
import { authorizeCronRequest } from "@/lib/operational-auth";

async function runEmailOutbox(request: Request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.authorized) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
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
