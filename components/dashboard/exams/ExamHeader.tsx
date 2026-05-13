'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExamHeaderProps {
  title: string;
  initialTime: number; // in seconds
  onSubmit: () => void;
  onExit: () => void;
}

export const ExamHeader = ({ title, initialTime, onSubmit, onExit }: ExamHeaderProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timePercent = (timeLeft / initialTime) * 100;
  
  let timerClasses = "bg-[#040B37]/5 text-[#040B37]"; // Default
  if (timePercent < 20) {
    timerClasses = "bg-[#FEF2F2] text-[#991B1B] border border-[#991B1B]/20 animate-pulse"; // Red
  } else if (timePercent < 50) {
    timerClasses = "bg-[#FACC15]/10 text-[#A16207] border border-[#FACC15]/20"; // Yellow
  }

  return (
    <div className="bg-white border-b border-[#E3E8F4] h-[72px] md:h-[96px] px-4 md:px-[clamp(16px,2.3vw,40px)] flex items-center justify-between sticky top-0 z-50 font-jakarta">
      {/* Left: Exit */}
      <button 
        onClick={onExit}
        className="flex items-center gap-1.5 md:gap-2 text-[#1C4ED1] font-bold hover:opacity-80 transition-opacity cursor-pointer shrink-0"
      >
        <ArrowLeft size={18} className="md:w-5 md:h-5" />
        <span className="text-[13px] md:text-[16px] whitespace-nowrap">Exit Exam</span>
      </button>

      {/* Center: Title (Hidden on mobile) */}
      <h2 className="hidden lg:block text-[18px] font-bold text-[#040B37] tracking-tight truncate px-4">
        {title}
      </h2>

      {/* Right: Timer & Submit */}
      <div className="flex items-center gap-2 md:gap-6 ml-auto">
        <div className={`
          px-3 md:px-8 py-2 md:py-3 rounded-[8px] md:rounded-[12px] flex items-center justify-center min-w-[70px] md:min-w-[120px] transition-colors duration-500
          ${timerClasses}
        `}>
          <span className="text-[15px] md:text-[20px] font-bold font-mono">
            {formatTime(timeLeft)}
          </span>
        </div>

        <Button 
          variant="primary" 
          rounded="sm"
          className="h-[38px] md:h-[48px] px-3! md:px-8! text-[13px]! md:text-[15px]! whitespace-nowrap"
          onClick={onSubmit}
        >
          Submit Exam
        </Button>
      </div>
    </div>
  );
};
