import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getStudioCourse, getCourseAnalytics, getCourseRole } from '@/data/instructor';
import { getCategories } from '@/data/courses';
import { getLatestCourseReview } from '@/data/course-reviews';
import CourseStudio from '@/components/dashboard/instructor/CourseStudio';

interface Props {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CourseStudioPage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { tab } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) redirect('/signin');

  const [course, categories, analytics] = await Promise.all([
    getStudioCourse(courseId, session.user.id),
    getCategories(),
    tab === 'analytics' ? getCourseAnalytics(courseId, session.user.id) : Promise.resolve(null),
  ]);

  if (!course) notFound();

  const [callerRole, latestReview] = await Promise.all([
    getCourseRole(courseId, session.user.id),
    getLatestCourseReview(courseId),
  ]);

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

  return (
    <CourseStudio
      course={course}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      analytics={analytics}
      initialTab={tab ?? 'settings'}
      isAdmin={isAdmin}
      callerRole={callerRole}
      latestReview={latestReview}
    />
  );
}
