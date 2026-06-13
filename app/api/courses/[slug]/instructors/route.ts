import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getCourseInstructors,
  getCourseRole,
  getPendingCourseInvites,
  createCourseInvite,
} from "@/data/instructor";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: courseId } = await params;
  const userId = session.user.id;
  // @ts-ignore
  const userRole = session.user.role as string | undefined;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  try {
    // Admins can view any course roster — bypass the membership check
    if (isAdmin) {
      const [instructors, pendingInvites] = await Promise.all([
        db.courseInstructor.findMany({
          where: { courseId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, role: true, createdAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        }),
        db.courseInvite.findMany({
          where: { courseId, usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          select: { id: true, token: true, email: true, role: true, expiresAt: true, createdAt: true },
        }),
      ]);
      return NextResponse.json({ myRole: "OWNER", instructors, pendingInvites, isAdmin: true });
    }

    const myRole = await getCourseRole(courseId, userId);
    if (!myRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [instructors, pendingInvites] = await Promise.all([
      getCourseInstructors(courseId, userId),
      myRole === "OWNER"
        ? getPendingCourseInvites(courseId, userId)
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ myRole, instructors, pendingInvites, isAdmin: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Forbidden" ? 403 : message === "Course not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: courseId } = await params;
  const userId = session.user.id;

  let body: { email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const invite = await createCourseInvite(courseId, userId, email.trim().toLowerCase());
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/course/${invite.token}`;
    return NextResponse.json({ invite, inviteUrl }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status =
      message.includes("owner") ? 403 :
      message === "Course not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
