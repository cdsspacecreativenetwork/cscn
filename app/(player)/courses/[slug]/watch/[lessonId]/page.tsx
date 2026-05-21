import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  getLessonAccess,
  getPlayerData,
  getCourseDetail,
  enrollUser,
} from '@/lib/services/courses.service';
import { CoursePlayerView } from '@/components/dashboard/courses/CoursePlayerView';
import { signMuxToken } from '@/lib/mux-jwt';
import type { SidebarModule, PlayerLesson } from '@/types/player';
import { db } from '@/lib/db';
import { getCourseRatingSummary, getUserCourseRating } from '@/data/course-ratings';

interface Props {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams: Promise<{ autoEnroll?: string }>;
}

function buildSidebarModules(
  modules: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{ id: string; title: string; duration: number | null; isPreview: boolean }>;
  }>,
  isEnrolled: boolean,
  currentLessonId: string,
  completedSet: Set<string>,
  bypassLocks = false
): SidebarModule[] {
  return modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    position: mod.position,
    lessons: mod.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      duration: lesson.duration ? `${lesson.duration}m` : '—',
      isPreview: lesson.isPreview,
      isLocked: !bypassLocks && !isEnrolled && !lesson.isPreview,
      isCompleted: completedSet.has(lesson.id),
      isCurrent: lesson.id === currentLessonId,
    })),
  }));
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { slug, lessonId } = await params;
  const { autoEnroll } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Fetch course details, bypassing strictly PUBLISHED status
  const courseDetail = await db.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      description: true,
      instructorId: true,
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      instructors: {
        select: {
          userId: true,
        },
      },
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              duration: true,
              isPreview: true,
            },
          },
        },
      },
    },
  });

  if (!courseDetail) notFound();

  // 2. Fetch lesson detail securely
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: true,
    },
  });

  if (!lesson) notFound();

  // 3. Check if current user has creator (primary/co-instructor) or admin authority to preview
  const isCreator = userId && (
    courseDetail.instructorId === userId || 
    courseDetail.instructors.some(i => i.userId === userId)
  );

  const isAuthorizedPreview =
    !!isCreator ||
    session?.user?.role === 'ADMIN' ||
    session?.user?.role === 'SUPER_ADMIN';

  // Security: non-creators/non-admins cannot access draft courses!
  if (courseDetail.status !== 'PUBLISHED' && !isAuthorizedPreview) {
    notFound();
  }

  // 4. Fetch enrollment and progress
  const enrollment = userId
    ? await db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: courseDetail.id } },
      })
    : null;

  const completedSet = new Set<string>();
  if (userId) {
    const progressList = await db.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          module: {
            courseId: courseDetail.id,
          },
        },
      },
      select: { lessonId: true },
    });
    progressList.forEach((p) => completedSet.add(p.lessonId));
  }

  // Auto-enroll: server-side, then redirect to strip the query param
  if (autoEnroll === 'true' && userId && !enrollment) {
    await enrollUser(userId, slug);
    redirect(`/courses/${slug}/watch/${lessonId}`);
  }

  const isEnrolled = !!enrollment;
  const isAuthenticated = !!userId;
  const canWatch = lesson.isPreview || isEnrolled || isAuthorizedPreview;

  const sidebarModules = buildSidebarModules(
    courseDetail.modules,
    isEnrolled,
    lessonId,
    completedSet,
    isAuthorizedPreview
  );

  const allLessons = sidebarModules.flatMap((m) => m.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const nextLessonId =
    currentIdx >= 0 && currentIdx < allLessons.length - 1
      ? allLessons[currentIdx + 1].id
      : null;
  const isCourseCompleted =
    isEnrolled && allLessons.length > 0 && allLessons.every((l) => completedSet.has(l.id));

  const [ratingSummary, userRating] = await Promise.all([
    getCourseRatingSummary(courseDetail.id),
    userId ? getUserCourseRating(courseDetail.id, userId) : Promise.resolve(null),
  ]);

  // Generate signed Mux playback token (RS256) scoped to this lesson's duration
  let muxToken: string | null = null;
  if (canWatch && lesson.muxPlaybackId) {
    muxToken = signMuxToken(lesson.muxPlaybackId, 'v', lesson.duration);
  }

  const safeLesson: PlayerLesson = {
    id: lesson.id,
    title: lesson.title,
    videoUrl: canWatch ? lesson.videoUrl : null,
    muxPlaybackId: canWatch ? lesson.muxPlaybackId ?? null : null,
    muxToken,
    duration: lesson.duration,
    transcript: canWatch ? lesson.transcript : null,
    bodyContent: canWatch ? lesson.bodyContent : null,
    contentType: lesson.contentType,
    resources: canWatch
      ? lesson.resources.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
        }))
      : [],
  };

  return (
    <div className="bg-[#F4F6FB] min-h-screen">
      <CoursePlayerView
        courseId={courseDetail.id}
        courseSlug={slug}
        courseTitle={courseDetail.title}
        courseDescription={courseDetail.description}
        instructorName={courseDetail.instructor.name ?? 'CSCN Instructor'}
        lesson={safeLesson}
        modules={sidebarModules}
        canWatch={canWatch}
        isEnrolled={isEnrolled}
        isAuthenticated={isAuthenticated}
        nextLessonId={nextLessonId}
        isCurrentLessonCompleted={completedSet.has(lessonId)}
        isPreviewMode={isAuthorizedPreview}
        isCourseCompleted={isCourseCompleted}
        ratingSummary={ratingSummary}
        userRating={userRating}
      />
    </div>
  );
}
