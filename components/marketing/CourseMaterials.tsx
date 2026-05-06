'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { COURSE_MATERIALS } from '@/lib/resources';

export default function CourseMaterials() {
  return (
    <div className="bg-white rounded-[24px] p-6 md:p-12 flex flex-col gap-10">
      <h2 className="text-[24px] font-semibold text-[#040B37] tracking-[-0.02em] font-inter">
        Course Materials
      </h2>
      
      <div className="grid grid-cols-1 gap-x-12 gap-y-10">
        {COURSE_MATERIALS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 group cursor-pointer"
          >
            {/* Icon Box */}
            <div className="w-14 h-14 rounded-[8px] overflow-hidden flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image 
                src={item.icon} 
                alt={item.title} 
                width={56} 
                height={56} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Text */}
            <div className="flex flex-col gap-1">
              <h4 className="text-[18px] font-semibold text-[#040B37] leading-[1.24] tracking-[-0.02em] font-inter group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h4>
              <p className="text-[14px] font-medium text-[#4B5563] tracking-[-0.01em] font-inter">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
