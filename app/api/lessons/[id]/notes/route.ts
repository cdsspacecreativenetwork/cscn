import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireEnrolledStudent(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      isPublished: true,
      module: {
        select: {
          isPublished: true,
          courseId: true,
          course: { select: { status: true } },
        },
      },
    },
  });

  if (!lesson) return { error: "Lesson not found", status: 404 as const };
  if (!lesson.isPublished || !lesson.module.isPublished || lesson.module.course.status !== "PUBLISHED") {
    return { error: "Lesson is not available yet", status: 403 as const };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
    select: { id: true },
  });

  if (!enrollment) return { error: "Not enrolled", status: 403 as const };
  return { lesson };
}

function normalizeTimestamp(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp < 0) return null;
  return timestamp;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const access = await requireEnrolledStudent(session.user.id, lessonId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const notes = await db.lessonNote.findMany({
    where: { userId: session.user.id, lessonId },
    orderBy: [{ timestamp: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      body: true,
      timestamp: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    notes: notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const access = await requireEnrolledStudent(session.user.id, lessonId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json().catch(() => null);
  const noteBody = String(body?.body ?? "").trim();
  if (!noteBody) {
    return NextResponse.json({ error: "Write a note before saving." }, { status: 400 });
  }
  if (noteBody.length > 5000) {
    return NextResponse.json({ error: "Notes must be 5,000 characters or fewer." }, { status: 400 });
  }

  const note = await db.lessonNote.create({
    data: {
      userId: session.user.id,
      lessonId,
      body: noteBody,
      timestamp: normalizeTimestamp(body?.timestamp),
    },
    select: {
      id: true,
      body: true,
      timestamp: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    note: {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    },
  });
}
