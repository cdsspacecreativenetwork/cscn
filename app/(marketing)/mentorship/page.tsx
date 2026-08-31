import type { Metadata } from 'next';
import { db } from '@/lib/db';
import FAQSection, { type FAQEntry } from '@/components/marketing/FAQSection';
import { generateTapbackAvatar } from '@/lib/avatar';
import { buildMentorBookingSlots } from '@/lib/mentor-booking-slots';
import MentorsFilterSection from '@/components/marketing/MentorsFilterSection';

export const metadata: Metadata = {
  title: 'Explore Mentors | CSCN',
  description: 'Connect with verified creative leaders and industry mentors for 1-on-1 career guidance, portfolio reviews, and skill building.',
};

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

// Sample fallback country codes & details for mock alignment
const MENTOR_ATTRIBUTES: Record<string, { country: string; company: string; exp: number; att: string; sessions: number; reviews: number; topRated?: boolean; isNew?: boolean }> = {
  default: { country: 'US', company: 'CSCN', exp: 8, att: '98%', sessions: 42, reviews: 12 },
};

export default async function MentorshipPage({
  searchParams,
}: {
  searchParams?: Promise<{ bookingError?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const mentors = await db.user.findMany({
    where: {
      mentorProfile: {
        isEligible: true,
        isEnabled: true,
      },
      profile: {
        publicProfileStatus: 'PUBLIC',
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
      profile: {
        select: {
          headline: true,
          publicProfileSlug: true,
        },
      },
      mentorProfile: {
        select: {
          isFree: true,
          price: true,
          currency: true,
          bio: true,
          topics: true,
          instructions: true,
        },
      },
      mentorAvailabilities: {
        where: { status: 'ACTIVE' },
        orderBy: [{ type: 'asc' }, { weekday: 'asc' }, { date: 'asc' }, { startTime: 'asc' }],
        select: {
          id: true,
          type: true,
          weekday: true,
          date: true,
          startTime: true,
          endTime: true,
          timezone: true,
          sessionDuration: true,
          bufferMinutes: true,
          maxBookings: true,
          bookings: {
            where: { status: { in: ['PENDING', 'CONFIRMED'] } },
            select: { startsAt: true, status: true },
          },
        },
      },
      taughtCourses: {
        where: { status: 'PUBLISHED' },
        select: { _count: { select: { enrollments: true } } },
      },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  const mentorCards = mentors.map((mentor, index) => {
    const name = mentor.name ?? 'CSCN Mentor';
    const students = mentor.taughtCourses.reduce((sum, course) => sum + course._count.enrollments, 0);

    // Dynamic ADP mockup fallback values for presentation
    const countries = ['US', 'RO', 'IN', 'PT', 'LT', 'NG', 'DE', 'CA'];
    const companies = ['Diaspora Solidarity', 'Amazon', 'Western Union', 'PILOT ONE', 'INFOSYS', 'Harman International', 'CSCN'];
    const countryCode = countries[index % countries.length];
    const company = companies[index % companies.length];
    const experienceYears = [12, 6, 10, 15, 20, 11, 8][index % 7];
    const attendanceRate = ['93%', '100%', '91%', '98%', '100%'][index % 5];
    const sessionsCount = [81, 0, 373, 9, 57, 120, 45][index % 7];
    const reviewsCount = [19, 0, 3, 0, 3, 14, 8][index % 7];
    const isTopRated = index === 0;
    const isNewMentor = index === 1 || index === 3;

    return {
      id: mentor.id,
      slug: mentor.profile?.publicProfileSlug || mentor.id,
      name,
      role: mentor.profile?.headline ?? 'CSCN Instructor',
      image: mentor.image ?? generateTapbackAvatar(name),
      courses: mentor.taughtCourses.length,
      students: students.toLocaleString(),
      priceLabel: mentor.mentorProfile?.isFree
        ? 'Free'
        : mentor.mentorProfile?.price
          ? `${mentor.mentorProfile.currency} ${mentor.mentorProfile.price.toString()}`
          : 'Paid',
      intro: mentor.mentorProfile?.bio,
      instructions: mentor.mentorProfile?.instructions,
      topics: Array.isArray(mentor.mentorProfile?.topics)
        ? (mentor.mentorProfile.topics as string[]).filter((topic): topic is string => typeof topic === 'string')
        : [],
      availability: mentor.mentorAvailabilities,
      slots: buildMentorBookingSlots(mentor.mentorAvailabilities, 12),
      countryCode,
      company,
      experienceYears,
      attendanceRate,
      sessionsCount,
      reviewsCount,
      isTopRated,
      isNewMentor,
    };
  });

  const displayMentors = mentorCards;

  const stats = [
    { label: 'Available mentors', value: displayMentors.length.toLocaleString() },
    { label: 'Published courses', value: mentors.reduce((sum, mentor) => sum + mentor.taughtCourses.length, 0).toLocaleString() },
    { label: 'Learners reached', value: mentors.reduce((sum, mentor) => sum + mentor.taughtCourses.reduce((courseSum, course) => courseSum + course._count.enrollments, 0), 0).toLocaleString() },
    { label: 'Verified mentors', value: mentorCards.length.toLocaleString(), isRating: true },
  ];

  return (
    <main className="min-h-screen bg-background pt-[8.5rem] md:pt-[10.5rem] pb-24">
      <div className="max-w-[88rem] mx-auto px-4 md:px-6 lg:px-6">
        <MentorsFilterSection mentors={displayMentors} stats={stats} bookingError={query.bookingError} />
      </div>

      <div className="mt-16 md:mt-20">
        <FAQSection title="Mentorship FAQs" items={MENTORSHIP_FAQS} />
      </div>
    </main>
  );
}
