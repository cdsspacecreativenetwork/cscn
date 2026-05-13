import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDashboardEnrollments } from '@/lib/services/courses.service';
import MyCoursesClient from '@/components/dashboard/MyCoursesClient';
import type { MyCourseCardProps } from '@/components/dashboard/MyCourseCard';
import { generateTapbackAvatar } from '@/lib/avatar';

export default async function MyCourses() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  const enrollments = await getDashboardEnrollments(session.user.id);

  const courses: MyCourseCardProps[] = enrollments.map((enr) => {
    const c = enr.course;
    const totalLessons = c.modules.reduce((sum, m) => sum + m._count.lessons, 0);
    const firstLessonId = c.modules[0]?.lessons[0]?.id ?? null;
    const durationMins = c.duration ?? 0;
    const durationLabel =
      durationMins >= 60
        ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}`
        : durationMins > 0
        ? `${durationMins}m`
        : '—';

    return {
      id: enr.id,
      slug: c.slug,
      title: c.title,
      category: c.category?.name ?? 'Course',
      lessons: String(totalLessons),
      duration: durationLabel,
      author: c.instructor.name ?? 'CSCN Instructor',
      authorAvatar:
        c.instructor.image ?? generateTapbackAvatar(c.instructor.name ?? 'Instructor'),
      image: c.thumbnail ?? '/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg',
      progress: enr.status === 'COMPLETED' ? 100 : 0,
      status: enr.status === 'COMPLETED' ? 'Completed' : 'In Progress',
      firstLessonId,
    };
  });

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-8 max-w-[1728px] mx-auto w-full font-jakarta">
      <div className="flex flex-col gap-2">
        <h1 className="text-[24px] lg:text-[28px] font-bold text-[#040B37] tracking-tight">
          My Learning
        </h1>
        <p className="text-[14px] font-medium text-text-mute">
          Track and continue your learning journey
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-text-mute">
              <path d="M12 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" fill="currentColor" opacity=".3" />
              <path d="M12 14c-3.33 0-6 1.34-6 3v1h12v-1c0-1.66-2.67-3-6-3Z" fill="currentColor" />
            </svg>
          </div>
          <p className="text-text-mute font-medium">You haven&apos;t enrolled in any courses yet.</p>
          <a
            href="/courses"
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-[#163fa3] transition-colors"
          >
            Browse Courses
          </a>
        </div>
      ) : (
        <MyCoursesClient courses={courses} />
      )}
    </div>
  );
}
