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
    category: c.category?.name ?? null,
    enrollments: c._count.enrollments,
    lessons: totalLessons(c),
  }));

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] max-w-[1728px] mx-auto w-full font-jakarta mb-20">
      <AdminCourseList
        courses={courses}
        adminId={adminId}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
