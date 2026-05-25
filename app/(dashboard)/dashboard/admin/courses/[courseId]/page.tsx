import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getStudioCourseAdmin, getCourseAnalyticsAdmin } from '@/data/admin-courses';
import { getCategories } from '@/data/courses';
import { getLatestCourseReview } from '@/data/course-reviews';
import { getUnresolvedFeedbackCount, getCourseFeedback } from '@/data/course-feedback';
import CourseStudio from '@/components/dashboard/instructor/CourseStudio';
import { db } from '@/lib/db';

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

  const [course, categories, latestReview, analytics, openFeedbackCount, feedbackData] = await Promise.all([
    getStudioCourseAdmin(courseId),
    getCategories(),
    getLatestCourseReview(courseId),
    getCourseAnalyticsAdmin(courseId),
    getUnresolvedFeedbackCount(courseId),
    getCourseFeedback(courseId),
  ]);

  if (!course) notFound();

  const [instructors, pendingInvites] = await Promise.all([
    db.courseInstructor.findMany({
      where: { courseId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, role: true, createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    db.courseInvite.findMany({
      where: { courseId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, token: true, email: true, role: true, expiresAt: true, createdAt: true },
    }),
  ]);

  const rosterData = {
    myRole: "OWNER",
    instructors,
    pendingInvites,
  };

  return (
    <CourseStudio
      course={JSON.parse(JSON.stringify(course))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      analytics={analytics}
      initialTab={tab ?? 'settings'}
      isAdmin={true}
      callerRole="OWNER"
      latestReview={JSON.parse(JSON.stringify(latestReview))}
      currentUserId={session.user.id}
      openFeedbackCount={openFeedbackCount}
      initialRosterData={JSON.parse(JSON.stringify(rosterData))}
      initialFeedbackData={JSON.parse(JSON.stringify(feedbackData))}
    />
  );
}
