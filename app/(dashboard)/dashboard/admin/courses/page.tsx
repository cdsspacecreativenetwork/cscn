import { getAllCoursesAdmin } from '@/data/admin-courses';
import { getCategories } from '@/data/courses';
import AdminCourseList from '@/components/dashboard/admin/AdminCourseList';
import { requireAnyAdminPermission } from '@/lib/admin-guards';

export const metadata = { title: 'Course Management — CSCN Admin' };

export default async function AdminCoursesPage() {
  const session = await requireAnyAdminPermission([
    'canManageCourses',
    'canReviewCourses',
    'canPublishCourses',
    'canManageBilling',
    'canManageMarketing',
  ]);

  const { role } = session.user;
  const adminId = session.user.id;
  if (!adminId) throw new Error('Admin session is missing a user id.');
  const adminPermissions = session.user as typeof session.user & {
    canManageCourses?: boolean;
    canReviewCourses?: boolean;
    canPublishCourses?: boolean;
    canManageBilling?: boolean;
    canManageMarketing?: boolean;
  };

  const [coursesData, categories] = await Promise.all([
    getAllCoursesAdmin({}),
    getCategories(),
  ]);

  const rawCourses = coursesData.courses;

  const courses = rawCourses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    thumbnail: c.thumbnail,
    status: c.status,
    difficulty: c.difficulty,
    featuredOrder: c.featuredOrder,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    instructorId: c.instructorId,
    instructor: c.instructor,
    price: c.price ? Number(c.price) : null,
    baseCurrency: c.baseCurrency,
    pricingProposal: c.pendingProposal
      ? {
          id: c.pendingProposal.id,
          proposedPrice: c.pendingProposal.proposedPrice ? Number(c.pendingProposal.proposedPrice) : null,
          currentPriceSnapshot: c.pendingProposal.currentPriceSnapshot ? Number(c.pendingProposal.currentPriceSnapshot) : null,
          currency: c.pendingProposal.currency,
          status: c.pendingProposal.status,
          createdAt: c.pendingProposal.createdAt.toISOString(),
          submittedBy: { name: c.instructor.name, email: "" },
        }
      : null,
    revisions: [],
    category: null,
    enrollments: c._count.enrollments,
    lessons: c._count.modules,
  }));

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] max-w-[1728px] mx-auto w-full font-jakarta mb-20">
      <AdminCourseList
        courses={courses}
        adminId={adminId}
        permissions={{
          canManageCourses: role === 'SUPER_ADMIN' || Boolean(adminPermissions.canManageCourses),
          canReviewCourses: role === 'SUPER_ADMIN' || Boolean(adminPermissions.canReviewCourses),
          canPublishCourses: role === 'SUPER_ADMIN' || Boolean(adminPermissions.canPublishCourses),
          canManageBilling: role === 'SUPER_ADMIN' || Boolean(adminPermissions.canManageBilling),
          canManageMarketing: role === 'SUPER_ADMIN' || Boolean(adminPermissions.canManageMarketing),
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
