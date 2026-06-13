"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function disconnectGoogleCalendarAction() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const connection = await db.calendarConnection.findUnique({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: "GOOGLE",
      },
    },
    select: { id: true },
  });

  if (connection) {
    await db.calendarConnection.update({
      where: { id: connection.id },
      data: { status: "REVOKED" },
    });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/instructor/live-sessions");
}
