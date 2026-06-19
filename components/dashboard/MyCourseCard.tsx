'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export type CourseStatus = 'In Progress' | 'Completed';

export interface MyCourseCardProps {
  id: string;
  slug: string;
  title: string;
  category: string;
  lessons: string;
  duration: string;
  author: string;
  authorAvatar: string;
  image: string;
  progress: number;
  status: CourseStatus;
  firstLessonId: string | null;
  rating?: number;
  reviews?: number;
}

export default function MyCourseCard({
  slug,
  title,
  category,
  lessons,
  duration,
  author,
  authorAvatar,
  image,
  progress,
  status,
  firstLessonId,
  rating = 0,
  reviews = 0,
}: MyCourseCardProps) {
  const statusConfig: Record<CourseStatus, { bg: string; label: string }> = {
    'In Progress': { bg: 'bg-[#1C4ED1]', label: 'In Progress' },
    'Completed': { bg: 'bg-[#16A34A]', label: 'Completed' },
  };

  const href = firstLessonId
    ? `/courses/${slug}/watch/${firstLessonId}`
    : `/courses/${slug}`;

  return (
    <Link href={href} className="block h-full group">
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-[12px] border border-stroke overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300 px-[8px] pt-[8px] pb-[16px] gap-[16px]"
      >
        <div className="relative h-[216px] w-full overflow-hidden rounded-[4px] shrink-0">
          <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className={`absolute top-2 right-2 px-[8px] py-[6px] rounded-[10px] text-[12px] font-semibold text-white capitalize tracking-[-0.24px] ${statusConfig[status].bg}`}>
            {statusConfig[status].label}
          </div>
        </div>

        <div className="px-[8px] flex flex-col flex-grow gap-[20px]">
          <div className="flex flex-col gap-[16px]">
            <span className="text-[14px] font-medium text-text-body font-jakarta tracking-[-0.14px]">
              {category}
            </span>
            <h3 className="text-[18px] font-semibold text-navy leading-[1.24] tracking-[-0.36px] line-clamp-2 min-h-[44px] group-hover:text-primary transition-colors font-jakarta">
              {title}
            </h3>
            <span className="text-[14px] font-medium text-text-mute font-jakarta tracking-[-0.14px]">
              {lessons} lessons / {duration}
            </span>
            <span className="text-[13px] font-semibold text-navy font-jakarta">
              {rating > 0 ? `★ ${rating.toFixed(1)}` : '★ New'} <span className="text-text-mute font-medium">({reviews})</span>
            </span>

            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center justify-between text-[10px] font-medium tracking-[-0.1px] font-jakarta">
                <span className="text-text-mute">Progress</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="w-full h-[6px] bg-primary/[0.12] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${status === 'Completed' ? 'bg-[#16A34A]' : 'bg-primary'}`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[8px]">
            <div className="w-[24px] h-[24px] rounded-full overflow-hidden relative bg-gray-100 shrink-0">
              <Image src={authorAvatar} alt={author} fill className="object-cover" />
            </div>
            <span className="text-[14px] font-medium text-text-body font-jakarta tracking-[-0.14px]">
              {author}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
