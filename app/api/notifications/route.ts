import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNotifications, getUnreadCount, markAllRead, markVisibleNotificationsSeen } from "@/data/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(session.user.id),
    getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllRead(session.user.id);
  const unreadCount = await getUnreadCount(session.user.id);
  return NextResponse.json({ success: true, unreadCount });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : [];

  const result = await markVisibleNotificationsSeen(session.user.id, ids);
  const unreadCount = await getUnreadCount(session.user.id);

  return NextResponse.json({ success: true, ...result, unreadCount });
}
