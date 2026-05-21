import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getCourseDetailWithEnrollment, getCoursePreview } from '@/lib/services/courses.service';
import { CourseHero } from '@/components/courses/CourseHero';
import { ClassLessons } from '@/components/courses/ClassLessons';
import { CourseDetails } from '@/components/courses/CourseDetails';
import { EnrollButton } from '@/components/courses/EnrollButton';
import Link from 'next/link';
import { generateTapbackAvatar } from '@/lib/avatar';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCourseDetailWithEnrollment(slug, undefined);
  if (!result) return { title: 'Course Not Found' };
  return {
    title: `${result.course.title} | CSCN`,
    description: result.course.shortDesc ?? result.course.description.slice(0, 160),
  };
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const session = await auth();

  const isPreviewMode = preview === 'true';

  let course: NonNullable<Awaited<ReturnType<typeof getCoursePreview>>> | NonNullable<Awaited<ReturnType<typeof getCourseDetailWithEnrollment>>>['course'] | null = null;
  let enrollment = null;
  let isPreview = false;

  if (isPreviewMode) {
    if (!session?.user?.id) redirect(`/signin?callbackUrl=/courses/${slug}?preview=true`);
    // @ts-ignore
    const userRole = session.user.role as string | undefined;
    const previewCourse = await getCoursePreview(slug, session.user.id, userRole);
    if (!previewCourse) notFound();
    course = previewCourse;
    isPreview = true;
  } else {
    const result = await getCourseDetailWithEnrollment(slug, session?.user?.id);
    if (!result) notFound();
    course = result.course;
    enrollment = result.enrollment;
  }

  if (!course) notFound();
  const userId = session?.user?.id;

  const firstLesson = course.modules[0]?.lessons[0];

  const courseModules = course.modules.map((mod, modIdx) => ({
    id: mod.id,
    title: mod.title,
    lessons: mod.lessons.map((lesson, lessonIdx) => ({
      id: lesson.id,
      title: lesson.title,
      contentType: lesson.contentType,
      duration: lesson.duration ? `${lesson.duration}m` : '—',
      isLocked: !lesson.isPreview && !enrollment,
      isPreview: lesson.isPreview,
      isActive: modIdx === 0 && lessonIdx === 0,
    })),
  }));

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalMinutes = course.modules
    .flatMap((m) => m.lessons)
    .reduce((sum, l) => sum + (l.duration ?? 0), 0);
  const totalDuration =
    totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
      : `${totalMinutes}m`;

  const instructorImage =
    course.instructor.image ?? generateTapbackAvatar(course.instructor.name ?? 'Instructor');

  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const enrollCta = enrollment ? (
    <div className="border border-[#648efc] p-[2px] rounded-full w-full mlg:w-auto">
      <Link
        href={`/courses/${course.slug}/watch/${firstLesson?.id}`}
        className="flex items-center justify-center w-full mlg:px-6 py-[12.5px] bg-linear-to-r from-[#0035C1] to-[#0575FF] rounded-full transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <span className="text-white font-medium text-[16px] tracking-[-0.16px] whitespace-nowrap leading-normal">
          Continue Learning
        </span>
      </Link>
    </div>
  ) : userId ? (
    <EnrollButton courseSlug={course.slug} firstLessonId={firstLesson?.id ?? null} />
  ) : (
    <div className="border border-[#648efc] p-[2px] rounded-full w-full mlg:w-auto">
      <Link
        href={`/signin?callbackUrl=/courses/${course.slug}${firstLesson?.id ? `/watch/${firstLesson.id}?autoEnroll=true` : ''}`}
        className="flex items-center justify-center w-full mlg:px-6 py-[12.5px] bg-linear-to-r from-[#0035C1] to-[#0575FF] rounded-full transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <span className="text-white font-medium text-[16px] tracking-[-0.16px] whitespace-nowrap leading-normal">
          Sign in to Enroll
        </span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col gap-[clamp(24px,3.7vw,48px)] pb-20 pt-20">
      {isPreview && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-semibold">
          Preview mode — this course is not yet visible to the public.{' '}
          <Link
            href={
              // @ts-ignore
              session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
                ? `/dashboard/admin/courses/${course!.id}`
                : `/dashboard/instructor/courses/${course!.id}`
            }
            className="underline ml-1"
          >
            Back to editor
          </Link>
        </div>
      )}
      <CourseHero
        courseTitle={course.title}
        courseDescription={course.shortDesc ?? course.description.slice(0, 200)}
        instructorName={course.instructor.name ?? 'CSCN Instructor'}
        instructorImage={instructorImage}
        publishDate={new Date(course.modules[0]?.lessons[0]?.id ? Date.now() : Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        videoThumbnail={course.thumbnail ?? '/assets/default-course.jpg'}
      />

      <div className="px-4 md:px-[clamp(20px,11.57vw,200px)] w-full flex justify-center">
        <div className="grid grid-cols-1 mlg:grid-cols-12 gap-[clamp(24px,1.85vw,32px)] items-start w-full max-w-[1440px]">
          <div className="mlg:col-span-4 w-full">
            <ClassLessons
              totalLessons={totalLessons}
              totalDuration={totalDuration}
              modules={courseModules}
            />
          </div>

          <div className="mlg:col-span-8 w-full">
            <CourseDetails
              enrolledCount={course._count.enrollments.toLocaleString()}
              ratingAverage={course.ratingAverage ?? 0}
              ratingCount={course.ratingCount ?? 0}
              price="Free"
              description={course.description}
              instructor={{
                name: course.instructor.name ?? 'CSCN Instructor',
                role: course.instructor.headline ?? 'Instructor',
                image: instructorImage,
              }}
              includes={toStringArray(course.includes)}
              requirements={toStringArray(course.requirements)}
              enrollCta={enrollCta}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
