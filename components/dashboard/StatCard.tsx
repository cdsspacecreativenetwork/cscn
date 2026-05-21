'use client';

import React from 'react';
import Image from 'next/image';

interface StatCardProps {
  title: string;
  value: string | number;
  iconSrc?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, iconSrc, icon }) => {
  return (
    <div className="bg-white border border-[#E3E8F4] p-[clamp(12px,1.39vw,24px)] rounded-[12px] shadow-[0px_0px_1px_rgba(23,26,31,0.08),0px_0px_0.5px_rgba(23,26,31,0.05)] flex flex-col gap-[clamp(16px,1.62vw,28px)] items-start flex-1">
      <div className="flex items-start justify-between w-full gap-2">
        <p className="text-[clamp(13px,1.04vw,18px)] font-medium text-[#9CA3AF] leading-tight flex-1">{title}</p>
        <div className="w-[clamp(32px,2.31vw,40px)] h-[clamp(32px,2.31vw,40px)] bg-[#F4F6FB] rounded-[10px] flex items-center justify-center shrink-0">
          {icon ? (
            icon
          ) : iconSrc ? (
            <div 
              className="relative" 
              style={{ width: 'clamp(18px, 1.38vw, 24px)', height: 'clamp(18px, 1.38vw, 24px)' }}
            >
              <Image 
                src={iconSrc} 
                alt={title} 
                fill 
                className="object-contain" 
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col items-start mt-auto">
        <p className="text-[clamp(24px,1.85vw,32px)] font-bold text-[#040B37] leading-none">{value}</p>
      </div>
    </div>
  );
};
