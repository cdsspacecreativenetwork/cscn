'use client';

import React from 'react';
import Image from 'next/image';
import { PauseCircle } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  isLocked: boolean;
  isActive?: boolean;
}

interface ClassLessonsProps {
  totalLessons: number;
  totalDuration: string;
  lessons: Lesson[];
}

export const ClassLessons: React.FC<ClassLessonsProps> = ({
  totalLessons,
  totalDuration,
  lessons
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const INITIAL_VISIBLE_COUNT = 8;
  const displayedLessons = isExpanded ? lessons : lessons.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div className="bg-white rounded-[16px] p-[clamp(16px,1.39vw,24px)] border border-[#E3E8F4] flex flex-col gap-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-2">
        <h2 className="text-[clamp(16px,1.15vw,20px)] font-semibold text-[#040B37] tracking-[-0.4px]">
          Class Lessons
        </h2>
        <span className="text-[clamp(12px,0.81vw,14px)] font-semibold text-[#040B37] tracking-[-0.14px]">
          {totalLessons} Lessons ({totalDuration})
        </span>
      </div>

      {/* Lessons List */}
      <div className="flex flex-col w-full relative">
        <div 
          className={`flex flex-col w-full max-h-[500px] transition-all duration-500 custom-scrollbar ${
            isExpanded ? 'overflow-y-auto pr-2' : 'overflow-hidden'
          }`}
        >
          {displayedLessons.map((lesson, index) => (
            <div 
              key={lesson.id}
              className={`flex items-center justify-between p-4 rounded-[10px] transition-all cursor-pointer group ${
                lesson.isActive 
                  ? 'bg-[#E9EFFF] border border-[#1C4ED1]' 
                  : 'bg-transparent border border-transparent hover:bg-[#F4F6FB]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 shrink-0 relative flex items-center justify-center">
                  {lesson.isActive ? (
                    <PauseCircle className="text-[#4B5563]" size={24} />
                  ) : (
                    <Image 
                      src="/assets/courses/circle-lock-01.svg" 
                      alt="Locked" 
                      width={24} 
                      height={24} 
                      className="opacity-60"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[14px] font-medium text-[#4B5563] tracking-[-0.14px]">
                  <span>{index + 1}.</span>
                  <span className="line-clamp-1">{lesson.title}</span>
                </div>
              </div>
              <span className="text-[14px] font-medium text-[#4B5563] tracking-[-0.14px] ml-4 shrink-0">
                {lesson.duration}
              </span>
            </div>
          ))}
        </div>

        {/* Top Shade Overlay - Only show when not expanded */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
        )}
      </div>

      {/* Show All Button */}
      {!isExpanded && lessons.length > INITIAL_VISIBLE_COUNT && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center gap-1 py-2 text-[#1C4ED1] hover:underline transition-all group mt-2 z-20 cursor-pointer"
        >
          <span className="text-[14px] font-medium tracking-[-0.14px]">Show All Lessons</span>
          <div className="w-5 h-5 relative transition-transform group-hover:translate-y-0.5">
            <Image src="/assets/courses/arrow-down-01.svg" alt="" fill className="object-contain" />
          </div>
        </button>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F4F6FB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #E3E8F4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #C8D1E0;
        }
      `}</style>
    </div>
  );
};
