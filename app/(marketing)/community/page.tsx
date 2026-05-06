'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { JOB_BOARDS, type JobBoard } from '@/lib/job-boards';

// ─────────────────────────────────────────────────────────────
// Course data (replace with API call when ready)
// ─────────────────────────────────────────────────────────────
const COURSES = [
  {
    id: 'brand-positioning',
    title: 'How to position your brand to attract global audience.',
    meta: '5 lessons / 2 hours',
    author: 'Chris John',
    authorAvatar: '/assets/community/avatar-chris.png',
    image: '/assets/community/course-brand.png',
  },
  {
    id: 'figma-uiux',
    title: 'Figma UIUX Design for beginners',
    meta: '55 lessons / 12 hours',
    author: 'Honest Ernest',
    authorAvatar: '/assets/community/avatar-honest.png',
    image: '/assets/community/course-figma.png',
  },
];

// ─────────────────────────────────────────────────────────────


// Job Card — Figma layout_7STIR6 (node 9183:4701) + live URL
//   outer: row, padding 8 16 8 8, gap 16, white bg, radius 16
//   left: coloured bg (logoBg), logo centred, flex-1, h-[120px], radius 10
//   right: column space-between, hug width, padding-top 8
//     name: 112px fixed, SemiBold 18px, -2% tracking
//     "Apply Now": h-32, gap 4, whitespace-nowrap
// ─────────────────────────────────────────────────────────────
const JobCard = ({ name, logoUrl, logoBg, url, isDesignFrame }: Pick<JobBoard, 'name' | 'logoUrl' | 'logoBg' | 'url' | 'isDesignFrame'>) => (
  <motion.a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(4,11,55,0.08)' }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    className="bg-white border border-[#C8D1E0] rounded-2xl flex flex-col sm:flex-row items-center sm:items-stretch overflow-hidden w-full h-full min-h-[120px] cursor-pointer group p-2 gap-4 outline-none transition-all hover:border-indigo-200"
  >
    {/* Image Container - Fixed square on desktop, full width on mobile */}
    <div
      className="relative rounded-[12px] overflow-hidden flex items-center justify-center w-full sm:w-[104px] sm:h-[104px] aspect-square sm:aspect-auto flex-shrink-0"
      style={{ minWidth: 0, backgroundColor: isDesignFrame ? 'transparent' : logoBg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={isDesignFrame ? "object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" : "object-contain w-12 h-12 group-hover:scale-110 transition-transform duration-500"}
        loading="lazy"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    </div>

    {/* Text Container */}
    <div className="flex flex-col justify-between flex-1 gap-2 py-1 pr-2" style={{ minWidth: 0 }}>
      {/* Name */}
      <h3
        className="font-inter font-semibold text-[#040B37] leading-[1.3] line-clamp-2 mt-1"
        style={{ fontSize: 17, letterSpacing: '-0.02em' }}
      >
        {name}
      </h3>

      {/* Apply Now */}
      <div className="flex items-center justify-end sm:justify-start">
        <span
          className="inline-flex items-center gap-1.5 text-[#4B5563] group-hover:text-indigo-600 transition-colors whitespace-nowrap font-inter font-medium text-[14px]"
          style={{ letterSpacing: '-0.01em' }}
        >
          Apply Now
          <ArrowUpRight
            size={16}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
          />
        </span>
      </div>
    </div>
  </motion.a>
);


// ─────────────────────────────────────────────────────────────
// Mini Course Card — Figma layout_5OTZT5 (node 9157:4227)
// ─────────────────────────────────────────────────────────────
const MiniCourseCard = ({
  id, title, meta, author, authorAvatar, image,
}: (typeof COURSES)[0]) => (
  <Link href={`/courses/${id}`} className="block">
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(4,11,55,0.12)' }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white border border-[#C8D1E0] rounded-2xl flex flex-col overflow-hidden group"
      style={{ padding: '8px 8px 16px', gap: 16 }}
    >
      <div className="relative rounded-[10px] overflow-hidden w-full flex-shrink-0" style={{ height: 216 }}>
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          sizes="(max-width: 1280px) 50vw, 314px"
        />
      </div>
      <div className="flex flex-col justify-between" style={{ height: 121, padding: '0 8px' }}>
        <div className="flex flex-col gap-4">
          <span className="font-inter font-medium text-[#4B5563]" style={{ fontSize: 14, letterSpacing: '-0.01em' }}>
            {meta}
          </span>
          <h3
            className="font-inter font-semibold text-[#040B37] leading-[1.24] line-clamp-2 group-hover:text-primary transition-colors"
            style={{ fontSize: 18, letterSpacing: '-0.02em' }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-[#E3E8F4]">
            <Image src={authorAvatar} alt={author} fill className="object-cover" sizes="24px" />
          </div>
          <span className="font-inter font-medium text-[#4B5563]" style={{ fontSize: 14, letterSpacing: '-0.01em' }}>
            {author}
          </span>
        </div>
      </div>
    </motion.div>
  </Link>
);

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const boards = JOB_BOARDS;

  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <div className="mx-auto max-w-[83rem] px-4">
        {/* Outer: column, gap 132px (Figma layout_M9SRFD) */}
        <div className="flex flex-col gap-[8.25rem]">

          {/* ── Section 1: Careers ─────────────────────────────────── */}
          <section className="flex flex-col" style={{ gap: 40 }}>

            {/* Header — Figma layout_D2GIC1: row space-between center */}
            <div className="flex items-center justify-between">
              <h1
                className="font-inter font-semibold text-[#040B37] leading-[1.24]"
                style={{ fontSize: 32, letterSpacing: '-0.02em' }}
              >
                Careers
              </h1>
              {/* Figma decorative block 77×32 */}
              <div className="rounded-sm bg-[#F4F6FB]" style={{ width: 77, height: 32 }} />
            </div>

            {/*
              Grid:
               - mobile / tablet:  2 columns
               - laptop (≥1024):   3 columns
               - desktop (≥1280):  4 columns
              Gap 24px matches Figma layout_4S69EW / layout_MB40NE
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {boards.map((board, i) => (
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

          {/* ── Section 2: Community / Courses ─────────────────────── */}
          <section className="flex flex-col" style={{ gap: 40 }}>

            {/* Header block — Figma layout_2QVKKE: column, gap 16 */}
            <div className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 border border-[#E3E8F4] rounded-full transition-colors hover:bg-gray-50 font-inter font-medium text-[#4B5563]"
                  style={{ height: 48, padding: '13px 16px', fontSize: 16, letterSpacing: '-0.01em' }}
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
                className="font-inter font-semibold text-[#040B37] leading-[1.24]"
                style={{ fontSize: 40, letterSpacing: '-0.02em' }}
              >
                Your Creative Community<br className="hidden xl:block" /> Starts Here
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.16 }}
                className="font-inter font-medium text-[#4B5563]"
                style={{ fontSize: 16, letterSpacing: '-0.01em', maxWidth: 527 }}
              >
                Join a global community where creatives learn together, share ideas, and grow through
                collaboration and mentorship.
              </motion.p>
            </div>

            {/* Course cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {COURSES.map((course, i) => (
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
          </section>
        </div>
      </div>
    </div>
  );
}
