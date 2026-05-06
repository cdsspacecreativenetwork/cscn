import Hero from '@/components/marketing/Hero';
import StatsSection from '@/components/marketing/StatsSection';
import CoursesSection from '@/components/marketing/CoursesSection';
import BenefitSection from '@/components/marketing/BenefitSection';
import InstructorSection from '@/components/marketing/InstructorSection';
import ReviewsSection from '@/components/marketing/ReviewsSection';
import CommunitySection from '@/components/marketing/CommunitySection';
import FAQSection from '@/components/marketing/FAQSection';
import { getStats, getCourses } from '@/lib/api';
import Image from 'next/image';

export default async function LandingPage() {
  // Fetch data on the server for instant page load (No Flicker)
  const statsData = await getStats();
  const courses = await getCourses();

  return (
    <div className="landing-page">
      <Hero />

      {/* Stats Section - Passed pre-fetched data to avoid loading flicker */}
      <StatsSection initialData={statsData} />

      {/* Interactive Courses Section */}
      <CoursesSection initialCourses={courses} />

      {/* High-Fidelity Features Section */}
      <BenefitSection />

      {/* High-Fidelity Instructors Section */}
      <InstructorSection />

      {/* High-Fidelity Reviews Section */}
      <ReviewsSection />

      {/* Community & Student Projects Section */}
      <CommunitySection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
}
