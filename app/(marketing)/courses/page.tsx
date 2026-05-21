import { listCourses, listCategories } from '@/lib/services/courses.service';
import { toCardProps } from '@/lib/course-adapter';
import CoursesFilter from '@/components/marketing/CoursesFilter';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Courses | CSCN Learning Platform',
  description: 'Explore our catalog of industry-vetted courses in Design, Development, AI, and Brand Strategy.',
};

export default async function CoursesPage() {
  const [{ courses: dbCourses }, categories] = await Promise.all([
    listCourses(1),
    listCategories(),
  ]);

  const courses = dbCourses.map(toCardProps);
  const categoryNames = categories.map((c) => c.name);
  const instructors = [...new Set(courses.map((c) => c.author))];

  return (
    <main className="min-h-screen bg-background">
      <section className="pt-32 pb-12 md:pb-20">
        <div className="mx-auto max-w-[83rem] px-4">
          <div className="flex flex-col gap-10">
            <h1 className="text-[32px] font-semibold text-navy tracking-[-0.02em] leading-[1.24] font-inter">
              Courses
            </h1>
            <CoursesFilter
              courses={courses}
              categories={categoryNames}
              instructors={instructors}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
