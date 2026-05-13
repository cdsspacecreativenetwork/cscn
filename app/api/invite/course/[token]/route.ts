import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCourseInviteByToken, acceptCourseInvite } from "@/data/instructor";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const invite = await getCourseInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.usedAt) {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    course: invite.course,
  });
}

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  try {
    const result = await acceptCourseInvite(token, session.user.id);
    return NextResponse.json({ success: true, courseId: result.courseId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status =
      message.includes("expired") || message.includes("already been used") ? 410 :
      message.includes("different email") ? 403 :
      message.includes("Invalid") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
