'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface CourseHeaderProps {
  title: string;
  lessonId: string;
  courseSlug: string;
  nextLessonId: string | null;
  isEnrolled: boolean;
  isCompleted: boolean;
  allowManualComplete?: boolean;
  isPreviewMode?: boolean;
  onRequestNext?: () => void;
}

export const CourseHeader = ({
  title,
  lessonId,
  courseSlug,
  nextLessonId,
  isEnrolled,
  isCompleted,
  allowManualComplete = true,
  isPreviewMode = false,
  onRequestNext,
}: CourseHeaderProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(isCompleted);

  const markComplete = async () => {
    if (!isEnrolled || !allowManualComplete || isPreviewMode || done) return;
    await fetch(`/api/lessons/${lessonId}/progress`, { method: 'POST' });
    setDone(true);
  };

  const handleNext = () => {
    startTransition(async () => {
      try {
        await markComplete();
        if (nextLessonId) {
          if (onRequestNext) {
            onRequestNext();
          } else {
            router.push(`/courses/${courseSlug}/watch/${nextLessonId}`);
          }
        } else {
          router.refresh();
        }
      } catch {
        // The learner can retry without losing their place.
      }
    });
  };

  return (
    <div className="flex w-full items-center gap-2 border-b border-[#E3E8F4] px-1 pb-3 pt-1 font-jakarta sm:gap-3 lg:px-0 lg:pb-4">
      <button
          type="button"
          onClick={() => router.back()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#E3E8F4] bg-white text-[#1C4ED1] transition hover:border-[#1C4ED1] hover:bg-[#1C4ED1]/5 sm:w-auto sm:px-3"
          aria-label="Back"
        >
        <ArrowLeft size={18} />
        <span className="ml-2 hidden text-sm font-bold sm:inline">Back</span>
      </button>

      <h1 className="min-w-0 flex-1 truncate text-[clamp(16px,2.8vw,24px)] font-black leading-tight text-[#040B37]" title={title}>
          {title}
        </h1>

        {nextLessonId && (
        <button
            type="button"
          onClick={handleNext}
          disabled={pending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#E3E8F4] bg-white text-[#040B37] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-4"
          aria-label="Next lesson"
          >
          <span className="hidden text-sm font-bold sm:inline">{pending ? 'Saving...' : 'Next'}</span>
          <ArrowRight size={18} className="sm:ml-2" />
        </button>
        )}
    </div>
  );
};
