'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import Button from '@/components/ui/Button';
import CourseCard, { type CourseCardProps } from '@/components/ui/CourseCard';
import type { MarketingSettings } from '@/data/marketing';

interface CoursesSectionProps {
  initialCourses: CourseCardProps[];
  marketingSettings: MarketingSettings;
}

function formatRolloutDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function CoursesSection({
  initialCourses,
  marketingSettings,
}: CoursesSectionProps) {
  const count = initialCourses.length;

  const gridCols =
    count === 1
      ? 'grid-cols-1 max-w-[300px] mx-auto'
      : count === 2
        ? 'grid-cols-1 sm:grid-cols-2 max-w-[640px] mx-auto'
        : count === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[960px] mx-auto'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
      className="py-25 bg-background overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[83rem] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <h2 className="text-[2.5rem] md:text-[3rem] font-semibold mb-6 leading-[1.2] tracking-tight text-navy font-inter">
            {marketingSettings.launchMode
              ? 'First courses begin soon'
              : 'Learn. Build. Level Up.'}
          </h2>

          {marketingSettings.launchMode && (
            <p className="max-w-[620px] text-[16px] font-medium leading-relaxed text-text-body">
              Join the pioneer cohort now. Courses begin rolling out from{' '}
              {formatRolloutDate(marketingSettings.firstCourseRolloutDate)}, and
              early members will help shape the first learning tracks.
            </p>
          )}
        </motion.div>

        {marketingSettings.launchMode ? (
          // <motion.div
          //   initial={{ opacity: 0, y: 20 }}
          //   whileInView={{ opacity: 1, y: 0 }}
          //   viewport={{ once: true }}
          //   className="mx-auto max-w-[860px] rounded-[18px] border border-[#E3E8F4] bg-transparent p-6 text-center shadow-sm sm:p-10"
          // >


          // </motion.div>
          <div className="mt-7 flex justify-center">
            <Link href="/signup">
              <Button variant="gradient" size="lg" rounded="full">
                {marketingSettings.launchCtaLabel}
              </Button>
            </Link>
          </div>
        ) : count > 0 ? (
          <div className={`grid gap-6 ${gridCols}`}>
            {initialCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <CourseCard
                  {...course}
                  showMeta
                  showRating={false}
                  showPrice={false}
                  thumbnailHover="out"
                  showLevel={false}
                  presentation="homepage"
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mx-auto flex max-w-[760px] flex-col items-center justify-center rounded-[18px] border border-[#E3E8F4] bg-white px-6 py-14 text-center shadow-sm"
          >
            <div className="text-4xl mb-4">+</div>

            <h3 className="text-xl font-bold text-navy mb-2">
              Featured courses are being curated.
            </h3>

            <p className="max-w-[520px] text-text-mute">
              Published courses appear here only after the team marks them as
              featured, so the homepage stays intentional and high quality.
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}