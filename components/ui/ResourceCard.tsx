'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Resource } from '@/lib/resources';

export default function ResourceCard({ title, price, label, image }: Resource) {
  const isFree = label === 'Free';
  const buttonText = isFree ? 'Download' : `Pay $${price}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-[16px] border border-[#C8D1E0] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col p-2 pb-4 gap-4 w-full h-full"
    >
      {/* Thumbnail */}
      <div className="bg-[#F4F6FB] relative rounded-[10px] overflow-hidden aspect-[314/216] lg:aspect-square xl:aspect-[314/216] w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 33vw, 314px"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[18px] px-2 flex-grow">
        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-medium text-[#4B5563] font-inter tracking-[-0.01em]">
            {label}
          </span>
          <h3 className="text-[18px] font-semibold text-[#040B37] leading-[1.24] tracking-[-0.02em] font-inter line-clamp-2">
            {title}
          </h3>
        </div>

        {/* Action */}
        <div className="mt-auto pt-2">
          <button className="w-full py-[13px] border border-[#E3E8F4] rounded-full text-[16px] font-medium text-[#4B5563] font-inter hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 duration-200">
            {buttonText}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
