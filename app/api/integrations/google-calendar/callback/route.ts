import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  exchangeGoogleCalendarCode,
  getGoogleUserInfo,
} from "@/lib/integrations/google-calendar";
import { encryptToken } from "@/lib/integrations/token-crypto";

export const runtime = "nodejs";

function redirectWithStatus(requestUrl: string, returnTo: string, status: "connected" | "failed") {
  const redirectUrl = new URL(returnTo, requestUrl);
  redirectUrl.searchParams.set("calendar", status);
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("cscn_google_calendar_oauth")?.value;

  let parsedState: { state?: string; userId?: string; returnTo?: string } = {};
  try {
    parsedState = stateCookie ? JSON.parse(stateCookie) : {};
  } catch {
    parsedState = {};
  }

  cookieStore.delete("cscn_google_calendar_oauth");

  const returnTo = parsedState.returnTo || "/dashboard/settings?tab=Integrations";
  if (!code || !state || parsedState.state !== state || parsedState.userId !== session.user.id) {
    return redirectWithStatus(request.url, returnTo, "failed");
  }

  try {
    const token = await exchangeGoogleCalendarCode({ code, origin: url.origin });
    if (!token.access_token) {
      return redirectWithStatus(request.url, returnTo, "failed");
    }

    const userInfo = await getGoogleUserInfo(token.access_token).catch(() => null);
    const existingConnection = await db.calendarConnection.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: "GOOGLE",
        },
      },
      select: {
        id: true,
        refreshTokenEncrypted: true,
      },
    });

    const connectionData = {
      providerAccountEmail: userInfo?.email ?? session.user.email ?? null,
      calendarId: "primary",
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: token.refresh_token
        ? encryptToken(token.refresh_token)
        : existingConnection?.refreshTokenEncrypted ?? null,
      tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      scopes: token.scope ?? null,
      status: "CONNECTED" as const,
      lastSyncedAt: new Date(),
    };

    if (existingConnection) {
      await db.calendarConnection.update({
        where: { id: existingConnection.id },
        data: connectionData,
      });
    } else {
      await db.calendarConnection.create({
        data: {
          userId: session.user.id,
          provider: "GOOGLE",
          ...connectionData,
        },
      });
    }

    return redirectWithStatus(request.url, returnTo, "connected");
  } catch {
    return redirectWithStatus(request.url, returnTo, "failed");
  }
}
