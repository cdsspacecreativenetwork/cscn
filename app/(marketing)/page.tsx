export const dynamic = 'force-dynamic';

import Hero from '@/components/marketing/Hero';
import StatsSection from '@/components/marketing/StatsSection';
import CoursesSection from '@/components/marketing/CoursesSection';
import BenefitSection from '@/components/marketing/BenefitSection';
import InstructorSection from '@/components/marketing/InstructorSection';
import ReviewsSection from '@/components/marketing/ReviewsSection';
import CommunitySection from '@/components/marketing/CommunitySection';
import FAQSection from '@/components/marketing/FAQSection';
import { getStats, getMockCourseCards } from '@/lib/api';
import { listCourses } from '@/lib/services/courses.service';
import { toCardProps } from '@/lib/course-adapter';
import { Reveal } from '@/components/ui/Reveal';

export default async function LandingPage() {
  // Fetch data on the server for instant page load (No Flicker)
  const statsData = await getStats();
  const { courses: dbCourses } = await listCourses(1);
  const dbCards = dbCourses.map(toCardProps);
  const HOMEPAGE_LIMIT = 12;
  const remaining = Math.max(0, HOMEPAGE_LIMIT - dbCards.length);
  const courses = [...dbCards, ...getMockCourseCards().slice(0, remaining)];

  return (
    <div className="landing-page overflow-hidden">
      <Hero />

      {/* Stats Section - Fast reveal */}
      <Reveal delay={0.2}>
        <StatsSection initialData={statsData} />
      </Reveal>

      {/* Interactive Courses Section */}
      <Reveal delay={0.3}>
        <CoursesSection initialCourses={courses} />
      </Reveal>

      {/* High-Fidelity Features Section */}
      <Reveal delay={0.3}>
        <BenefitSection />
      </Reveal>

      {/* High-Fidelity Instructors Section */}
      <Reveal delay={0.4}>
        <InstructorSection />
      </Reveal>

      {/* High-Fidelity Reviews Section */}
      <Reveal delay={0.4}>
        <ReviewsSection />
      </Reveal>

      {/* Community & Student Projects Section */}
      <Reveal delay={0.5}>
        <CommunitySection />
      </Reveal>

      {/* FAQ Section */}
      <Reveal delay={0.5}>
        <FAQSection />
      </Reveal>
    </div>
  );
}
