'use client';

import React from 'react';
import Image from 'next/image';

interface CourseDetailsProps {
  enrolledCount: string;
  ratingAverage: number;
  ratingCount: number;
  price: string;
  description: string;
  instructor: {
    name: string;
    role: string;
    image: string;
  };
  requirements?: string[];
  includes?: string[];
  enrollCta?: React.ReactNode;
}

function getIncludeIcon(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('video') || t.includes('hour')) return 'laptop-video.svg';
  if (t.includes('assignment') || t.includes('quiz') || t.includes('exercise')) return 'assignments.svg';
  if (t.includes('download') || t.includes('resource') || t.includes('file') || t.includes('material') || t.includes('notebook')) return 'book-download.svg';
  if (t.includes('certificate')) return 'certificate-01.svg';
  return 'book-download.svg';
}

export const CourseDetails: React.FC<CourseDetailsProps> = ({
  enrolledCount,
  ratingAverage,
  ratingCount,
  price,
  description,
  instructor,
  requirements = [],
  includes = [],
  enrollCta,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px]">
      {/* Pricing & Enrollment Bar */}
      <div className="flex flex-col mlg:flex-row items-stretch mlg:items-center justify-between w-full bg-white p-4 sm:p-6 rounded-[16px] border border-[#E3E8F4] gap-6 mlg:gap-0">
        <div className="flex items-center justify-between mlg:justify-start w-full mlg:w-auto gap-[clamp(24px,4.17vw,48px)]">
          {/* Enrolled */}
          <div className="flex flex-col justify-center gap-[6px]">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 relative shrink-0">
                <Image src="/assets/courses/user-group.svg" alt="Users" fill className="object-contain" />
              </div>
              <span className="text-[12px] font-medium text-[#4B5563] tracking-[-0.12px] leading-normal">Enrolled</span>
            </div>
            <span className="text-[16px] font-semibold text-[#040B37] tracking-[-0.16px] leading-normal">{enrolledCount}</span>
          </div>

          <div className="flex flex-col justify-center gap-[6px]">
            <span className="text-[12px] font-medium text-[#4B5563] tracking-[-0.12px] leading-normal">Rating</span>
            <span className="text-[16px] font-semibold text-[#040B37] tracking-[-0.16px] leading-normal">
              {ratingAverage > 0 ? `★ ${ratingAverage.toFixed(1)}` : '★ New'}
              <span className="text-[12px] font-medium text-[#4B5563] ml-1">({ratingCount})</span>
            </span>
          </div>

          {/* Price (Mobile only row partner, Desktop original) */}
          <div className="flex mlg:hidden flex-col justify-center gap-1">
            <span className="text-[12px] font-medium text-[#4B5563] tracking-[-0.12px] leading-normal">Price</span>
            <span className="text-[20px] font-semibold text-[#040B37] tracking-[-0.2px] leading-normal">{price}</span>
          </div>
        </div>

        <div className="flex flex-col mlg:flex-row items-stretch mlg:items-center gap-6 w-full mlg:w-auto">
          {/* Price (Desktop only) */}
          <div className="hidden mlg:flex flex-col justify-center gap-1">
            <span className="text-[12px] font-medium text-[#4B5563] tracking-[-0.12px] leading-normal">Price</span>
            <span className="text-[24px] font-semibold text-[#040B37] tracking-[-0.24px] leading-normal">{price}</span>
          </div>

          <div className="w-[1px] h-11 bg-[#C8D1E0] hidden mlg:block"></div>

          {/* Enroll CTA */}
          {enrollCta ?? (
            <div className="border border-[#648efc] p-[2px] rounded-full w-full mlg:w-auto">
              <button className="flex items-center justify-center w-full mlg:px-6 py-[12.5px] bg-gradient-to-r from-[#0035C1] to-[#0575FF] rounded-full transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer">
                <span className="text-white font-medium text-[16px] tracking-[-0.16px] whitespace-nowrap leading-normal">
                  Take this Course
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Course Content Card */}
      <div className="bg-white rounded-[16px] p-4 sm:p-6 border border-[#E3E8F4] flex flex-col gap-6">
        {/* Includes Section */}
        {includes.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[20px] font-semibold text-[#040B37] tracking-[-0.4px] leading-[1.24]">
              This Class includes:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {includes.map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 relative shrink-0">
                    <Image src={`/assets/courses/${getIncludeIcon(text)}`} alt="" fill className="object-contain" />
                  </div>
                  <span className="text-[14px] font-medium text-[#4B5563] tracking-[-0.14px] leading-normal">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {includes.length > 0 && requirements.length > 0 && (
          <div className="w-full h-[1px] bg-[#C8D1E0]"></div>
        )}

        {/* Requirements Section */}
        {requirements.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[20px] font-semibold text-[#040B37] tracking-[-0.4px] leading-[1.24]">
              Requirements
            </h3>
            <ul className="flex flex-col gap-[10px]">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-1 text-[14px] font-medium text-[#4B5563] tracking-[-0.14px] leading-normal">
                  <span className="shrink-0 ml-1">-</span>
                  <span className="ml-1.5">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="bg-white rounded-[16px] p-4 sm:p-6 border border-[#E3E8F4]">
        <h3 className="text-[20px] font-semibold text-[#040B37] tracking-[-0.4px] leading-[1.24] mb-4">
          About this class
        </h3>
        <div className="text-sm md:text-[16px] font-medium text-[#4B5563] leading-[1.4005] tracking-[0.16px] space-y-4">
          {description.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      {/* Instructor Card */}
      <div className="bg-white rounded-[16px] p-4 sm:p-6 border border-[#E3E8F4]">
        <h3 className="text-[20px] font-semibold text-[#040B37] tracking-[-0.4px] leading-[1.24] mb-6">
          Your Instructor
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="w-12 h-12 relative rounded-full overflow-hidden border border-[#E3E8F4] shrink-0">
              <Image src={instructor.image} alt={instructor.name} fill className="object-cover" />
            </div>
            <div className="flex flex-col justify-center gap-1">
              <span className="text-[16px] font-semibold text-[#040B37] tracking-[-0.16px] leading-normal">
                {instructor.name}
              </span>
              <span className="text-[14px] font-medium text-[#4B5563] tracking-[-0.14px] leading-normal">
                {instructor.role}
              </span>
            </div>
          </div>
          <button className="w-full sm:w-auto px-5 py-3 border border-[#1C4ED1] rounded-full text-[#1C4ED1] text-[14px] font-medium hover:bg-[#1C4ED1] hover:text-white transition-all cursor-pointer whitespace-nowrap leading-normal">
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};
