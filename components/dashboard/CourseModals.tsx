'use client';

import React from 'react';
import Image from 'next/image';
import { BaseModal } from '../ui/BaseModal';
import Button from '../ui/Button';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    image: string;
    lessonInfo?: string; // e.g., "Lesson 7 of 12"
    status?: 'playing' | 'not-started';
    duration?: string;   // e.g., "12h Total"
    description?: string;
    firstLessonId?: string | null;
    nextLessonId?: string | null;
  };
  onAction: () => void;
}

/**
 * Resume Course Modal
 * Node ID: 9020:5540
 */
export const ResumeCourseModal = ({ isOpen, onClose, course, onAction }: CourseModalProps) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col font-jakarta" data-node-id="9020:5540">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E3E8F4]" data-node-id="9020:5545">
          <h3 className="font-semibold text-[#4B5563] text-base max-w-[85%] leading-tight" data-node-id="9020:5541">
            {course.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            data-node-id="9020:5543"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6" data-node-id="9024:5566">
          {/* Thumbnail */}
          <div className="relative aspect-[516/228] w-full rounded-2xl overflow-hidden bg-gray-100 group" data-node-id="9020:5547">
            <Image
              src={course.image}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="w-10 h-10 relative" data-node-id="9020:5548">
                <Image src="/assets/dashboard/play.svg" alt="Play" fill className="object-contain" />
              </div>
            </div>
          </div>

          {/* Info & Description */}
          <div className="flex flex-col gap-6" data-node-id="9024:5563">
            <div className="flex items-center gap-6" data-node-id="9020:5561">
              <div className="flex items-center gap-2" data-node-id="9020:5557">
                <div className="relative w-5 h-5">
                  <Image src="/assets/dashboard/book-open-text.svg" alt="Lessons" fill />
                </div>
                <span className="font-medium text-[#4B5563] text-sm tracking-[-0.01em]">
                  {course.lessonInfo}
                </span>
              </div>
              <div className="flex items-center gap-2" data-node-id="9020:5560">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span className="font-medium text-[#16A34A] text-sm tracking-[-0.01em]">
                  Playing
                </span>
              </div>
            </div>

            <p className="font-medium text-[#9CA3AF] text-sm leading-relaxed" data-node-id="9020:5562">
              {course.description || "This is the course player view for the current lesson. You can watch the video, read the transcript, and take notes here."}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 flex items-center justify-end gap-6 border-t border-[#E3E8F4]" data-node-id="9025:5593">
          <Button
            variant="secondary"
            onClick={onClose}
            rounded="[10px]"
            hasBorder={false}
            className="w-[104px] border-0! bg-[#E3E8F4] !text-[#1C4ED1] hover:bg-[#D4DAE8]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            rounded="[10px]"
            hasBorder={false}
            onClick={onAction}
            className="w-[164px] border-0!"
          >
            Continue
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

/**
 * Get Started Modal
 * Node ID: 9044:6611
 */
export const GetStartedModal = ({ isOpen, onClose, course, onAction }: CourseModalProps) => {
  const hasPlayableLesson = Boolean(course.firstLessonId || course.nextLessonId);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col font-jakarta" data-node-id="9044:6611">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-[#E3E8F4]" data-node-id="9044:6613">
          <h3 className="font-bold text-[#040B37] text-base md:text-lg max-w-[85%] leading-tight" data-node-id="9044:6614">
            {course.title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center hover:bg-gray-100 rounded-[10px] transition-colors cursor-pointer text-[#4B5563]"
            data-node-id="9044:6615"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 flex flex-col gap-5" data-node-id="9044:6619">
          {/* Thumbnail */}
          <div className="relative aspect-[16/7] max-h-[260px] w-full rounded-[14px] overflow-hidden bg-gray-100 group" data-node-id="9044:6621">
            <Image
              src={course.image}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="w-10 h-10 relative" data-node-id="9044:6622">
                <Image src="/assets/dashboard/play.svg" alt="Play" fill className="object-contain" />
              </div>
            </div>
          </div>

          {/* Info & Description */}
          <div className="flex flex-col gap-4" data-node-id="9044:6624">
            <div className="flex flex-wrap items-center gap-3" data-node-id="9044:6626">
              <div className="relative w-5 h-5 opacity-60">
                {/* Clock Icon Fallback */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7V12L14.5 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-medium text-[#4B5563] text-sm tracking-[-0.01em]">
                {course.duration || "Self-paced"}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                hasPlayableLesson
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {hasPlayableLesson ? 'Ready to start' : 'Lessons unavailable'}
              </span>
            </div>

            <p className="font-medium text-[#6B7280] text-sm leading-relaxed" data-node-id="9044:6636">
              {course.description || (hasPlayableLesson
                ? "Start with the first available lesson and continue learning at your pace."
                : "This course is visible, but the instructor still needs to publish at least one lesson before students can start.")}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-6 flex items-center justify-end gap-3 border-t border-[#E3E8F4]" data-node-id="9044:6638">
          <Button
            variant="secondary"
            rounded="[10px]"
            onClick={onClose}
            hasBorder={false}
            className="w-[112px] border-0! bg-[#E3E8F4] !text-[#1C4ED1] hover:bg-[#D4DAE8]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            rounded="[10px]"
            onClick={onAction}
            disabled={!hasPlayableLesson}
            hasBorder={false}
            className="w-[164px] border-0! text-sm! md:text-base! px-3! md:px-6!"
          >
            Start Learning
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
