import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getStudioCourse, getCourseAnalytics, getCourseRole, getCourseInstructors, getPendingCourseInvites } from '@/data/instructor';
import { getCategories } from '@/data/courses';
import { getLatestCourseReview } from '@/data/course-reviews';
import { getUnresolvedFeedbackCount, getCourseFeedback } from '@/data/course-feedback';
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
    getCourseAnalytics(courseId, session.user.id),
  ]);

  if (!course) notFound();

  const [callerRole, latestReview, openFeedbackCount, feedbackData] = await Promise.all([
    getCourseRole(courseId, session.user.id),
    getLatestCourseReview(courseId),
    getUnresolvedFeedbackCount(courseId),
    getCourseFeedback(courseId),
  ]);

  if (!callerRole) notFound();

  const [instructors, pendingInvites] = await Promise.all([
    getCourseInstructors(courseId, session.user.id),
    callerRole === 'OWNER'
      ? getPendingCourseInvites(courseId, session.user.id)
      : Promise.resolve([]),
  ]);

  const rosterData = {
    myRole: callerRole,
    instructors,
    pendingInvites,
  };

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
      currentUserId={session.user.id}
      openFeedbackCount={openFeedbackCount}
      initialRosterData={JSON.parse(JSON.stringify(rosterData))}
      initialFeedbackData={JSON.parse(JSON.stringify(feedbackData))}
    />
  );
}
