'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAchievements, Achievement } from '@/lib/progressService';

export const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const result = await getAchievements();
        setAchievements(result);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-[16px] border border-[#E3E8F4]">
        <Loader2 className="w-8 h-8 text-[#1C4ED1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E3E8F4] p-6 md:p-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={`h-[128px] rounded-[12px] border border-[#E3E8F4] flex flex-col items-center justify-center gap-3 transition-all ${
              achievement.isUnlocked 
                ? 'bg-white opacity-100 shadow-sm hover:shadow-md hover:border-[#1C4ED1]/30 cursor-default' 
                : 'bg-[#F9FAFB] opacity-60 grayscale cursor-not-allowed'
            }`}
          >
            <span className="text-[32px] md:text-[40px] leading-none transform group-hover:scale-110 transition-transform duration-300">
              {achievement.icon}
            </span>
            <span className={`text-[13px] md:text-[14px] font-bold text-center px-4 leading-tight ${
              achievement.isUnlocked ? 'text-[#040B37]' : 'text-[#9CA3AF]'
            }`}>
              {achievement.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
