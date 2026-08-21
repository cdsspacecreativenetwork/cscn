import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getStudioCourse, getCourseAnalytics, getCourseRole, getCourseInstructors, getPendingCourseInvites } from '@/data/instructor';
import { getAvailableExamsAction } from '@/actions/instructor';
import { getCategories } from '@/data/courses';
import { getLatestCourseReview } from '@/data/course-reviews';
import { getUnresolvedFeedbackCount, getCourseFeedback } from '@/data/course-feedback';
import CourseStudio from '@/components/dashboard/instructor/CourseStudio';
import { shouldRedirectInstructorToOnboarding } from '@/lib/instructor-onboarding';

interface Props {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CourseStudioPage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { tab } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) redirect('/signin');
  if (session.user.role === 'INSTRUCTOR' && await shouldRedirectInstructorToOnboarding(session.user.id)) {
    redirect('/dashboard/profile?setup=instructor');
  }

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

  const [course, categories, analytics, availableExams] = await Promise.all([
    getStudioCourse(courseId, session.user.id, isAdmin),
    getCategories(),
    getCourseAnalytics(courseId, session.user.id, isAdmin),
    getAvailableExamsAction().catch(() => []),
  ]);

  if (!course) notFound();

  const [callerRole, latestReview, openFeedbackCount, feedbackData] = await Promise.all([
    getCourseRole(courseId, session.user.id, isAdmin),
    getLatestCourseReview(courseId),
    getUnresolvedFeedbackCount(courseId),
    getCourseFeedback(courseId),
  ]);

  if (!callerRole) notFound();

  const [instructors, pendingInvites] = await Promise.all([
    getCourseInstructors(courseId, session.user.id, isAdmin),
    callerRole === 'OWNER'
      ? getPendingCourseInvites(courseId, session.user.id, isAdmin)
      : Promise.resolve([]),
  ]);

  const rosterData = {
    myRole: callerRole,
    instructors,
    pendingInvites,
  };

  const studioCourse = JSON.parse(JSON.stringify(course));
  studioCourse.availableExams = JSON.parse(JSON.stringify(availableExams));

  return (
    <CourseStudio
      course={studioCourse}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      analytics={analytics}
      initialTab={tab ?? 'settings'}
      isAdmin={isAdmin}
      callerRole={callerRole}
      latestReview={JSON.parse(JSON.stringify(latestReview))}
      currentUserId={session.user.id}
      openFeedbackCount={openFeedbackCount}
      initialRosterData={JSON.parse(JSON.stringify(rosterData))}
      initialFeedbackData={JSON.parse(JSON.stringify(feedbackData))}
    />
  );
}

