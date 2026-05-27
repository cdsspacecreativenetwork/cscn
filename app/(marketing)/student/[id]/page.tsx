import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BookCheck,
  BookOpen,
  Flame,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import CourseCard from '@/components/ui/CourseCard';
import { generateTapbackAvatar } from '@/lib/avatar';
import { db } from '@/lib/db';

const statCardClass =
  'rounded-[28px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur-md';
const panelClass =
  'rounded-[30px] border border-[#DCE5F5] bg-white/92 p-6 shadow-[0_18px_60px_rgba(4,11,55,0.08)] backdrop-blur-sm md:p-8';

interface Params {
  id: string;
}

export default async function StudentPortfolioPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const student = await db.user.findUnique({
    where: { id },
    include: {
      enrollments: {
        where: { status: 'COMPLETED' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              shortDesc: true,
              thumbnail: true,
              difficulty: true,
              price: true,
              baseCurrency: true,
              certificateEnabled: true,
              category: { select: { name: true } },
              instructor: { select: { name: true, image: true } },
              _count: { select: { enrollments: true } },
              modules: {
                select: {
                  _count: { select: { lessons: true } },
                  lessons: { select: { duration: true } },
                },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      },
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const [activeCount, totalEnrollments] = await Promise.all([
    db.enrollment.count({
      where: { userId: student.id, status: 'ACTIVE' },
    }),
    db.enrollment.count({
      where: { userId: student.id },
    }),
  ]);

  const studentImage =
    student.image ?? generateTapbackAvatar(student.name ?? student.email.split('@')[0]);
  const displayName = student.name ?? student.email.split('@')[0];
  const totalCompletedLessons = student.enrollments.reduce(
    (sum, enrollment) =>
      sum + enrollment.course.modules.reduce((inner, module) => inner + module._count.lessons, 0),
    0
  );
  const totalLearningMinutes = student.enrollments.reduce((sum, enrollment) => {
    const minutes = enrollment.course.modules
      .flatMap((module) => module.lessons)
      .reduce((inner, lesson) => inner + (lesson.duration ?? 0), 0);
    return sum + minutes;
  }, 0);

  const completedCourseCards = student.enrollments.map((enrollment) => {
    const course = enrollment.course;
    const totalLessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
    const totalMinutes = course.modules
      .flatMap((module) => module.lessons)
      .reduce((sum, lesson) => sum + (lesson.duration ?? 0), 0);

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      category: course.category?.name ?? 'General',
      description: course.shortDesc ?? '',
      lessons: String(totalLessons),
      duration: totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        : `${totalMinutes}m`,
      author: course.instructor.name ?? 'Instructor',
      authorAvatar:
        course.instructor.image ?? generateTapbackAvatar(course.instructor.name ?? 'Instructor'),
      image: course.thumbnail ?? '/assets/default-course.jpg',
      rating: 4.8,
      reviews: course._count.enrollments,
      students: course._count.enrollments.toLocaleString(),
      level: course.difficulty,
      priceLabel: course.price ? `₦${Number(course.price).toLocaleString()}` : 'Free',
    };
  });

  const featuredAchievements = student.achievements.slice(0, 6);
  const certificateEnrollments = student.enrollments.filter(
    (enrollment) => enrollment.course.certificateEnabled
  );

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-24">
      <section className="relative overflow-hidden bg-[#040B37] pt-28 pb-16 text-white md:pt-32 md:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,159,67,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(5,117,255,0.20),_transparent_32%)]" />
        <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 md:px-8">
          <Link href="/courses" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/72 transition-colors hover:text-white">
            <ArrowLeft size={16} />
            Back to courses
          </Link>

          <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-end">
            <div className="relative mx-auto h-[220px] w-[220px] overflow-hidden rounded-[36px] border border-white/12 bg-white/8 shadow-[0_28px_80px_rgba(0,0,0,0.28)] md:h-[260px] md:w-[260px] xl:mx-0">
              <Image
                src={studentImage}
                alt={displayName}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 220px, 260px"
              />
            </div>

            <div className="flex flex-col gap-6 text-center xl:text-left">
              <div className="space-y-4">
                <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFD2A6]">
                  CSCN Student Profile
                </span>
                <div className="space-y-3">
                  <h1 className="text-[clamp(2.4rem,5vw,4.4rem)] font-bold leading-[0.98] tracking-[-0.05em]">
                    {displayName}
                  </h1>
                  {student.headline && (
                    <p className="text-lg font-semibold text-white/86 md:text-2xl">{student.headline}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/68 xl:justify-start">
                    {student.location && (
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={15} />
                        {student.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <Sparkles size={15} />
                      Learning publicly on CSCN
                    </span>
                  </div>
                  <p className="mx-auto max-w-3xl text-sm leading-7 text-white/68 md:text-base xl:mx-0">
                    {student.bio ??
                      'A committed learner steadily building practical skills, course completions, and a credible learning track record.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className={statCardClass}>
                  <div className="flex items-center gap-2 text-white/62">
                    <Flame size={16} />
                    <span className="text-xs uppercase tracking-[0.16em]">Current streak</span>
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{student.currentStreak}d</p>
                </div>
                <div className={statCardClass}>
                  <div className="flex items-center gap-2 text-white/62">
                    <BookCheck size={16} />
                    <span className="text-xs uppercase tracking-[0.16em]">Completed</span>
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{student.enrollments.length}</p>
                </div>
                <div className={statCardClass}>
                  <div className="flex items-center gap-2 text-white/62">
                    <TrendingUp size={16} />
                    <span className="text-xs uppercase tracking-[0.16em]">In progress</span>
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{activeCount}</p>
                </div>
                <div className={statCardClass}>
                  <div className="flex items-center gap-2 text-white/62">
                    <Trophy size={16} />
                    <span className="text-xs uppercase tracking-[0.16em]">Achievements</span>
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{student.achievements.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-6 flex w-full max-w-[1440px] flex-col gap-8 px-4 md:px-8 lg:-mt-8 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <aside className="flex flex-col gap-6">
          <section className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-[#040B37]">Learning Snapshot</h2>
              <span className="rounded-full bg-[#FFF1E4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D97706]">
                Active learner
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] bg-[#F4F7FC] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#6B7280]">Time invested</p>
                <p className="mt-2 text-lg font-semibold text-[#040B37]">
                  {Math.floor(totalLearningMinutes / 60)}h {totalLearningMinutes % 60}m across completed courses.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] bg-[#F4F7FC] p-4 text-center">
                  <p className="text-2xl font-bold tracking-[-0.04em] text-[#040B37]">{student.longestStreak}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#6B7280]">Longest streak</p>
                </div>
                <div className="rounded-[22px] bg-[#F4F7FC] p-4 text-center">
                  <p className="text-2xl font-bold tracking-[-0.04em] text-[#040B37]">{totalCompletedLessons}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#6B7280]">Lessons finished</p>
                </div>
              </div>
              <div className="rounded-[22px] bg-[#F4F7FC] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#6B7280]">Journey depth</p>
                <p className="mt-2 text-lg font-semibold text-[#040B37]">
                  {totalEnrollments} total enrollments with {certificateEnrollments.length} certificate-ready completions.
                </p>
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#040B37]">Achievements</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Milestones unlocked through consistency, completions, and platform activity.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {featuredAchievements.length > 0 ? featuredAchievements.map((userAchievement) => {
                const iconName = userAchievement.achievement.icon as keyof typeof LucideIcons;
                const IconComponent =
                  (LucideIcons[iconName] as React.ComponentType<{ size?: number; className?: string }>) ??
                  Award;

                return (
                  <div
                    key={userAchievement.id}
                    className="flex items-start gap-4 rounded-[22px] border border-[#DCE5F5] bg-[#F8FBFF] p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1C4ED1] shadow-sm">
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#040B37]">{userAchievement.achievement.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">
                        {userAchievement.achievement.description}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-[22px] bg-[#F4F7FC] px-4 py-5 text-sm text-[#667085]">
                  New achievements will appear here as the learner completes lessons and keeps their streak alive.
                </div>
              )}
            </div>
          </section>
        </aside>

        <main className="flex flex-col gap-6">
          <section className={panelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1C4ED1]">Completed learning</p>
                <h2 className="mt-2 text-[clamp(1.8rem,3vw,2.6rem)] font-bold tracking-[-0.05em] text-[#040B37]">
                  Courses completed by {displayName}
                </h2>
              </div>
              <div className="rounded-full bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#1C4ED1]">
                {completedCourseCards.length} completed {completedCourseCards.length === 1 ? 'course' : 'courses'}
              </div>
            </div>

            {completedCourseCards.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {completedCourseCards.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[28px] border border-dashed border-[#C9D8F7] bg-[#F8FBFF] px-6 py-12 text-center">
                <h3 className="text-xl font-bold text-[#040B37]">No completed courses yet</h3>
                <p className="mt-3 text-sm leading-6 text-[#667085]">
                  This learner is still in progress. Their completed courses will appear here over time.
                </p>
              </div>
            )}
          </section>

          {certificateEnrollments.length > 0 && (
            <section className={panelClass}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1C4ED1]">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1C4ED1]">Verified certificates</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#040B37]">
                    Certificate-ready achievements
                  </h2>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {certificateEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex flex-col gap-4 rounded-[24px] border border-[#DCE5F5] bg-[#F8FBFF] p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1C4ED1] shadow-sm">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#040B37]">{enrollment.course.title}</p>
                        <p className="mt-1 text-sm text-[#667085]">
                          Completed on{' '}
                          {enrollment.completedAt
                            ? new Date(enrollment.completedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'Verified'}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/certificate/verify?enrollmentId=${enrollment.id}`}
                      className="inline-flex w-full items-center justify-center rounded-full border border-[#1C4ED1] px-5 py-3 text-sm font-semibold text-[#1C4ED1] transition-colors hover:bg-[#1C4ED1] hover:text-white md:w-auto"
                    >
                      View Certificate
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
