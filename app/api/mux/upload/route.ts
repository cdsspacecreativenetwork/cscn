import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { mux } from "@/lib/mux";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

async function getLessonWithAccess(
  lessonId: string,
  userId: string,
  userRole: string | undefined,
) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      muxAssetId: true,
      muxUploadId: true,
      module: {
        select: {
          course: {
            select: {
              instructorId: true,
              instructors: { select: { userId: true } },
            },
          },
        },
      },
    },
  });
  if (!lesson) return null;

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isOwner =
    lesson.module.course.instructorId === userId ||
    lesson.module.course.instructors.some((i) => i.userId === userId);

  if (!isAdmin && !isOwner) return null;
  return lesson;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessonId = new URL(req.url).searchParams.get("lessonId");
  if (!lessonId)
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const lesson = await getLessonWithAccess(
    lessonId,
    session.user.id,
    session.user.role as string,
  );
  if (!lesson)
    return NextResponse.json(
      { error: "Not found or forbidden" },
      { status: 404 },
    );

  const rateLimit = await enforceRateLimit("mux-upload", session.user.id, RATE_LIMITS.upload);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many upload attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (!appOrigin) {
    return NextResponse.json({ error: "Application origin is not configured." }, { status: 503 });
  }

  try {
    const upload = await mux.video.uploads.create({
      cors_origin: appOrigin,
      new_asset_settings: {
        playback_policies: ["signed"],
        inputs: [{ generated_subtitles: [{ language_code: "en", name: "English" }] }],
      },
    });

    await db.lesson.update({
      where: { id: lessonId },
      data: { muxUploadId: upload.id, muxStatus: "UPLOADING" },
    });

    return NextResponse.json({ uploadUrl: upload.url, uploadId: upload.id });
  } catch (err: unknown) {
    console.error("Mux upload creation failed:", err);
    return NextResponse.json(
      {
        error:
          (err instanceof Error ? err.message : null) ||
          "Failed to create Mux upload. Please check Mux environment variables.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessonId = new URL(req.url).searchParams.get("lessonId");
  if (!lessonId)
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const lesson = await getLessonWithAccess(
    lessonId,
    session.user.id,
    session.user.role as string,
  );
  if (!lesson)
    return NextResponse.json(
      { error: "Not found or forbidden" },
      { status: 404 },
    );

  // Delete the Mux asset if one exists (covers PROCESSING and READY states)
  if (lesson.muxAssetId) {
    try {
      await mux.video.assets.delete(lesson.muxAssetId);
    } catch {
      // Asset may already be gone — that's fine, continue to clear DB
    }
  }

  // Reset all Mux fields on the lesson
  await db.lesson.update({
    where: { id: lessonId },
    data: {
      muxUploadId: null,
      muxAssetId: null,
      muxPlaybackId: null,
      muxStatus: "NONE",
    },
  });

  return NextResponse.json({ ok: true });
}
