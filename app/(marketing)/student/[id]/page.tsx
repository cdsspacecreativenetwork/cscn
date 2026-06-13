import type { ComponentType, ElementType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Globe,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { FaGithub, FaInstagram, FaLinkedin, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import CourseCard from '@/components/ui/CourseCard';
import { generateTapbackAvatar } from '@/lib/avatar';
import { db } from '@/lib/db';

const socialButtonClass =
  'flex h-10 w-10 items-center justify-center rounded-[10px] border border-stroke-ii bg-white text-text-title transition-all duration-200 hover:border-primary hover:text-primary active:scale-95 hover:shadow-sm';

type SocialLink = {
  label: string;
  href: string;
  icon: ElementType<{ size?: number; className?: string }>;
};

interface Params {
  id: string;
}

type PublicCourse = {
  id: string;
  title: string;
  slug: string;
  shortDesc: string | null;
  thumbnail: string | null;
  difficulty: string;
  price: unknown;
  category: { name: string } | null;
  instructor: { name: string | null; image: string | null };
  _count: { enrollments: number };
  modules: {
    _count: { lessons: number };
    lessons: { duration: number | null }[];
  }[];
};

function formatCourseDuration(minutes: number) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function toCourseCard(course: PublicCourse) {
  const totalLessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
  const totalMinutes = course.modules
    .flatMap((module) => module.lessons)
    .reduce((sum, lesson) => sum + (lesson.duration ?? 0), 0);
  const price = Number(course.price ?? 0);

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    category: course.category?.name ?? 'General',
    description: course.shortDesc ?? '',
    lessons: String(totalLessons),
    duration: formatCourseDuration(totalMinutes),
    author: course.instructor.name ?? 'Instructor',
    authorAvatar: course.instructor.image ?? generateTapbackAvatar(course.instructor.name ?? 'Instructor'),
    image: course.thumbnail ?? '/assets/default-course.jpg',
    rating: 4.8,
    reviews: course._count.enrollments,
    students: course._count.enrollments.toLocaleString(),
    level: course.difficulty,
    priceLabel: price > 0 ? `₦${price.toLocaleString()}` : 'Free',
  };
}

export default async function StudentPortfolioPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const student = await db.user.findUnique({
    where: { id },
    include: {
      enrollments: {
        where: { course: { is: { status: 'PUBLISHED' } } },
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
        orderBy: [{ completedAt: 'desc' }, { enrolledAt: 'desc' }],
      },
      courseInstructors: {
        where: {
          role: 'TEACHING_ASSISTANT',
          course: { is: { status: 'PUBLISHED' } },
        },
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
        orderBy: { createdAt: 'desc' },
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

  const totalEnrollments = await db.enrollment.count({ where: { userId: student.id } });

  const displayName = student.name ?? student.email.split('@')[0];
  const studentImage = student.image ?? generateTapbackAvatar(displayName);
  const learningCourseCards = student.enrollments.map((enrollment) => toCourseCard(enrollment.course));
  const assistedCourseCards = student.courseInstructors.map((courseInstructor) => toCourseCard(courseInstructor.course));
  const featuredAchievements = student.achievements.slice(0, 6);
  const completedEnrollments = student.enrollments.filter((enrollment) => enrollment.status === 'COMPLETED');
  const certificateEnrollments = completedEnrollments.filter((enrollment) => enrollment.course.certificateEnabled);
  const socialLinks: SocialLink[] = [
    { label: 'Website', href: student.websiteUrl, icon: Globe },
    { label: 'Portfolio', href: student.portfolioUrl, icon: BriefcaseBusiness },
    { label: 'LinkedIn', href: student.linkedinUrl, icon: FaLinkedin },
    { label: 'GitHub', href: student.githubUrl, icon: FaGithub },
    { label: 'X', href: student.twitterUrl, icon: FaXTwitter },
    { label: 'Instagram', href: student.instagramUrl, icon: FaInstagram },
    { label: 'YouTube', href: student.youtubeUrl, icon: FaYoutube },
  ].flatMap((link) => (link.href ? [{ ...link, href: link.href }] : []));
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

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-24">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/courses"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-stroke bg-white px-5 text-[15px] font-semibold text-text-body shadow-sm transition hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <section className="mt-8 grid gap-6 lg:grid-cols-[290px_1fr] lg:gap-10">
          <aside className="h-fit overflow-hidden rounded-[16px] border border-stroke bg-white p-2 shadow-[0px_1px_3px_rgba(16,24,40,0.05)]">
            <div className="relative h-[420px] w-full overflow-hidden rounded-[10px] bg-[#EAF2FF] sm:h-[520px] lg:h-[280px]">
              <Image
                src={studentImage}
                alt={displayName}
                fill
                priority
                className="object-cover object-[center_20%]"
                sizes="(max-width: 1024px) 100vw, 280px"
                unoptimized={studentImage.includes('tapback.co') || studentImage.includes('dicebear.com')}
              />
            </div>

            <div className="px-3 pb-[18px] pt-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-text-title">
                  {displayName}
                </h1>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Sparkles size={12} />
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium text-text-body">
                {student.headline ?? student.learningFocus ?? 'CSCN Learner'}
              </p>

              <hr className="mx-2 my-5 border-t border-dashed border-stroke" />

              <div className="grid grid-cols-3 divide-x divide-dashed divide-stroke text-center">
                <div>
                  <p className="text-[22px] font-semibold text-text-title">{completedEnrollments.length}</p>
                  <p className="mt-1 text-[12px] font-medium text-text-body">Completed</p>
                </div>
                <div>
                  <p className="text-[22px] font-semibold text-text-title">{student.currentStreak}d</p>
                  <p className="mt-1 text-[12px] font-medium text-text-body">Streak</p>
                </div>
                <div>
                  <p className="text-[22px] font-semibold text-text-title">{student.achievements.length}</p>
                  <p className="mt-1 text-[12px] font-medium text-text-body">Badges</p>
                </div>
              </div>

              <hr className="mx-2 my-5 border-t border-dashed border-stroke" />

              {socialLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={socialButtonClass}
                      aria-label={label}
                    >
                      <Icon size={18} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="flex flex-col gap-7 pt-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-stroke pb-4">
              <h2 className="text-[20px] font-semibold tracking-tight text-text-title">About Me</h2>
              <span className="text-[16px] font-semibold text-text-title">
                {totalCompletedLessons} Lessons ({Math.floor(totalLearningMinutes / 60)}h)
              </span>
            </div>

            <div className="max-w-[850px] whitespace-pre-line text-[16px] font-medium leading-[1.65] text-text-body">
              {student.bio ||
                `${displayName} is building a visible learning portfolio on CSCN through completed courses, streaks, projects, and course participation.`}
            </div>

            <div className="flex flex-wrap gap-3">
              {student.location && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-text-body shadow-sm ring-1 ring-stroke">
                  <MapPin size={15} />
                  {student.location}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3.5 py-2 text-[13px] font-semibold text-primary">
                <Sparkles size={15} />
                Learning publicly on CSCN
              </span>
            </div>

          </section>
        </section>

        <main className="mt-16 flex flex-col gap-10">
          <section className="p-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Learning portfolio</p>
                <h2 className="mt-2 text-[clamp(1.45rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-text-title">
                  Courses {displayName} is learning
                </h2>
              </div>
              <div className="rounded-full bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                {learningCourseCards.length} {learningCourseCards.length === 1 ? 'course' : 'courses'}
              </div>
            </div>

            {learningCourseCards.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {learningCourseCards.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[18px] border border-dashed border-[#C9D8F7] bg-[#F8FBFF] px-6 py-12 text-center">
                <h3 className="text-xl font-semibold text-text-title">No public learning yet</h3>
                <p className="mt-3 text-sm leading-6 text-text-body">
                  Courses will appear here as this learner joins published learning experiences.
                </p>
              </div>
            )}
          </section>

          {assistedCourseCards.length > 0 && (
            <section className="p-0">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Course collaboration</p>
                <h2 className="text-[clamp(1.45rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-text-title">
                  Courses {displayName} assisted on
                </h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-text-body">
                  Teaching assistant contributions show courses where this learner helped support the learning experience.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {assistedCourseCards.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            </section>
          )}

          {certificateEnrollments.length > 0 && (
            <section className="rounded-[18px] border border-stroke bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Verified certificates</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-text-title">
                    Certificate-ready achievements
                  </h2>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {certificateEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex flex-col gap-4 rounded-[16px] border border-stroke bg-[#F8FBFF] p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-text-title">{enrollment.course.title}</p>
                        <p className="mt-1 text-sm text-text-body">
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
                      className="inline-flex w-full items-center justify-center rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white md:w-auto"
                    >
                      View Certificate
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="p-0">
            <h2 className="text-[clamp(1.45rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-text-title">Achievements</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-body">
              Milestones unlocked through consistency, completions, and platform activity.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredAchievements.length > 0 ? featuredAchievements.map((userAchievement) => {
                const iconName = userAchievement.achievement.icon as keyof typeof LucideIcons;
                const IconComponent =
                  (LucideIcons[iconName] as ComponentType<{ size?: number; className?: string }>) ??
                  Award;

                return (
                  <div
                    key={userAchievement.id}
                    className="flex items-start gap-4 rounded-[16px] bg-[#F4F6FB] p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-text-title">{userAchievement.achievement.name}</p>
                      <p className="mt-1 text-sm leading-6 text-text-body">
                        {userAchievement.achievement.description}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-[16px] bg-[#F4F6FB] px-4 py-5 text-sm text-text-body">
                  New achievements will appear here as the learner completes lessons and keeps their streak alive.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[16px] bg-[#F4F6FB] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-mute">Learning snapshot</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-title">
                {Math.floor(totalLearningMinutes / 60)}h {totalLearningMinutes % 60}m completed,
                {' '}{student.longestStreak}d longest streak, and {totalEnrollments} total enrollments.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
