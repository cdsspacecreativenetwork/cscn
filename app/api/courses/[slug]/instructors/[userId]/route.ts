import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { removeCourseInstructor, updateCourseInstructorRole } from "@/data/instructor";
import type { CourseInstructorRole } from "@prisma/client";

type Params = { params: Promise<{ slug: string; userId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: courseId, userId: targetUserId } = await params;
  const ownerId = session.user.id;

  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validRoles: CourseInstructorRole[] = ["CO_INSTRUCTOR", "TEACHING_ASSISTANT"];
  if (!body.role || !validRoles.includes(body.role as CourseInstructorRole)) {
    return NextResponse.json(
      { error: `role must be one of: ${validRoles.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updated = await updateCourseInstructorRole(
      courseId,
      ownerId,
      targetUserId,
      body.role as CourseInstructorRole
    );
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status =
      message.includes("owner") || message.includes("Cannot") ? 403 :
      message === "Course not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: courseId, userId: targetUserId } = await params;
  const ownerId = session.user.id;

  try {
    await removeCourseInstructor(courseId, ownerId, targetUserId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status =
      message.includes("owner") || message.includes("Cannot") ? 403 :
      message === "Course not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
