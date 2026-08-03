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
import { getHomepageFeaturedInstructors } from '@/data/featured-instructors';
import { getMarketingSettings, listPublishedHomepageReviews } from '@/data/marketing';

export default async function LandingPage() {
  // Fetch data on the server for instant page load (No Flicker)
  const requestCountry = getRequestCountry(await headers());
  const marketingSettings = await getMarketingSettings();
  const statsData = await getStats();
  const dbCourses = marketingSettings.launchMode ? [] : await listFeaturedCourses(8);
  const featuredInstructors = await getHomepageFeaturedInstructors();
  const homepageReviews = marketingSettings.homepageReviewsEnabled
    ? await listPublishedHomepageReviews(9)
    : [];
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
      <Hero marketingSettings={marketingSettings} />

      {/* Stats Section - Fast reveal */}
      <Reveal delay={0.2}>
        <StatsSection initialData={statsData} />
      </Reveal>

      {/* Interactive Courses Section */}
      <Reveal delay={0.3}>
        <CoursesSection initialCourses={dbCards} marketingSettings={marketingSettings} />
      </Reveal>

      {/* High-Fidelity Features Section */}
      <Reveal delay={0.3}>
        <BenefitSection />
      </Reveal>

      {/* High-Fidelity Instructors Section */}
      <Reveal delay={0.4}>
        <InstructorSection instructors={featuredInstructors} />
      </Reveal>

      {/* High-Fidelity Reviews Section */}
      {homepageReviews.length > 0 && (
        <Reveal delay={0.4}>
          <ReviewsSection reviews={homepageReviews.map((review) => ({
            id: review.id,
            name: review.name,
            role: review.role,
            avatarUrl: review.avatarUrl,
            content: review.content,
            rating: review.rating,
          }))} />
        </Reveal>
      )}

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
