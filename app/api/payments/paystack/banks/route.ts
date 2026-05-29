import { NextResponse } from "next/server";

import { listPaystackBanks } from "@/lib/payments/paystack";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") ?? "nigeria";

  try {
    const banks = await listPaystackBanks(country);
    return NextResponse.json({ banks: banks.data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Paystack banks." },
      { status: 500 }
    );
  }
}
