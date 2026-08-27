'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getCourseProgress, CourseProgress } from '@/lib/progressService';
import { Card } from '@/components/ui/Card';

export const CourseProgressList = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const result = await getCourseProgress();
        setCourses(result);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <Card className="items-center justify-center px-12 [--card-spacing:48px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#1C4ED1] animate-spin" />
          <span className="text-[14px] font-bold text-[#1C4ED1]">Syncing course data...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {courses.map((course) => (
        <Card
          key={course.id}
          className="gap-6 px-6 md:px-8 [--card-spacing:24px] md:[--card-spacing:32px] transition-all hover:border-[#1C4ED1]/30 group"
        >
          {/* Course Info Header */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[18px] md:text-[20px] font-bold text-[#040B37] group-hover:text-[#1C4ED1] transition-colors tracking-tight">
              {course.title}
            </h4>
            <span className="text-[14px] font-medium text-[#9CA3AF]">
              {course.instructor}
            </span>
          </div>

          {/* Progress Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end">
              <span className="text-[14px] font-medium text-[#9CA3AF] tracking-tight">
                {course.progress}%
              </span>
            </div>
            
            {/* High-Fidelity Progress Bar */}
            <div className="w-full h-4 bg-[#F4F6FB] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1C4ED1] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
