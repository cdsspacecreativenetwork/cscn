'use client';

import React from 'react';
import { ActivityChart } from '@/components/dashboard/progress/ActivityChart';
import { CompletionDonut } from '@/components/dashboard/progress/CompletionDonut';
import { CourseProgressList } from '@/components/dashboard/progress/CourseProgressList';
import { Achievements } from '@/components/dashboard/progress/Achievements';

export default function ProgressPage() {
  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto font-jakarta">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#040B37] tracking-tight">
          My Progress
        </h1>
        <p className="text-[#6B7280] text-[15px] md:text-[16px]">
          Track your growth and celebrate achievements
        </p>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-1 xl:col-span-3">
          <ActivityChart />
        </div>
        <div className="lg:col-span-1 xl:col-span-1">
          <CompletionDonut />
        </div>
      </div>

      {/* Grid for Progress and Achievements */}
      <div className="grid grid-cols-1 gap-8 md:gap-10">
        {/* Detailed Course Progress */}
        <div className="space-y-6">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#040B37] tracking-tight">
            Progress by Course
          </h2>
          <CourseProgressList />
        </div>

        {/* Achievements Section */}
        <div className="space-y-6">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#040B37] tracking-tight">
            Achievements
          </h2>
          <Achievements />
        </div>
      </div>
    </div>
  );
}
