'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { JOB_BOARDS, type JobBoard } from '@/lib/job-boards';

export type CommunityCourse = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  author: string;
  authorAvatar: string;
  image: string;
};

const JobCard = ({ name, logoUrl, logoBg, url, isDesignFrame }: Pick<JobBoard, 'name' | 'logoUrl' | 'logoBg' | 'url' | 'isDesignFrame'>) => (
  <motion.a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(4,11,55,0.08)' }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    className="group grid min-h-[104px] w-full cursor-pointer grid-cols-[88px_1fr_auto] items-center gap-3 overflow-hidden rounded-2xl border border-[#C8D1E0] bg-white p-2 pr-3 outline-none transition-all hover:border-indigo-200 sm:min-h-[120px] sm:grid-cols-[104px_1fr_auto] sm:gap-4 sm:pr-4"
  >
    <div
      className="relative flex h-[88px] w-[88px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] sm:h-[104px] sm:w-[104px]"
      style={{ backgroundColor: isDesignFrame ? 'transparent' : logoBg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={isDesignFrame ? 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-110' : 'h-11 w-11 object-contain transition-transform duration-500 group-hover:scale-110 sm:h-12 sm:w-12'}
        loading="lazy"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    </div>

    <div className="flex min-w-0 flex-col gap-2 space-y-8 justify-between">
      <h3 className="line-clamp-2 font-inter text-[17px] font-semibold leading-[1.24] tracking-[-0.02em] text-[#040B37] sm:text-[18px]">
        {name}
      </h3>
      <span className="font-inter text-[13px] font-medium leading-tight tracking-[-0.01em] text-[#9CA3AF] sm:text-[14px]">
        Apply now
      </span>
    </div>

    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E3E8F4] text-[#4B5563] transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600">
      <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </span>
  </motion.a>
);

const MiniCourseCard = ({
  slug, title, meta, author, authorAvatar, image,
}: CommunityCourse) => (
  <Link href={`/courses/${slug}`} className="block">
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(4,11,55,0.12)' }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#C8D1E0] bg-white p-2 pb-4"
    >
      <div className="relative aspect-[314/216] w-full flex-shrink-0 overflow-hidden rounded-[10px]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 314px"
          unoptimized={image.endsWith('.svg')}
        />
      </div>
      <div className="flex min-h-[121px] flex-col justify-between px-2 pt-4">
        <div className="flex flex-col gap-3">
          <span className="font-inter text-[13px] font-medium tracking-[-0.01em] text-[#4B5563] sm:text-[14px]">
            {meta}
          </span>
          <h3 className="line-clamp-2 font-inter text-[17px] font-semibold leading-[1.24] tracking-[-0.02em] text-[#040B37] transition-colors group-hover:text-primary sm:text-[18px]">
            {title}
          </h3>
        </div>
        <div className="flex min-w-0 items-center gap-2 pt-3">
          <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border border-[#E3E8F4] bg-[#F4F6FB]">
            <Image src={authorAvatar} alt={author} fill className="object-cover" sizes="24px" unoptimized />
          </div>
          <span className="truncate font-inter text-[13px] font-medium tracking-[-0.01em] text-[#4B5563] sm:text-[14px]">
            {author}
          </span>
        </div>
      </div>
    </motion.div>
  </Link>
);

export default function CommunityClient({ courses }: { courses: CommunityCourse[] }) {
  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <div className="mx-auto max-w-[83rem] px-4">
        <div className="flex flex-col gap-[8.25rem]">
          <section className="flex flex-col gap-10">
            <div className="flex items-center justify-between">
              <h1 className="font-inter text-[32px] font-semibold leading-[1.24] tracking-[-0.02em] text-[#040B37]">
                Careers
              </h1>
              <div className="h-8 w-[77px] rounded-sm bg-[#F4F6FB]" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {JOB_BOARDS.map((board, i) => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full"
                >
                  <JobCard {...board} />
                </motion.div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Link
                  href="/courses"
                  className="inline-flex h-18 items-center gap-2 rounded-full border border-[#E3E8F4] px-6 py-4 font-inter text-[16px] font-medium tracking-[-0.01em] text-[#4B5563] transition-colors hover:bg-gray-50"
                >
                  Explore all courses
                  <ArrowRight size={20} />
                </Link>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
                className="font-inter text-[40px] font-semibold leading-[1.24] tracking-[-0.02em] text-[#040B37]"
              >
                Your Creative Community<br className="hidden xl:block" /> Starts Here
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.16 }}
                className="max-w-[527px] font-inter text-[16px] font-medium tracking-[-0.01em] text-[#4B5563]"
              >
                Join a global community where creatives learn together, share ideas, and grow through
                collaboration and mentorship.
              </motion.p>
            </div>

            {courses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <MiniCourseCard {...course} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#C8D1E0] bg-white p-8 text-center">
                <p className="font-inter text-[16px] font-semibold text-[#040B37]">Featured courses will appear here soon.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
