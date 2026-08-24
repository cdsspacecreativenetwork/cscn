import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowRight, BookOpenCheck, BriefcaseBusiness, Sparkles, Users } from 'lucide-react';

import { db } from '@/lib/db';
import { generateTapbackAvatar } from '@/lib/avatar';
import InstructorExplorer, { type PublicInstructorCard } from '@/components/marketing/InstructorExplorer';

export const metadata: Metadata = {
  title: 'For Instructors | CSCN',
  description: 'Meet verified CSCN instructors or apply to teach practical, career-building skills to a global creative community.',
};

function stringsFromJson(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function publicSlug(user: { id: string; name: string | null; publicProfileSlug: string | null }) {
  return (
    user.publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
    user.id
  );
}

async function getPublicInstructors(): Promise<PublicInstructorCard[]> {
  const instructors = await db.user.findMany({
    where: {
      instructorProfileEnabled: true,
      instructorVerificationStatus: 'VERIFIED',
      publicProfileStatus: 'PUBLIC',
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
      headline: true,
      expertise: true,
      publicProfileSlug: true,
      taughtCourses: {
        where: { status: 'PUBLISHED' },
        select: {
          category: { select: { name: true } },
          enrollments: { select: { id: true } },
          ratings: { select: { rating: true } },
        },
      },
    },
    orderBy: [{ instructorFeaturedOrder: 'asc' }, { updatedAt: 'desc' }],
  });

  return instructors.map((instructor) => {
    const name =
      instructor.name ||
      [instructor.firstName, instructor.lastName].filter(Boolean).join(' ').trim() ||
      'CSCN Instructor';
    const courseCategories = instructor.taughtCourses
      .map((course) => course.category?.name)
      .filter((category): category is string => Boolean(category));
    const ratings = instructor.taughtCourses.flatMap((course) => course.ratings.map((rating) => rating.rating));

    return {
      id: instructor.id,
      name,
      headline: instructor.headline || 'CSCN Instructor',
      image: instructor.image || generateTapbackAvatar(name),
      slug: publicSlug(instructor),
      expertise: Array.from(new Set([...stringsFromJson(instructor.expertise), ...courseCategories])).slice(0, 5),
      courses: instructor.taughtCourses.length,
      students: instructor.taughtCourses.reduce((sum, course) => sum + course.enrollments.length, 0),
      rating: ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0,
      ratingCount: ratings.length,
    };
  });
}

const benefits = [
  {
    icon: BookOpenCheck,
    title: 'Teach what you know',
    description: 'Turn real-world expertise into structured courses, live sessions, and practical feedback.',
  },
  {
    icon: Users,
    title: 'Grow your reach',
    description: 'Connect with ambitious creatives and professionals learning from across the world.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Build your practice',
    description: 'Strengthen your reputation, mentor emerging talent, and earn from high-value learning experiences.',
  },
];

export default async function InstructorsPage() {
  const instructors = await getPublicInstructors();
  const totalCourses = instructors.reduce((sum, instructor) => sum + instructor.courses, 0);
  const totalStudents = instructors.reduce((sum, instructor) => sum + instructor.students, 0);

  return (
    <main className="min-h-screen overflow-hidden bg-background pt-[70px] lg:pt-[76px]">
      <section className="relative border-b border-stroke">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(28,78,209,0.13),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(100,142,252,0.10),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(#C8D1E0_1px,transparent_1px),linear-gradient(90deg,#C8D1E0_1px,transparent_1px)] [background-size:46px_46px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <div className="relative mx-auto grid min-h-[650px] w-full max-w-[83rem] items-center gap-12 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="max-w-[720px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Learn from people doing the work
            </div>
            <h1 className="mt-7 font-inter text-[42px] font-semibold leading-[1.04] tracking-[-0.045em] text-navy sm:text-[56px] lg:text-[68px]">
              Meet the people shaping the next generation of creators.
            </h1>
            <p className="mt-6 max-w-[625px] text-[16px] font-medium leading-7 text-text-body md:text-[18px] md:leading-8">
              Discover verified CSCN instructors bringing industry experience, useful feedback, and practical teaching into every learning journey.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#meet-instructors"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-[#648EFC] bg-primary px-6 text-[15px] font-semibold text-white shadow-[0_10px_26px_rgba(28,78,209,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#163fa3]"
              >
                Explore instructors
                <ArrowDown className="h-4 w-4" />
              </Link>
              <a
                href="mailto:support@cscn.com?subject=CSCN%20Instructor%20Application"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-stroke-ii bg-white/80 px-6 text-[15px] font-semibold text-navy backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                Apply to become an instructor
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[480px] lg:ml-auto">
            <div className="absolute -inset-5 rotate-3 rounded-[40px] border border-primary/10 bg-primary/5" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_rgba(4,11,55,0.14)] backdrop-blur-xl md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-primary">CSCN faculty</p>
                  <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-navy">Real experience, shared.</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-primary text-white shadow-[0_10px_25px_rgba(28,78,209,0.25)]">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { value: instructors.length, label: 'Instructors' },
                  { value: totalCourses, label: 'Courses' },
                  { value: totalStudents, label: 'Learners' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[18px] border border-stroke bg-background px-3 py-5 text-center">
                    <p className="text-[22px] font-semibold tracking-[-0.03em] text-navy">{stat.value.toLocaleString()}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-text-mute">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {['Hands-on, practical learning', 'Verified industry professionals', 'Global creative community'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-[14px] border border-stroke px-4 py-3.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">0{index + 1}</span>
                    <span className="text-[13px] font-semibold text-navy">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <InstructorExplorer instructors={instructors} />

      <section className="border-y border-stroke bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-[83rem] px-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-primary">Why teach with CSCN</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.035em] text-navy md:text-[44px]">
              Your experience can change someone&apos;s direction.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <article key={benefit.title} className="group rounded-[24px] border border-stroke bg-background p-7 transition-all hover:border-primary/25 hover:bg-white hover:shadow-[0_18px_48px_rgba(4,11,55,0.07)] md:p-8">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <benefit.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[12px] font-bold text-text-mute">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-[20px] font-semibold tracking-[-0.02em] text-navy">{benefit.title}</h3>
                <p className="mt-3 text-[14px] font-medium leading-6 text-text-body">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[83rem] px-4 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-[30px] bg-navy px-6 py-14 text-center shadow-[0_28px_80px_rgba(4,11,55,0.18)] md:px-12 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(5,117,255,0.34),transparent_52%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="relative mx-auto max-w-[720px]">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#8FB3FF]">Share what only experience can teach</p>
            <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[48px]">
              Ready to teach on CSCN?
            </h2>
            <p className="mx-auto mt-5 max-w-[590px] text-[15px] font-medium leading-7 text-[#B9C2D8] md:text-[17px]">
              Tell us about your expertise, professional experience, and the practical outcomes you want to help learners achieve.
            </p>
            <a
              href="mailto:support@cscn.com?subject=CSCN%20Instructor%20Application"
              className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-[#648EFC] bg-white px-7 text-[15px] font-semibold text-navy transition-all hover:-translate-y-0.5 hover:bg-[#EEF3FF]"
            >
              Apply to become an instructor
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
