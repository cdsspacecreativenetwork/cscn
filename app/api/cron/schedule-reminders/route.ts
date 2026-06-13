import { NextResponse } from "next/server";

import {
  expirePastScheduleEvents,
  expirePendingMentorshipPaymentHolds,
  processDueScheduleReminders,
} from "@/data/schedule-reminders";

async function runScheduleMaintenance(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const bearerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const providedSecret = request.headers.get("x-cron-secret") || bearerSecret;
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
