import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { markRead } from "@/data/notifications";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await markRead(id, session.user.id);
  return NextResponse.json({ success: true });
}
