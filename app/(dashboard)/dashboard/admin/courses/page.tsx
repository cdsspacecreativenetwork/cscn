import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAllCoursesAdmin } from '@/data/admin-courses';
import { getCategories } from '@/data/courses';
import AdminCourseList from '@/components/dashboard/admin/AdminCourseList';

export const metadata = { title: 'Course Management — CSCN Admin' };

export default async function AdminCoursesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  const { role, id: adminId } = session.user;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') redirect('/dashboard');
  const adminPermissions = session.user as typeof session.user & {
    canManageCourses?: boolean;
    canManageBilling?: boolean;
  };

  const [rawCourses, categories] = await Promise.all([
    getAllCoursesAdmin(adminId),
    getCategories(),
  ]);

  const totalLessons = (c: (typeof rawCourses)[number]) =>
    c.modules.reduce((s, m) => s + m._count.lessons, 0);

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
    pricingProposal: c.pricingProposals[0]
      ? {
          id: c.pricingProposals[0].id,
          proposedPrice: c.pricingProposals[0].proposedPrice ? Number(c.pricingProposals[0].proposedPrice) : null,
          currentPriceSnapshot: c.pricingProposals[0].currentPriceSnapshot ? Number(c.pricingProposals[0].currentPriceSnapshot) : null,
          currency: c.pricingProposals[0].currency,
          status: c.pricingProposals[0].status,
          createdAt: c.pricingProposals[0].createdAt.toISOString(),
          submittedBy: c.pricingProposals[0].submittedBy,
        }
      : null,
    category: c.category?.name ?? null,
    enrollments: c._count.enrollments,
    lessons: totalLessons(c),
  }));

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] max-w-[1728px] mx-auto w-full font-jakarta mb-20">
      <AdminCourseList
        courses={courses}
        adminId={adminId}
        permissions={{
          canManageCourses: role === 'SUPER_ADMIN' || Boolean(adminPermissions.canManageCourses),
          canManageBilling: role === 'SUPER_ADMIN' || Boolean(adminPermissions.canManageBilling),
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
