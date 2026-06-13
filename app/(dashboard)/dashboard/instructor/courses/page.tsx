import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getInstructorCourses } from '@/data/instructor';
import { getCategories } from '@/data/courses';
import InstructorCourseList from '@/components/dashboard/instructor/InstructorCourseList';
import { shouldRedirectInstructorToOnboarding } from '@/lib/instructor-onboarding';
import { db } from '@/lib/db';

export default async function InstructorCoursesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  const role = session.user.role;
  const isPrivilegedCreator = role === 'INSTRUCTOR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  const hasCourseCollaborations = isPrivilegedCreator
    ? true
    : await db.courseInstructor.count({ where: { userId: session.user.id } }).then((count) => count > 0);

  if (!hasCourseCollaborations) {
    redirect('/dashboard');
  }
  if (role === 'INSTRUCTOR' && await shouldRedirectInstructorToOnboarding(session.user.id)) {
    redirect('/dashboard/profile?setup=instructor');
  }

  const [courses, categories] = await Promise.all([
    getInstructorCourses(session.user.id),
    getCategories(),
  ]);

  const totalLessons = (course: (typeof courses)[number]) =>
    course.modules.reduce((s, m) => s + m._count.lessons, 0);

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-8 max-w-[1728px] mx-auto w-full font-jakarta">
      <InstructorCourseList
        courses={courses.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          thumbnail: c.thumbnail,
          status: c.status,
          difficulty: c.difficulty,
          category: c.category?.name ?? null,
          enrollments: c._count.enrollments,
          lessons: totalLessons(c),
          updatedAt: c.updatedAt.toISOString(),
          isOwner: c.instructorId === session.user.id,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        canCreateCourse={isPrivilegedCreator}
      />
    </div>
  );
}
