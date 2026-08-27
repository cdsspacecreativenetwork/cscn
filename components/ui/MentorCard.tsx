'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Briefcase, MessageSquare, Star } from 'lucide-react';
import { MentorBookingPanel } from '@/components/marketing/MentorBookingPanel';
import type { Mentor } from '@/lib/mentorship';

export default function MentorCard(mentor: Mentor) {
  const {
    id,
    slug,
    name,
    role,
    image,
    priceLabel,
    availability,
    slots,
    countryCode = 'US',
    company,
    sessionsCount = 42,
    reviewsCount = 12,
    experienceYears = 8,
    attendanceRate = '98%',
    isTopRated = false,
    isNewMentor = false,
  } = mentor;

  const [bookingOpen, setBookingOpen] = useState(false);
  const profileUrl = `/instructor/${slug ?? id}`;

  const hasAsap = (availability && availability.length > 0) || (slots && slots.length > 0);

  return (
    <>
      <motion.div
        layout
        onClick={() => setBookingOpen(true)}
        className="flex w-full max-w-[270px] mx-auto sm:mx-0 flex-col overflow-hidden rounded-[20px] border border-[#E3E8F4] bg-white p-3 shadow-xs transition-none cursor-pointer"
      >
        {/* Padded Portrait Image Container with Overlay Badges */}
        <div className="relative w-full h-[245px] sm:h-[260px] rounded-[16px] overflow-hidden bg-slate-100 shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 270px"
          />

          {/* Top Rated Overlay Badge */}
          {isTopRated && (
            <span className="absolute top-2.5 left-2.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[11px] font-bold text-[#040B37] shadow-xs border border-white/50">
              Top rated
            </span>
          )}

          {/* Available ASAP Overlay Glassmorphic Badge with Pulsing Emerald Dot */}
          {hasAsap && (
            <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-[11px] font-semibold text-[#040B37] flex items-center gap-1.5 shadow-xs border border-[#E3E8F4]">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              <span>Available ASAP</span>
            </span>
          )}
        </div>

        {/* Card Body Details with Comfortable Spacing */}
        <div className="flex flex-col gap-3.5 pt-3.5 pb-1 px-1 flex-1">
          {/* Name & Country Code */}
          <div className="flex items-center gap-2">
            <h3 className="font-inter text-[16px] font-semibold text-[#040B37] tracking-[-0.01em] truncate">
              {name}
            </h3>
            <span className="text-[9px] font-bold text-[#9CA3AF] tracking-wider uppercase shrink-0">
              {countryCode}
            </span>
          </div>

          {/* Current Role & Company */}
          <div className="flex items-start gap-2 text-[#4B5563] text-[12px] font-medium leading-snug">
            <Briefcase size={14} className="text-[#4B5563] shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {role}{company ? ` at ${company}` : ''}
            </span>
          </div>

          {/* Sessions & Reviews OR New Mentor Badge */}
          <div>
            {isNewMentor ? (
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#040B37]">
                <Star size={14} className="text-[#F59E0B] fill-[#F59E0B]" />
                <span>New mentor</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#4B5563]">
                <MessageSquare size={14} className="text-[#9CA3AF] shrink-0" />
                <span>
                  <strong className="text-[#040B37] font-semibold">{sessionsCount} sessions</strong> ({reviewsCount} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Base Stats Box (Full Un-abbreviated Labels with Single-Line "Avg. Attendance") */}
          <div className="mt-auto pt-1">
            <div className="bg-[#F8FAFC] border border-[#E3E8F4]/80 rounded-md p-2.5 sm:p-3 grid grid-cols-[40%_60%] gap-1.5 sm:gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-semibold text-[#9CA3AF] capitalize tracking-wider truncate">Experience</span>
                <span className="text-[12px] font-bold text-[#040B37]">{experienceYears} years</span>
              </div>
              <div className="flex flex-col gap-0.5 border-l border-[#E3E8F4] pl-2.5 sm:pl-3 min-w-0">
                <span className="text-[10px] font-semibold text-[#9CA3AF] capitalize tracking-wider whitespace-nowrap truncate">Avg. Attendance</span>
                <span className="text-[12px] font-bold text-[#040B37]">{attendanceRate}</span>
              </div>
            </div>
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
          focusAreas: mentor.focusAreas,
          bookingContext: mentor.bookingContext,
        }}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </>
  );
}
