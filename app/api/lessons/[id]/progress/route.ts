import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  completeLessonForUser,
  updateLessonPlaybackProgress,
} from "@/lib/services/courses.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const result = await completeLessonForUser(session.user.id, lessonId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    newlyUnlockedAchievements: result.newlyUnlockedAchievements || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const body = await request.json().catch(() => null);

  const lastSeekTime = Number(body?.lastSeekTime);
  const percentComplete = Number(body?.percentComplete);

  const result = await updateLessonPlaybackProgress(session.user.id, lessonId, {
    lastSeekTime,
    percentComplete,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    progress: result.progress,
  });
}
