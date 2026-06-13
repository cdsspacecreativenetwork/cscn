import { randomUUID } from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildGoogleCalendarAuthUrl } from "@/lib/integrations/google-calendar";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/dashboard/settings?tab=Integrations";
  const state = randomUUID();
  const cookieStore = await cookies();

  cookieStore.set(
    "cscn_google_calendar_oauth",
    JSON.stringify({
      state,
      userId: session.user.id,
      returnTo: returnTo.startsWith("/") ? returnTo : "/dashboard/settings?tab=Integrations",
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    }
  );

  return NextResponse.redirect(buildGoogleCalendarAuthUrl({ state, origin: url.origin }));
}
