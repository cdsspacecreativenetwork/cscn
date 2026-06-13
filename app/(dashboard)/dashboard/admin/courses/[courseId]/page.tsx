import { notFound } from 'next/navigation';
import { getStudioCourseAdmin, getCourseAnalyticsAdmin } from '@/data/admin-courses';
import { getCategories } from '@/data/courses';
import { getLatestCourseReview } from '@/data/course-reviews';
import { getUnresolvedFeedbackCount, getCourseFeedback } from '@/data/course-feedback';
import CourseStudio from '@/components/dashboard/instructor/CourseStudio';
import { AdminCourseApprovalWorkspace } from '@/components/dashboard/admin/AdminCourseApprovalWorkspace';
import { db } from '@/lib/db';
import { requireAnyAdminPermission } from '@/lib/admin-guards';
import { hasAdminPermission } from '@/lib/admin-permissions';

interface Props {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminCourseDetailPage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { tab } = await searchParams;
  const session = await requireAnyAdminPermission([
    'canManageCourses',
    'canReviewCourses',
    'canPublishCourses',
    'canManageBilling',
  ]);
  const adminId = session.user.id;
  if (!adminId) throw new Error('Admin session is missing a user id.');

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

  const serializedCourse = JSON.parse(JSON.stringify(course));
  const pendingRevision = serializedCourse.revisions?.[0] ?? null;
  const pendingDraftSnapshot = pendingRevision?.draftSnapshot ?? null;
  const shouldReviewDraftSnapshot =
    serializedCourse.status === "PUBLISHED" &&
    pendingRevision?.status === "PENDING_REVIEW" &&
    pendingDraftSnapshot;
  const studioCourse = shouldReviewDraftSnapshot
    ? {
        ...serializedCourse,
        ...pendingDraftSnapshot,
        id: serializedCourse.id,
        status: serializedCourse.status,
        instructor: serializedCourse.instructor,
        category: serializedCourse.category,
        pricingProposals: serializedCourse.pricingProposals,
        revisions: serializedCourse.revisions,
        revision: pendingRevision,
      }
    : {
        ...serializedCourse,
        revision: pendingRevision,
      };

  return (
    <div className="bg-background">
      <CourseStudio
        course={studioCourse}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        analytics={analytics}
        initialTab={tab ?? 'settings'}
        isAdmin={true}
        callerRole="OWNER"
        latestReview={JSON.parse(JSON.stringify(latestReview))}
        currentUserId={adminId}
        openFeedbackCount={openFeedbackCount}
        initialRosterData={JSON.parse(JSON.stringify(rosterData))}
        initialFeedbackData={JSON.parse(JSON.stringify(feedbackData))}
        adminReviewSlot={
          <AdminCourseApprovalWorkspace
            course={serializedCourse}
            permissions={{
              canReviewCourses: hasAdminPermission(session.user, 'canReviewCourses'),
              canPublishCourses: hasAdminPermission(session.user, 'canPublishCourses'),
              canManageBilling: hasAdminPermission(session.user, 'canManageBilling'),
            }}
          />
        }
      />
    </div>
  );
}
