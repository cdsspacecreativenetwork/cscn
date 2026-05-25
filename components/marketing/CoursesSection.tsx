'use client';

import CourseCard, { type CourseCardProps } from '@/components/ui/CourseCard';
import { motion } from 'framer-motion';

interface CoursesSectionProps {
  initialCourses: CourseCardProps[];
}

export default function CoursesSection({ initialCourses }: CoursesSectionProps) {
  const count = initialCourses.length;
  const gridCols =
    count === 1 ? 'grid-cols-1 max-w-[300px] mx-auto' :
    count === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-[640px] mx-auto' :
    count === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[960px] mx-auto' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-25 bg-white overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[83rem] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <h2 className="text-[2.5rem] md:text-[3rem] font-semibold mb-6 leading-[1.2] tracking-tight text-navy font-inter">
            Learn. Build. Level Up.
          </h2>
        </motion.div>

        <div className={`homepage-course-grid grid gap-6 ${gridCols}`}>
          {initialCourses.map((course, i) => (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <CourseCard
                {...course}
                showMeta={false}
                showRating={false}
                showPrice={false}
                thumbnailHover="out"
                showLevel={false}
              />
            </motion.div>
          ))}
        </div>

        {initialCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-navy mb-2">More courses coming soon!</h3>
            <p className="text-text-mute">We&apos;re currently preparing new content.</p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
