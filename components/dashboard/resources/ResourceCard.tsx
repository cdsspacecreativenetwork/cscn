'use client';

import React from 'react';
import Image from 'next/image';
import { File as FileIcon, Repeat2 } from 'lucide-react';
import { Resource } from '@/lib/resourceService';

interface ResourceCardProps {
  resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  // Theme Mapper for Compositional Styling
  const getTheme = () => {
    switch (resource.type) {
      case 'PDF':
        return {
          badgeBg: 'bg-[#EEF3FF]',
          badgeText: 'text-[#1C4ED1]',
          icon: '/assets/dashboard/pdf-01.svg'
        };
      case 'LINK':
        return {
          badgeBg: 'bg-[#EEF3FF]',
          badgeText: 'text-[#1C4ED1]',
          icon: '/assets/dashboard/user/arrow-up-right-03.svg'
        };
      case 'FILE':
        return {
          badgeBg: 'bg-[#EFF6FF]',
          badgeText: 'text-[#1C4ED1]',
          icon: '/assets/dashboard/attachment-circle.svg'
        };
      default:
        return {
          badgeBg: 'bg-[#F4F6FB]',
          badgeText: 'text-[#4B5563]',
          icon: null
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="bg-white rounded-[14px] border border-[#E3E8F4] p-6 md:p-8 flex flex-col gap-6 transition-all hover:border-[#1C4ED1]/30 group h-full shadow-sm">
      {/* Top: Icon Container - Using exact rgba(28, 78, 209, 0.04) */}
      <div 
        className="w-12 h-12 rounded-[8px] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative"
        style={{ backgroundColor: 'rgba(28, 78, 209, 0.04)' }}
      >
        {theme.icon ? (
          <div className="relative w-6 h-6">
            <Image 
              src={theme.icon} 
              alt="" 
              fill 
              className="object-contain"
              // Force icon color to #1C4ED1 using CSS filter
              style={{ filter: 'invert(24%) sepia(91%) saturate(2333%) hue-rotate(218deg) brightness(91%) contrast(92%)' }}
            />
          </div>
        ) : (
          <div className="text-[#1C4ED1]">
             <FileIcon size={24} />
          </div>
        )}
      </div>

      {/* Middle: Stacked Title & Category */}
      <div className="flex flex-col gap-2 flex-1">
        <h4 className="text-[18px] font-bold text-[#040B37] leading-tight group-hover:text-[#1C4ED1] transition-colors tracking-tight font-jakarta">
          {resource.title}
        </h4>
        <span className="text-[14px] font-medium text-[#9CA3AF] tracking-tight">
          {resource.courseTitle}
        </span>
        <span className="text-[13px] font-medium text-[#4B5563] tracking-tight">
          {resource.lessonTitle}
        </span>
      </div>

      {/* Metadata Row: Badge & Size */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
          {resource.type === 'LINK' ? 'Link' : resource.type}
        </span>
        {resource.scope === 'instructor' && typeof resource.usageCount === 'number' ? (
          <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#F4F6FB] px-2.5 py-1 text-[12px] font-bold text-[#1C4ED1]">
            <Repeat2 size={13} />
            {resource.usageCount} {resource.usageCount === 1 ? 'lesson' : 'lessons'}
          </span>
        ) : resource.size && (
          <span className="text-[14px] font-medium text-[#9CA3AF] tracking-tight">
            {resource.size}
          </span>
        )}
      </div>

      {/* Bottom: Action Area */}
      <div className="pt-2">
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-[#1C4ED1] hover:text-[#040B37] transition-all group/btn outline-none">
          {resource.type === 'LINK' ? (
             <>
                <div className="relative w-5 h-5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
                 <Image 
                  src="/assets/dashboard/user/arrow-up-right-03.svg" 
                  alt="" 
                  fill 
                  className="brightness-0"
                  style={{ filter: 'invert(24%) sepia(91%) saturate(2333%) hue-rotate(218deg) brightness(91%) contrast(92%)' }}
                 />
               </div>
               <span className="text-[18px] font-semibold tracking-tight">Open</span>
             </>
          ) : (
            <>
              <div className="relative w-5 h-5 transition-transform group-hover/btn:translate-y-0.5">
                 <Image 
                  src="/assets/dashboard/download-circle-01.svg" 
                  alt="" 
                  fill 
                  className="brightness-0"
                  style={{ filter: 'invert(24%) sepia(91%) saturate(2333%) hue-rotate(218deg) brightness(91%) contrast(92%)' }}
                 />
              </div>
              <span className="text-[18px] font-semibold tracking-tight">Download</span>
            </>
          )}
        </a>
      </div>
    </div>
  );
};

export const ResourceCardSkeleton = () => (
  <div className="bg-white rounded-[14px] border border-[#E3E8F4] p-6 md:p-8 flex flex-col gap-6 animate-pulse h-full">
    <div className="w-12 h-12 rounded-[8px] bg-[#F4F6FB]" />
    <div className="flex-1 space-y-3">
      <div className="h-5 bg-[#F4F6FB] rounded-md w-3/4" />
      <div className="h-4 bg-[#F4F6FB] rounded-md w-1/2" />
    </div>
    <div className="flex items-center justify-between">
      <div className="w-16 h-7 bg-[#F4F6FB] rounded-[8px]" />
      <div className="w-12 h-4 bg-[#F4F6FB] rounded-md" />
    </div>
    <div className="h-6 bg-[#F4F6FB] rounded-md w-24 mt-2" />
  </div>
);
