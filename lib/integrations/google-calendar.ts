import "server-only";

import { randomUUID } from "crypto";

import type { CalendarConnection, ScheduleEvent } from "@prisma/client";

import { db } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/integrations/token-crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
};

type GoogleCalendarEvent = {
  id?: string;
  htmlLink?: string;
  iCalUID?: string;
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
    createRequest?: {
      status?: {
        statusCode?: string;
      };
    };
  };
};

function getGoogleClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth client credentials are not configured.");
  }

  return { clientId, clientSecret };
}

function getGoogleOAuthConfig(origin?: string) {
  const { clientId, clientSecret } = getGoogleClientCredentials();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || origin;

  if (!baseUrl) {
    throw new Error("Google Calendar OAuth redirect URL is not configured.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri: new URL("/api/integrations/google-calendar/callback", baseUrl).toString(),
  };
}

async function googleFetch<T>(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => null)) as T & { error?: unknown; error_description?: unknown };

  if (!response.ok) {
    const detail = typeof payload?.error_description === "string"
      ? payload.error_description
      : typeof payload?.error === "string"
        ? payload.error
        : "Google Calendar request failed.";
    throw new Error(detail);
  }

  return payload as T;
}

export function buildGoogleCalendarAuthUrl({
  state,
  origin,
}: {
  state: string;
  origin?: string;
}) {
  const config = getGoogleOAuthConfig(origin);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeGoogleCalendarCode({
  code,
  origin,
}: {
  code: string;
  origin?: string;
}) {
  const config = getGoogleOAuthConfig(origin);

  return googleFetch<GoogleTokenResponse>(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
}

export async function getGoogleUserInfo(accessToken: string) {
  return googleFetch<GoogleUserInfo>(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function refreshGoogleCalendarConnection(connection: CalendarConnection) {
  if (!connection.refreshTokenEncrypted) {
    await db.calendarConnection.update({
      where: { id: connection.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("Google Calendar refresh token is missing. Reconnect Google Calendar.");
  }

  const config = getGoogleClientCredentials();
  const refreshToken = decryptToken(connection.refreshTokenEncrypted);
  const refreshed = await googleFetch<GoogleTokenResponse>(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!refreshed.access_token) {
    throw new Error("Google did not return a refreshed access token.");
  }

  return db.calendarConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptToken(refreshed.access_token),
      tokenExpiresAt: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000)
        : connection.tokenExpiresAt,
      scopes: refreshed.scope ?? connection.scopes,
      status: "CONNECTED",
      lastSyncedAt: new Date(),
    },
  });
}

export async function getValidGoogleCalendarAccessToken(connection: CalendarConnection) {
  const shouldRefresh = !connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() < Date.now() + 60_000;
  const freshConnection = shouldRefresh ? await refreshGoogleCalendarConnection(connection) : connection;
  return {
    connection: freshConnection,
    accessToken: decryptToken(freshConnection.accessTokenEncrypted),
  };
}

function extractMeetUrl(event: GoogleCalendarEvent) {
  const videoEntry = event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.entryPointType === "video");
  return videoEntry?.uri || event.hangoutLink || null;
}

export async function createGoogleMeetForScheduleEvent({
  connection,
  event,
  courseTitle,
}: {
  connection: CalendarConnection;
  event: Pick<ScheduleEvent, "id" | "title" | "description" | "startsAt" | "endsAt" | "timezone">;
  courseTitle?: string | null;
}) {
  const { connection: freshConnection, accessToken } = await getValidGoogleCalendarAccessToken(connection);
  const conferenceRequestId = randomUUID();
  const calendarEvent = await googleFetch<GoogleCalendarEvent>(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(freshConnection.calendarId || "primary")}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        description: [event.description, courseTitle ? `Course: ${courseTitle}` : null, "Created by CSCN."]
          .filter(Boolean)
          .join("\n\n"),
        start: {
          dateTime: event.startsAt.toISOString(),
          timeZone: event.timezone,
        },
        end: {
          dateTime: (event.endsAt ?? new Date(event.startsAt.getTime() + 60 * 60 * 1000)).toISOString(),
          timeZone: event.timezone,
        },
        conferenceData: {
          createRequest: {
            requestId: conferenceRequestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );

  const meetingUrl = extractMeetUrl(calendarEvent);
  const conferenceStatus: "SUCCESS" | "FAILED" =
    calendarEvent.conferenceData?.createRequest?.status?.statusCode === "failure" || !meetingUrl
      ? "FAILED"
      : "SUCCESS";

  const existingExternal = await db.scheduleEventExternalCalendar.findUnique({
    where: { scheduleEventId: event.id },
    select: { id: true },
  });

  const externalData = {
    calendarConnectionId: freshConnection.id,
    provider: "GOOGLE" as const,
    externalEventId: calendarEvent.id ?? null,
    externalHtmlLink: calendarEvent.htmlLink ?? null,
    externalICalUid: calendarEvent.iCalUID ?? null,
    conferenceRequestId,
    conferenceStatus,
    meetingUrl,
    conferenceId: calendarEvent.conferenceData?.conferenceId ?? null,
    syncError: conferenceStatus === "SUCCESS" ? null : "Google Calendar did not return a Meet link.",
    lastSyncedAt: new Date(),
  };

  if (existingExternal) {
    await db.scheduleEventExternalCalendar.update({
      where: { id: existingExternal.id },
      data: externalData,
    });
  } else {
    await db.scheduleEventExternalCalendar.create({
      data: {
        scheduleEventId: event.id,
        ...externalData,
      },
    });
  }

  await db.scheduleEvent.update({
    where: { id: event.id },
    data: {
      meetingProvider: "GOOGLE_MEET",
      meetingStatus: conferenceStatus === "SUCCESS" ? "READY" : "FAILED",
      meetingUrl,
    },
  });

  return { meetingUrl, conferenceStatus };
}

export async function createGoogleCalendarEvent({
  connection,
  event,
}: {
  connection: CalendarConnection;
  event: Pick<ScheduleEvent, "title" | "description" | "startsAt" | "endsAt" | "timezone" | "meetingUrl">;
}) {
  const { connection: freshConnection, accessToken } = await getValidGoogleCalendarAccessToken(connection);
  const calendarEvent = await googleFetch<GoogleCalendarEvent>(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(freshConnection.calendarId || "primary")}/events?sendUpdates=none`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        description: [event.description, "Added from CSCN."].filter(Boolean).join("\n\n"),
        location: event.meetingUrl ?? undefined,
        start: {
          dateTime: event.startsAt.toISOString(),
          timeZone: event.timezone,
        },
        end: {
          dateTime: (event.endsAt ?? new Date(event.startsAt.getTime() + 60 * 60 * 1000)).toISOString(),
          timeZone: event.timezone,
        },
      }),
    }
  );

  await db.calendarConnection.update({
    where: { id: freshConnection.id },
    data: { lastSyncedAt: new Date() },
  });

  return calendarEvent;
}

export async function getConnectedGoogleCalendar(userId: string) {
  return db.calendarConnection.findFirst({
    where: {
      userId,
      provider: "GOOGLE",
      status: "CONNECTED",
    },
  });
}
