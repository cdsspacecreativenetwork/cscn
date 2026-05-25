export const dynamic = 'force-dynamic';

import Hero from '@/components/marketing/Hero';
import StatsSection from '@/components/marketing/StatsSection';
import CoursesSection from '@/components/marketing/CoursesSection';
import BenefitSection from '@/components/marketing/BenefitSection';
import InstructorSection from '@/components/marketing/InstructorSection';
import ReviewsSection from '@/components/marketing/ReviewsSection';
import CommunitySection from '@/components/marketing/CommunitySection';
import FAQSection from '@/components/marketing/FAQSection';
import { getStats } from '@/lib/api';
import { listFeaturedCourses } from '@/lib/services/courses.service';
import { toCardProps } from '@/lib/course-adapter';
import { Reveal } from '@/components/ui/Reveal';
import { headers } from 'next/headers';
import { getRequestCountry, localizePrice } from '@/lib/localization/pricing';

export default async function LandingPage() {
  // Fetch data on the server for instant page load (No Flicker)
  const requestCountry = getRequestCountry(await headers());
  const statsData = await getStats();
  const dbCourses = await listFeaturedCourses(8);
  const dbCards = await Promise.all(dbCourses.map(async (course) => {
    const price = await localizePrice({
      amount: course.price ? Number(course.price) : null,
      baseCurrency: course.baseCurrency,
      countryCode: requestCountry.countryCode,
      source: requestCountry.source,
    });
    return toCardProps(course, price);
  }));

  return (
    <div className="landing-page overflow-hidden">
      <Hero />

      {/* Stats Section - Fast reveal */}
      <Reveal delay={0.2}>
        <StatsSection initialData={statsData} />
      </Reveal>

      {/* Interactive Courses Section */}
      <Reveal delay={0.3}>
        <CoursesSection initialCourses={dbCards} />
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
