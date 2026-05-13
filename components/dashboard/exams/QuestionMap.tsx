import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface QuestionStatus {
  id: number;
  status: 'unanswered' | 'answered' | 'flagged' | 'current';
}

interface QuestionMapProps {
  questions: QuestionStatus[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

export const QuestionMap = ({ questions, currentIndex, onJumpTo }: QuestionMapProps) => {
  const legend = [
    { label: 'Unanswered', bg: 'bg-white', border: 'border-[#E3E8F4]', dot: 'bg-white' },
    { label: 'Flagged', bg: 'bg-white', border: 'border-[#FB923C]', dot: 'bg-[#FB923C]' },
    { label: 'Current', bg: 'bg-white', border: 'border-[#1C4ED1]', dot: 'bg-[#1C4ED1]' },
    { label: 'Answered', bg: 'bg-[#1C4ED1]', border: 'border-[#1C4ED1]', dot: 'bg-[#1C4ED1]' },
  ];

  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[24px] p-8 flex flex-col gap-8 w-full lg:w-[400px] shrink-0 font-jakarta h-fit sticky top-[136px]">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-bold text-[#040B37]">Question Map</h3>
        <p className="text-[14px] font-medium text-[#9CA3AF] leading-relaxed">
          Review your progress and jump to specific questions.
        </p>
      </div>

      {/* Grid with scrolling for 100+ questions */}
      <div className="max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-5 gap-3">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isFlagged = q.status === 'flagged';
            let bgColor = 'bg-white';
            let textColor = 'text-[#4B5563]';
            let borderColor = 'border-[#E3E8F4]';

            if (q.status === 'answered') {
              bgColor = 'bg-[#1C4ED1]';
              textColor = 'text-white';
              borderColor = 'border-[#1C4ED1]';
            } else if (isFlagged) {
              borderColor = 'border-[#FB923C]';
              textColor = 'text-[#FB923C]';
            }

            if (isCurrent) {
              borderColor = 'border-[#1C4ED1] border-2';
            }

            return (
              <motion.button
                key={q.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onJumpTo(idx)}
                className={`
                  relative aspect-square flex items-center justify-center rounded-[12px] border text-[14px] font-bold transition-all cursor-pointer
                  ${bgColor} ${textColor} ${borderColor}
                `}
              >
                {q.id}
                {isFlagged && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FB923C] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <div className="relative w-2 h-2">
                      <Image src="/assets/dashboard/flag-01.svg" alt="Flagged" fill className="object-contain invert" />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-4 border-t border-[#E3E8F4] pt-8">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-[6px] border ${item.bg} ${item.border}`} />
            <span className="text-[14px] font-semibold text-[#4B5563]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
