import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { resolvePaystackAccount } from "@/lib/payments/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const accountNumber = String(body?.accountNumber ?? "").trim();
  const bankCode = String(body?.bankCode ?? "").trim();

  if (!/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json({ error: "Enter a valid 10-digit account number." }, { status: 400 });
  }
  if (!bankCode) {
    return NextResponse.json({ error: "Choose a bank first." }, { status: 400 });
  }

  try {
    const resolved = await resolvePaystackAccount({ accountNumber, bankCode });
    if (!resolved.status || !resolved.data?.account_name) {
      return NextResponse.json({ error: resolved.message || "Unable to resolve account." }, { status: 400 });
    }

    return NextResponse.json({
      accountNumber: resolved.data.account_number,
      accountName: resolved.data.account_name,
      bankId: resolved.data.bank_id ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resolve account." },
      { status: 500 }
    );
  }
}
