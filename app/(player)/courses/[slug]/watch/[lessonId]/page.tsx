import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  getLessonAccess,
  getPlayerData,
  getCourseDetail,
  enrollUser,
} from '@/lib/services/courses.service';
import { CoursePlayerView } from '@/components/dashboard/courses/CoursePlayerView';
import type { SidebarModule, PlayerLesson } from '@/types/player';

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
  completedSet: Set<string>
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
      isLocked: !isEnrolled && !lesson.isPreview,
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

  const [lessonResult, courseDetail, playerData] = await Promise.all([
    getLessonAccess(lessonId, userId),
    getCourseDetail(slug),
    userId ? getPlayerData(slug, userId) : Promise.resolve(null),
  ]);

  if (!lessonResult || !courseDetail) notFound();

  const { lesson } = lessonResult;

  // Auto-enroll: server-side, then redirect to strip the query param
  if (autoEnroll === 'true' && userId && playerData && !playerData.enrollment) {
    await enrollUser(userId, slug);
    redirect(`/courses/${slug}/watch/${lessonId}`);
  }

  const isEnrolled = !!playerData?.enrollment;
  const isAuthenticated = !!userId;
  const canWatch = lesson.isPreview || isEnrolled;
  const completedSet = playerData?.completedSet ?? new Set<string>();

  const sidebarModules = buildSidebarModules(
    courseDetail.modules,
    isEnrolled,
    lessonId,
    completedSet
  );

  const allLessons = sidebarModules.flatMap((m) => m.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const nextLessonId =
    currentIdx >= 0 && currentIdx < allLessons.length - 1
      ? allLessons[currentIdx + 1].id
      : null;

  const safeLesson: PlayerLesson = {
    id: lesson.id,
    title: lesson.title,
    videoUrl: canWatch ? lesson.videoUrl : null,
    duration: lesson.duration,
    transcript: canWatch ? lesson.transcript : null,
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
      />
    </div>
  );
}
