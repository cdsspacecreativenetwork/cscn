import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getStudioCourseAdmin, getCourseAnalyticsAdmin } from '@/data/admin-courses';
import { getCategories } from '@/data/courses';
import { getLatestCourseReview } from '@/data/course-reviews';
import CourseStudio from '@/components/dashboard/instructor/CourseStudio';

interface Props {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminCourseDetailPage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { tab } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) redirect('/signin');
  const { role } = session.user;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') redirect('/dashboard');

  const [course, categories, latestReview, analytics] = await Promise.all([
    getStudioCourseAdmin(courseId),
    getCategories(),
    getLatestCourseReview(courseId),
    tab === 'analytics' ? getCourseAnalyticsAdmin(courseId) : Promise.resolve(null),
  ]);

  if (!course) notFound();

  return (
    <CourseStudio
      course={course}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      analytics={analytics}
      initialTab={tab ?? 'settings'}
      isAdmin={true}
      callerRole="OWNER"
      latestReview={latestReview}
    />
  );
}
