import type { Metadata } from 'next';

import { db } from '@/lib/db';
import { generateTapbackAvatar } from '@/lib/avatar';
import { currentUser } from '@/lib/auth';
import InstructorExplorer, { type PublicInstructorCard } from '@/components/marketing/InstructorExplorer';
import InstructorApplicationCTA from '@/components/marketing/InstructorApplicationCTA';

export const metadata: Metadata = {
  title: 'For Instructors | CSCN',
  description: 'Meet verified CSCN instructors or apply to teach practical, career-building skills to a global creative community.',
};

function stringsFromJson(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function publicSlug(user: { id: string; name: string | null; profile?: { publicProfileSlug?: string | null } | null }) {
  return (
    user.profile?.publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
    user.id
  );
}

async function getPublicInstructors(): Promise<PublicInstructorCard[]> {
  const instructors = await db.user.findMany({
    where: {
      instructorProfile: {
        isEnabled: true,
        verificationStatus: 'VERIFIED',
      },
      profile: {
        publicProfileStatus: 'PUBLIC',
      },
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
      profile: {
        select: {
          headline: true,
          publicProfileSlug: true,
        },
      },
      instructorProfile: {
        select: {
          expertise: true,
        },
      },
      taughtCourses: {
        where: { status: 'PUBLISHED' },
        select: {
          category: { select: { name: true } },
          enrollments: { select: { id: true } },
          ratings: { select: { rating: true } },
        },
      },
    },
    orderBy: [{ instructorProfile: { featuredOrder: 'asc' } }, { updatedAt: 'desc' }],
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
      headline: instructor.profile?.headline || 'CSCN Instructor',
      image: instructor.image || generateTapbackAvatar(name),
      slug: publicSlug(instructor),
      expertise: Array.from(new Set([...stringsFromJson(instructor.instructorProfile?.expertise), ...courseCategories])).slice(0, 5),
      courses: instructor.taughtCourses.length,
      students: instructor.taughtCourses.reduce((sum, course) => sum + course.enrollments.length, 0),
      rating: ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0,
      ratingCount: ratings.length,
    };
  });
}

export default async function InstructorsPage() {
  const [instructors, viewer] = await Promise.all([getPublicInstructors(), currentUser()]);
  const existingApplication = viewer?.id
    ? await db.instructorApplication.findUnique({
        where: { userId: viewer.id },
        select: {
          fullName: true,
          email: true,
          industry: true,
          portfolioUrl: true,
          experienceLevel: true,
          status: true,
          submittedAt: true,
          reviewDueAt: true,
        },
      })
    : null;

  return (
    <main className="min-h-screen overflow-hidden bg-background pt-[70px] lg:pt-[76px]">
      <InstructorExplorer instructors={instructors} />

      <section className="bg-white px-4 py-24">
        <div className="container relative overflow-hidden rounded-[32px] bg-navy p-10 text-center md:p-20">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="relative mx-auto max-w-[720px]">
            <h2 className="font-inter text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-[3.5rem]">
              Ready to teach on CSCN?
            </h2>
            <p className="mx-auto mt-4 max-w-[590px] font-inter text-lg font-medium leading-relaxed text-[#E3E8F4] opacity-80">
              Share your experience, teach practical skills, and help the next generation of creators move forward.
            </p>
            <div className="mt-8 flex justify-center">
              <InstructorApplicationCTA
                viewer={viewer?.id && viewer.email ? { id: viewer.id, name: viewer.name ?? null, email: viewer.email, role: viewer.role ?? 'USER' } : null}
                existingApplication={existingApplication ? {
                  ...existingApplication,
                  submittedAt: existingApplication.submittedAt.toISOString(),
                  reviewDueAt: existingApplication.reviewDueAt.toISOString(),
                } : null}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
