'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface CourseCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  lessons: string;
  duration: string;
  author: string;
  authorAvatar: string;
  image: string;
  rating?: number;
  students?: string;
  level?: string;
  view?: 'grid' | 'list';
}

export default function CourseCard({ 
  id, 
  title, 
  category,
  description,
  lessons, 
  duration, 
  author, 
  authorAvatar, 
  image,
  rating = 4.8,
  students = "1.2k",
  level = "Beginner",
  view = 'grid'
}: CourseCardProps) {
  const isList = view === 'list';

  return (
    <Link href={`/courses/${id}`} className="block h-full">
      <motion.div 
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
        className={`bg-white rounded-2xl border border-stroke-ii shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group cursor-pointer overflow-hidden ${
          isList ? 'flex flex-row p-3 md:p-4 gap-4 md:gap-6 items-center' : 'flex flex-col p-[8px] pb-[16px] gap-[16px] h-full'
        }`}
      >
        {/* Thumbnail & Instructor Column (List Mobile) */}
        <div className={`flex flex-col gap-3 flex-shrink-0 ${isList ? 'max-w-[120px] md:max-w-none' : 'w-full'}`}>
          <div className={`bg-[#F4F6FB] relative rounded-[10px] overflow-hidden flex-shrink-0 ${
            isList ? 'h-[76px] w-[76px] md:h-[140px] md:w-[240px]' : 'h-[216px] w-full'
          }`}>
            <Image 
              src={image} 
              alt={title} 
              fill 
              className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out" 
            />
          </div>

          {/* Instructor under thumbnail for mobile list view */}
          {isList && (
            <div className="flex md:hidden flex-row items-center gap-2">
              <div className="w-[20px] h-[20px] rounded-full overflow-hidden relative border border-stroke flex-shrink-0 bg-gray-100">
                <Image src={authorAvatar} alt={author} fill className="object-cover" />
              </div>
              <span className="text-[10px] font-medium text-text-body font-inter tracking-[-0.01em] truncate">{author}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col justify-between flex-grow ${isList ? 'py-0.5 min-w-0' : 'px-[8px] min-h-[110px]'}`}>
          <div className="flex flex-col gap-1 md:gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-[12px] font-medium text-text-mute font-inter tracking-[-0.01em]">
                {lessons} lessons <span className="hidden md:inline">/ {duration}</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className={`${isList ? 'text-[15px] md:text-xl' : 'text-[16px]'} font-semibold text-navy leading-[1.3] tracking-[-0.01em] font-inter group-hover:text-primary transition-colors`}>
                {title}
              </h3>
              {isList && (
                <p className="hidden md:block text-[14px] text-text-body line-clamp-2 leading-relaxed opacity-70">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {/* Footer / Instructor (Desktop/Grid) */}
          <div className={`flex items-center justify-between ${isList ? 'mt-2 md:mt-4' : 'mt-auto pt-3'}`}>
            {/* Desktop Instructor Info */}
            <div className={`items-center gap-2 ${isList ? 'hidden md:flex' : 'flex'}`}>
              <div className="w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded-full overflow-hidden relative border border-stroke flex-shrink-0 bg-gray-100">
                <Image src={authorAvatar} alt={author} fill className="object-cover" />
              </div>
              <span className="text-[11px] md:text-[12px] font-medium text-text-body font-inter tracking-[-0.01em]">{author}</span>
            </div>
            
            {isList && (
               <div className="flex items-center gap-4 md:gap-6 ml-auto md:ml-0">
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="text-[13px] font-bold text-navy">★ {rating}</span>
                    <span className="text-[11px] text-text-body">({students})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider rounded-sm">{level}</span>
                    <button className="px-3 md:px-4 py-1 md:py-1.5 bg-navy text-white text-[12px] md:text-sm font-medium rounded-sm hover:bg-primary transition-colors">
                      Enroll
                    </button>
                  </div>
               </div>
            )}
            {!isList && (
               <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-sm">{level}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
