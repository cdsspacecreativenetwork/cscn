import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDashboardEnrollments } from '@/lib/services/courses.service';
import { getStudentDashboardData } from '@/lib/services/dashboard.service';
import MyCoursesClient from '@/components/dashboard/MyCoursesClient';
import type { MyCourseCardProps } from '@/components/dashboard/MyCourseCard';
import { generateTapbackAvatar } from '@/lib/avatar';
import { StatCard } from '@/components/dashboard/StatCard';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Plus } from 'lucide-react';

type DashboardEnrollment = Awaited<ReturnType<typeof getDashboardEnrollments>>[number];

export default async function MyCourses() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  // Fetch enrollments and student dashboard analytics in parallel
  const [enrollments, studentData] = await Promise.all([
    getDashboardEnrollments(session.user.id),
    getStudentDashboardData(session.user.id)
  ]);

  const courses: MyCourseCardProps[] = await Promise.all(
    enrollments.map(async (enr: DashboardEnrollment) => {
      const c = enr.course;
      const totalLessons = c.modules.reduce(
        (sum: number, m: { _count: { lessons: number } }) => sum + m._count.lessons,
        0
      );
      const firstLessonId = c.modules[0]?.lessons[0]?.id ?? null;
      const durationMins = c.duration ?? 0;
      const durationLabel =
        durationMins >= 60
          ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}`
          : durationMins > 0
          ? `${durationMins}m`
          : '—';

      // Count completed lessons for this user on this specific course dynamically
      const completedCount = await db.lessonProgress.count({
        where: {
          userId: session.user.id,
          percentComplete: { gte: 100 },
          lesson: {
            module: {
              courseId: c.id
            }
          }
        }
      });

      const calculatedProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      const progressPercent = enr.status === 'COMPLETED' ? 100 : calculatedProgress;

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
        progress: progressPercent,
        status: progressPercent === 100 ? 'Completed' : 'In Progress',
        firstLessonId,
        rating: c.ratingAverage ?? 0,
        reviews: c.ratingCount ?? 0,
      };
    })
  );

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-8 max-w-[1728px] mx-auto w-full font-jakarta">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] lg:text-[28px] font-bold text-[#040B37] tracking-tight">
            My Learning
          </h1>
          <p className="text-[14px] font-medium text-text-mute">
            Track and continue your learning journey
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#1C4ED1] px-4 py-2 text-[13px] font-semibold text-white shadow-[0px_4px_12px_rgba(28,78,209,0.15)] transition-all hover:bg-[#163fa3] active:scale-[0.98]"
        >
          <Plus size={18} />
          Browse Courses
        </Link>
      </div>

      {/* Student At-a-Glance Stats - Co-located perfectly at the top of My Learning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(16px,1.39vw,24px)]">
        <StatCard
          title="Courses Enrolled"
          value={studentData.coursesEnrolled}
          iconSrc="/assets/dashboard/user/book-open-text.svg"
        />
        <StatCard
          title="Hours Spent"
          value={studentData.hoursSpent}
          iconSrc="/assets/dashboard/user/hourglass.svg"
        />
        <StatCard
          title="Completion Rate"
          value={`${studentData.completionRate}%`}
          iconSrc="/assets/dashboard/user/check-list.svg"
        />
        <StatCard
          title="Learning Streak"
          value={studentData.learningStreak}
          iconSrc="/assets/dashboard/user/fire-03.svg"
        />
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
          <p className="text-[13px] font-medium text-text-mute">
            Use the Browse Courses button above to find your first class.
          </p>
        </div>
      ) : (
        <MyCoursesClient courses={courses} />
      )}
    </div>
  );
}
