import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { mux } from '@/lib/mux';

async function getLessonWithAccess(lessonId: string, userId: string, userRole: string | undefined) {
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

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isOwner =
    lesson.module.course.instructorId === userId ||
    lesson.module.course.instructors.some((i) => i.userId === userId);

  if (!isAdmin && !isOwner) return null;
  return lesson;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lessonId = new URL(req.url).searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  const lesson = await getLessonWithAccess(lessonId, session.user.id, session.user.role as string);
  if (!lesson) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
    new_asset_settings: {
      playback_policy: ['signed'],
      generated_subtitles: [{ language_code: 'en', name: 'English' }]
    } as any,
  });

  await db.lesson.update({
    where: { id: lessonId },
    data: { muxUploadId: upload.id, muxStatus: 'UPLOADING' },
  });

  return NextResponse.json({ uploadUrl: upload.url, uploadId: upload.id });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lessonId = new URL(req.url).searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  const lesson = await getLessonWithAccess(lessonId, session.user.id, session.user.role as string);
  if (!lesson) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

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
      muxStatus: 'NONE',
    },
  });

  return NextResponse.json({ ok: true });
}
