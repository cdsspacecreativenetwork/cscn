'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { MentorBookingPanel } from '@/components/marketing/MentorBookingPanel';
import type { Mentor } from '@/lib/mentorship';

export default function MentorCard(mentor: Mentor) {
  const { id, slug, name, role, image, courses, students, priceLabel, slots } = mentor;
  const [bookingOpen, setBookingOpen] = useState(false);
  const profileUrl = `/instructor/${slug ?? id}`;

  return (
    <>
      <motion.div
        layout
        whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(4,11,55,0.08)' }}
        className="group flex w-full flex-row overflow-hidden rounded-[16px] border border-[#C8D1E0] bg-white transition-all duration-300 sm:flex-col"
      >
        <div className="relative h-auto w-[130px] flex-shrink-0 bg-slate-100 sm:h-[280px] sm:w-full">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 130px, 314px"
          />
        </div>

        <div className="flex min-w-0 flex-grow flex-col gap-3 p-3 sm:gap-[16px] sm:p-4">
          <div className="flex flex-col items-start gap-1 text-left sm:items-center sm:gap-2 sm:text-center">
            <h3 className="w-full truncate font-inter text-[18px] font-semibold leading-tight tracking-[-0.02em] text-[#040B37] sm:text-[24px] sm:leading-[1.24]">
              {name}
            </h3>
            <p className="font-inter text-[12px] font-medium tracking-[-0.01em] text-[#4B5563] sm:text-[14px]">
              {role}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 self-stretch border-y border-dashed border-[#E3E8F4] py-3 sm:gap-[18px] sm:px-2">
            <div className="flex flex-col items-start gap-0.5 sm:items-center sm:gap-2">
              <span className="text-[14px] font-semibold leading-none text-[#040B37] sm:text-[18px] sm:leading-[1.24]">
                {courses}
              </span>
              <span className="text-[10px] font-medium tracking-[-0.01em] text-[#4B5563] sm:text-[14px]">
                Courses
              </span>
            </div>
            <div className="flex flex-col items-start gap-0.5 border-l border-dashed border-[#E3E8F4] pl-2 sm:items-center sm:gap-2 sm:pl-0">
              <span className="text-[14px] font-semibold leading-none text-[#040B37] sm:text-[18px] sm:leading-[1.24]">
                {students}
              </span>
              <span className="text-[10px] font-medium tracking-[-0.01em] text-[#4B5563] sm:text-[14px]">
                Students
              </span>
            </div>
          </div>

          <div className="flex items-stretch gap-2 sm:flex-row flex-wrap sm:items-center sm:justify-center">
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="inline-flex h-[36px] w-full items-center justify-center rounded-full bg-[#1C4ED1] px-4 font-inter text-[12px] font-semibold text-white transition hover:bg-[#163fa3] active:scale-[0.98] sm:h-[40px] sm:w-auto sm:text-[14px] cursor-pointer"
            >
              Book session
            </button>
            <Link
              href={profileUrl}
              className="group/btn inline-flex h-[36px] w-full items-center justify-center gap-2 rounded-full border border-[#E3E8F4] px-4 font-inter text-[12px] font-medium text-[#4B5563] transition-all hover:bg-slate-50 sm:h-[40px] sm:w-auto sm:text-[14px]"
            >
              View profile
              <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </motion.div>

      <MentorBookingPanel
        mentor={{
          id,
          name,
          role,
          image,
          profileUrl,
          priceLabel,
          intro: mentor.intro,
          instructions: mentor.instructions,
          topics: mentor.topics,
          availability: mentor.availability,
          slots,
        }}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </>
  );
}
