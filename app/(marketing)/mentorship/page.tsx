'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MENTORS, MENTORSHIP_BENEFITS, MENTORSHIP_STATS } from '@/lib/mentorship';
import MentorCard from '@/components/ui/MentorCard';

import FAQSection from '@/components/marketing/FAQSection';

export default function MentorshipPage() {
  return (
    <main className="min-h-screen bg-background pt-[6rem] md:pt-[8.25rem] pb-24">
      <div className="max-w-[83rem] mx-auto px-4 md:px-6 lg:px-3 flex flex-col gap-16 md:gap-20">
        
        {/* Hero Section */}
        <div className="flex flex-col gap-10 md:gap-[48px]">
          <div className="flex flex-col gap-4 md:gap-6 max-w-[527px]">
            <h1 className="text-[32px] md:text-[48px] font-semibold text-[#040B37] tracking-[-0.02em] leading-[1.24] font-inter">
              Mentorship
            </h1>
            <p className="text-[16px] font-medium text-[#4B5563] tracking-[-0.01em] font-inter leading-relaxed">
              Connect with experienced mentors who guide, support, and help you grow through real industry insights and practical feedback.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-6 md:gap-[24px]">
            {MENTORSHIP_STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <div className="flex flex-col gap-2.5">
                  <span className="text-[14px] font-medium text-[#4B5563] tracking-[-0.01em]">
                    {stat.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {stat.isRating && (
                      <div className="flex items-center justify-center w-[22px] h-[22px]">
                        <Image 
                          src="/assets/star.svg" 
                          alt="star" 
                          width={22} 
                          height={22} 
                        />
                      </div>
                    )}
                    <span className="text-[18px] font-semibold text-[#040B37] tracking-[-0.02em] leading-[1.24]">
                      {stat.value}
                    </span>
                  </div>
                </div>
                {i < MENTORSHIP_STATS.length - 1 && (
                  <div className="hidden md:block w-[1px] h-[47px] bg-[#C8D1E0]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="flex flex-col gap-4 md:gap-[16px]">
          <h2 className="text-[24px] font-semibold text-[#040B37] tracking-[-0.02em] font-inter">
            What You’ll Get
          </h2>
          <div className="flex flex-wrap gap-2.5 md:gap-[10px]">
            {MENTORSHIP_BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="px-[12px] h-[40px] flex items-center bg-white border border-[#C8D1E0] rounded-full text-[16px] font-medium text-[#4B5563] tracking-[-0.01em]"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Mentors Catalog */}
        <div className="flex flex-col gap-6 md:gap-[24px]">
          <h2 className="text-[24px] font-semibold text-[#040B37] tracking-[-0.02em] font-inter">
            Meet the Mentors
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {MENTORS.map((mentor, i) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <MentorCard {...mentor} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section - Handled outside the main gap if needed, but here we just need to ensure it's full width and tight */}
      </div>

      <div className="mt-16 md:mt-20">
        <FAQSection />
      </div>
    </main>
  );
}
