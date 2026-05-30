import Image from 'next/image';
import { db } from '@/lib/db';
import { MENTORS, MENTORSHIP_BENEFITS } from '@/lib/mentorship';
import MentorCard from '@/components/ui/MentorCard';
import FAQSection, { type FAQEntry } from '@/components/marketing/FAQSection';
import { generateTapbackAvatar } from '@/lib/avatar';

const MENTORSHIP_FAQS: FAQEntry[] = [
  {
    question: 'What is CSCN Mentorship?',
    answer: 'CSCN Mentorship connects you with experienced professionals who provide guidance, feedback, and practical insights to help you grow faster.',
  },
  {
    question: 'How does mentorship work?',
    answer: 'Choose a mentor based on your goals, book a session, and connect for personalized guidance, feedback, or career support.',
  },
  {
    question: 'Who can join mentorship sessions?',
    answer: 'Anyone can join. Beginners, intermediate learners, or professionals looking to improve their skills or career direction.',
  },
  {
    question: 'What happens during a mentorship session?',
    answer: "Sessions may include portfolio reviews, project feedback, career advice, skill coaching, or answering specific challenges you're facing.",
  },
  {
    question: 'Are mentorship sessions free or paid?',
    answer: 'Some mentors offer free sessions, while others may charge a booking fee depending on the mentor and session type.',
  },
];

function publicSlug(user: { id: string; name: string | null; publicProfileSlug: string | null }) {
  return (
    user.publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    user.id
  );
}

export default async function MentorshipPage() {
  const mentors = await db.user.findMany({
    where: {
      instructorProfileEnabled: true,
      instructorVerificationStatus: 'VERIFIED',
      publicProfileStatus: 'PUBLIC',
      mentorshipEnabled: true,
    },
    select: {
      id: true,
      name: true,
      image: true,
      headline: true,
      publicProfileSlug: true,
      taughtCourses: {
        where: { status: 'PUBLISHED' },
        select: { _count: { select: { enrollments: true } } },
      },
    },
    orderBy: [{ instructorFeaturedOrder: 'asc' }, { updatedAt: 'desc' }],
  });

  const mentorCards = mentors.map((mentor) => {
    const name = mentor.name ?? 'CSCN Mentor';
    const students = mentor.taughtCourses.reduce((sum, course) => sum + course._count.enrollments, 0);
    return {
      id: mentor.id,
      slug: publicSlug(mentor),
      name,
      role: mentor.headline ?? 'CSCN Instructor',
      image: mentor.image ?? generateTapbackAvatar(name),
      courses: mentor.taughtCourses.length,
      students: students.toLocaleString(),
    };
  });

  const mentorCardIds = new Set(mentorCards.map((mentor) => mentor.id));
  const displayMentors = [
    ...mentorCards,
    ...MENTORS.filter((mentor) => !mentorCardIds.has(mentor.id)),
  ].slice(0, 4);

  const stats = [
    { label: 'Available mentors', value: displayMentors.length.toLocaleString() },
    { label: 'Published courses', value: displayMentors.reduce((sum, mentor) => sum + mentor.courses, 0).toLocaleString() },
    { label: 'Learners reached', value: mentors.reduce((sum, mentor) => sum + mentor.taughtCourses.reduce((courseSum, course) => courseSum + course._count.enrollments, 0), 0).toLocaleString() },
    { label: 'Verified mentors', value: mentorCards.length.toLocaleString(), isRating: true },
  ];

  return (
    <main className="min-h-screen bg-background pt-[6rem] md:pt-[8.25rem] pb-24">
      <div className="max-w-[83rem] mx-auto px-4 md:px-6 lg:px-3 flex flex-col gap-16 md:gap-20">
        <div className="flex flex-col gap-10 md:gap-[48px]">
          <div className="flex flex-col gap-4 md:gap-6 max-w-[527px]">
            <h1 className="text-[32px] md:text-[48px] font-semibold text-[#040B37] tracking-[-0.02em] leading-[1.24] font-inter">
              Mentorship
            </h1>
            <p className="text-[16px] font-medium text-[#4B5563] tracking-[-0.01em] font-inter leading-relaxed">
              Connect with verified instructors who have opened mentorship slots for portfolio reviews, feedback, and practical career guidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 md:gap-[24px]">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6">
                <div className="flex flex-col gap-2.5">
                  <span className="text-[14px] font-medium text-[#4B5563] tracking-[-0.01em]">
                    {stat.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {stat.isRating && (
                      <Image src="/assets/star.svg" alt="" width={22} height={22} />
                    )}
                    <span className="text-[18px] font-semibold text-[#040B37] tracking-[-0.02em] leading-[1.24]">
                      {stat.value}
                    </span>
                  </div>
                </div>
                {i < stats.length - 1 && (
                  <div className="hidden md:block w-[1px] h-[47px] bg-[#C8D1E0]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:gap-[16px]">
          <h2 className="text-[24px] font-semibold text-[#040B37] tracking-[-0.02em] font-inter">
            What You'll Get
          </h2>
          <div className="flex flex-wrap gap-2.5 md:gap-[10px]">
            {MENTORSHIP_BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="px-[12px] h-[40px] flex items-center bg-white border border-[#C8D1E0] rounded-full text-[16px] font-medium text-[#4B5563] tracking-[-0.01em]"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-[24px]">
          <h2 className="text-[24px] font-semibold text-[#040B37] tracking-[-0.02em] font-inter">
            Meet the Mentors
          </h2>

          {displayMentors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayMentors.map((mentor) => (
                <MentorCard key={mentor.id} {...mentor} />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-10 text-center">
              <p className="text-[18px] font-bold text-[#040B37]">No mentors available yet</p>
              <p className="mt-2 text-[14px] font-medium text-[#9CA3AF]">
                Verified instructors who enable mentorship will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 md:mt-20">
        <FAQSection title="Mentorship FAQs" items={MENTORSHIP_FAQS} />
      </div>
    </main>
  );
}
