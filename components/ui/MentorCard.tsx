'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Mentor } from '@/lib/mentorship';

export default function MentorCard({ name, role, image, courses, students }: Mentor) {
  return (
    <motion.div
      layout
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(4,11,55,0.08)' }}
      className="bg-white border border-[#C8D1E0] rounded-[16px] overflow-hidden flex flex-row sm:flex-col group transition-all duration-300 w-full"
    >
      {/* Mentor Image Container - Full height on mobile list, Fixed height on desktop */}
      <div className="relative w-[130px] sm:w-full h-auto sm:h-[280px] bg-slate-100 flex-shrink-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 130px, 314px"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 sm:gap-[18px] p-3 sm:p-4 sm:px-2 flex-grow min-w-0">
        <div className="flex flex-col items-start sm:items-center gap-1 sm:gap-2 text-left sm:text-center">
          <h3 className="text-[18px] sm:text-[24px] font-semibold text-[#040B37] tracking-[-0.02em] leading-tight sm:leading-[1.24] font-inter truncate w-full">
            {name}
          </h3>
          <p className="text-[12px] sm:text-[14px] font-medium text-[#4B5563] tracking-[-0.01em] font-inter">
            {role}
          </p>
        </div>

        {/* Stats - ABOVE button on mobile, Below on desktop (desktop keeping original design) */}
        <div className="flex flex-col sm:contents">
          <div className="grid grid-cols-2 w-full gap-2 sm:gap-[18px] self-stretch sm:px-2 order-1 sm:order-3">
            <div className="flex flex-col items-start sm:items-center gap-0.5 sm:gap-2">
              <span className="text-[14px] sm:text-[18px] font-semibold text-[#040B37] leading-none sm:leading-[1.24]">
                {courses}
              </span>
              <span className="text-[10px] sm:text-[14px] font-medium text-[#4B5563] tracking-[-0.01em]">
                Courses
              </span>
            </div>
            <div className="flex flex-col items-start sm:items-center gap-0.5 sm:gap-2">
              <span className="text-[14px] sm:text-[18px] font-semibold text-[#040B37] leading-none sm:leading-[1.24]">
                {students}
              </span>
              <span className="text-[10px] sm:text-[14px] font-medium text-[#4B5563] tracking-[-0.01em]">
                Students
              </span>
            </div>
          </div>

          <div className="w-full border-t border-dashed border-[#E3E8F4] my-2 sm:mt-2 sm:mb-1 order-2" />

          {/* Learn More Button - At bottom on mobile */}
          <button className="flex items-center justify-center gap-2 px-3 sm:px-[16px] h-[32px] sm:h-[40px] border border-[#E3E8F4] rounded-full text-[12px] sm:text-[14px] font-medium text-[#4B5563] font-inter hover:bg-slate-50 transition-all w-fit cursor-pointer group/btn order-3 sm:order-2 self-start sm:self-center">
            Learn more
            <ArrowRight size={16} className="sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
