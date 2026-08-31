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
import { BookOpen, Plus } from 'lucide-react';
import { LearnerPageHeader } from '@/components/dashboard/learner/LearnerPageHeader';
import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@/components/ui/EmptyState';

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
    <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-8 p-[clamp(16px,2.78vw,48px)]">
      <LearnerPageHeader
        title="My Learning"
        description="Track and continue your learning journey."
        action={courses.length > 0 ? (
          <Link
            href="/courses"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus size={18} aria-hidden="true" />
            Browse Courses
          </Link>
        ) : undefined}
      />

      {/* Student At-a-Glance Stats - Co-located perfectly at the top of My Learning */}
      {courses.length > 0 ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
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
      </div> : null}

      {courses.length === 0 ? (
        <EmptyState className="py-12 sm:py-16">
          <EmptyStateIcon><BookOpen size={24} aria-hidden="true" /></EmptyStateIcon>
          <EmptyStateTitle>Start your first course</EmptyStateTitle>
          <EmptyStateDescription>
            Explore the course catalog and choose a learning path that fits your goals.
          </EmptyStateDescription>
          <EmptyStateContent>
            <Link
              href="/courses"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Plus size={18} aria-hidden="true" />
              Browse Courses
            </Link>
          </EmptyStateContent>
        </EmptyState>
      ) : (
        <MyCoursesClient courses={courses} />
      )}
    </div>
  );
}
