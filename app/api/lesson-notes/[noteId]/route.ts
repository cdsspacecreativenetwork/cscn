import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const body = await request.json().catch(() => null);
  const noteBody = String(body?.body ?? "").trim();

  if (!noteBody) {
    return NextResponse.json({ error: "Write a note before saving." }, { status: 400 });
  }
  if (noteBody.length > 5000) {
    return NextResponse.json({ error: "Notes must be 5,000 characters or fewer." }, { status: 400 });
  }

  const note = await db.lessonNote.updateMany({
    where: { id: noteId, userId: session.user.id },
    data: { body: noteBody },
  });

  if (note.count === 0) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const updated = await db.lessonNote.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      body: true,
      timestamp: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    note: updated
      ? {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        }
      : null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const result = await db.lessonNote.deleteMany({
    where: { id: noteId, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
