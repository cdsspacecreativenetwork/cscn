import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { signMuxToken } from '@/lib/mux-jwt';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lessonId = new URL(req.url).searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      muxPlaybackId: true,
      duration: true,
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

  if (!lesson?.muxPlaybackId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const role = session.user.role as string | undefined;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isInstructor =
    lesson.module.course.instructorId === session.user.id ||
    lesson.module.course.instructors.some((i) => i.userId === session.user.id);

  if (!isAdmin && !isInstructor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = signMuxToken(lesson.muxPlaybackId, 'v', lesson.duration);
  return NextResponse.json({ token, playbackId: lesson.muxPlaybackId });
}
