import { NextResponse } from "next/server";

import {
  expirePastScheduleEvents,
  expirePendingMentorshipPaymentHolds,
  processDueScheduleReminders,
} from "@/data/schedule-reminders";
import { authorizeCronRequest } from "@/lib/operational-auth";

async function runScheduleMaintenance(request: Request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.authorized) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  const reminders = await processDueScheduleReminders();
  const expiry = await expirePastScheduleEvents();
  const paymentHolds = await expirePendingMentorshipPaymentHolds();

  return NextResponse.json({ ...reminders, ...expiry, ...paymentHolds });
}

export async function GET(request: Request) {
  return runScheduleMaintenance(request);
}

export async function POST(request: Request) {
  return runScheduleMaintenance(request);
}
