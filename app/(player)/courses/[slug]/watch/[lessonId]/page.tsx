import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
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

function normalizeTimestamps(value: unknown): Array<{ time: string; label: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const time = typeof record.time === 'string' ? record.time : '';
      const label = typeof record.label === 'string' ? record.label : '';
      return time && label ? { time, label } : null;
    })
    .filter((item): item is { time: string; label: string } => !!item);
}

function getVideoTimestamps(bodyContent: string | null) {
  if (!bodyContent) return [];
  try {
    const parsed = JSON.parse(bodyContent) as { timestamps?: unknown };
    return normalizeTimestamps(parsed.timestamps);
  } catch {
    return [];
  }
}

function buildSidebarModules(
  modules: Array<{
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
    lessons: Array<{ id: string; title: string; duration: number | null; contentType: string; isPreview: boolean; isPublished: boolean }>;
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
      contentType: lesson.contentType,
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
          isPublished: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              duration: true,
              contentType: true,
              isPreview: true,
              isPublished: true,
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
      quiz: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: {
              options: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  text: true,
                  position: true,
                },
              },
            },
          },
        },
      },
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

  const currentModule = courseDetail.modules.find((mod) =>
    mod.lessons.some((moduleLesson) => moduleLesson.id === lessonId)
  );
  const currentLessonShell = currentModule?.lessons.find((moduleLesson) => moduleLesson.id === lessonId);
  if (!currentModule || !currentLessonShell) notFound();
  if (!isAuthorizedPreview && (!currentModule.isPublished || !currentLessonShell.isPublished || !lesson.isPublished)) {
    notFound();
  }

  // 4. Fetch enrollment and progress
  const enrollment = userId
    ? await db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: courseDetail.id } },
      })
    : null;

  const completedSet = new Set<string>();
  let currentLessonProgress: {
    lastSeekTime: number;
    percentComplete: number;
    completedAt: Date | null;
  } | null = null;

  if (userId) {
    const progressList = await db.lessonProgress.findMany({
      where: {
        userId,
        percentComplete: { gte: 100 },
        lesson: {
          module: {
            courseId: courseDetail.id,
          },
        },
      },
      select: { lessonId: true },
    });
    progressList.forEach((p) => completedSet.add(p.lessonId));

    currentLessonProgress = await db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: {
        lastSeekTime: true,
        percentComplete: true,
        completedAt: true,
      },
    });
  }

  // Auto-enroll: server-side, then redirect to strip the query param
  if (autoEnroll === 'true' && userId && !enrollment) {
    await enrollUser(userId, slug, { revalidate: false });
    redirect(`/courses/${slug}/watch/${lessonId}`);
  }

  const isEnrolled = !!enrollment;
  const isAuthenticated = !!userId;
  const canWatch = lesson.isPreview || isEnrolled || isAuthorizedPreview;
  const visibleModules = isAuthorizedPreview
    ? courseDetail.modules
    : courseDetail.modules
        .filter((mod) => mod.isPublished)
        .map((mod) => ({
          ...mod,
          lessons: mod.lessons.filter((moduleLesson) => moduleLesson.isPublished),
        }))
        .filter((mod) => mod.lessons.length > 0);

  const sidebarModules = buildSidebarModules(
    visibleModules,
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

  const lessonNotes = userId && canWatch && isEnrolled && !isAuthorizedPreview
    ? await db.lessonNote.findMany({
        where: { userId, lessonId },
        orderBy: [{ timestamp: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          body: true,
          timestamp: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];

  const quizAttemptsUsed = userId && lesson.quiz
    ? await db.quizAttempt.count({
        where: {
          userId,
          quizId: lesson.quiz.id,
          status: "SUBMITTED",
        },
      })
    : 0;

  const quizAttemptsRemaining = lesson.quiz?.maxAttempts
    ? Math.max(0, lesson.quiz.maxAttempts - quizAttemptsUsed)
    : null;

  // Generate signed Mux playback token (RS256) scoped to this lesson's duration
  let muxToken: string | null = null;
  if (canWatch && lesson.muxPlaybackId) {
    muxToken = signMuxToken(lesson.muxPlaybackId, 'v', lesson.duration);
  }

  const safeLesson: PlayerLesson = {
    id: lesson.id,
    title: lesson.title,
    overview: canWatch ? lesson.overview : null,
    videoUrl: canWatch ? lesson.videoUrl : null,
    muxPlaybackId: canWatch ? lesson.muxPlaybackId ?? null : null,
    muxToken,
    timestamps: canWatch ? getVideoTimestamps(lesson.bodyContent) : [],
    duration: lesson.duration,
    transcript: canWatch ? lesson.transcript : null,
    bodyContent: canWatch ? lesson.bodyContent : null,
    contentType: lesson.contentType,
    quiz: canWatch && lesson.quiz
      ? {
          id: lesson.quiz.id,
          mode: lesson.quiz.mode,
          instructions: lesson.quiz.instructions,
          passingScore: lesson.quiz.passingScore,
          maxAttempts: lesson.quiz.maxAttempts,
          showAnswers: lesson.quiz.showAnswers,
          gateUntilPassed: lesson.quiz.gateUntilPassed,
          shuffleQuestions: lesson.quiz.shuffleQuestions,
          attemptsUsed: quizAttemptsUsed,
          attemptsRemaining: quizAttemptsRemaining,
          questions: lesson.quiz.questions.map((question) => ({
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            position: question.position,
            options: question.options.map((option) => ({
              id: option.id,
              text: option.text,
              position: option.position,
            })),
          })),
        }
      : null,
    progress: currentLessonProgress
      ? {
          lastSeekTime: currentLessonProgress.lastSeekTime,
          percentComplete: currentLessonProgress.percentComplete,
          isCompleted: !!currentLessonProgress.completedAt,
        }
      : null,
    resources: canWatch
      ? lesson.resources.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
        }))
      : [],
    notes: lessonNotes.map((note) => ({
      id: note.id,
      body: note.body,
      timestamp: note.timestamp,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
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
