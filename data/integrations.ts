import "server-only";

import { db } from "@/lib/db";

export type CalendarIntegrationStatus = {
  googleCalendar: {
    connected: boolean;
    email: string | null;
    status: string | null;
    connectedAt: string | null;
  };
};

export async function getCalendarIntegrationStatus(userId: string): Promise<CalendarIntegrationStatus> {
  const googleConnection = await db.calendarConnection.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: "GOOGLE",
      },
    },
    select: {
      providerAccountEmail: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    googleCalendar: {
      connected: googleConnection?.status === "CONNECTED",
      email: googleConnection?.providerAccountEmail ?? null,
      status: googleConnection?.status ?? null,
      connectedAt: googleConnection?.createdAt.toISOString() ?? null,
    },
  };
}
