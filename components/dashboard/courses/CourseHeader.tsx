'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

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

  const handleMarkComplete = () => {
    startTransition(async () => {
      try {
        await fetch(`/api/lessons/${lessonId}/progress`, { method: 'POST' });
        setDone(true);
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
    <div className="flex w-full flex-col gap-4 rounded-[18px] border border-[#E3E8F4] bg-white px-4 py-4 font-jakarta shadow-sm md:flex-row md:items-center md:justify-between lg:px-5">
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={
            <div className="relative h-6 w-6">
              <Image src="/assets/dashboard/arrow-left-02.svg" alt="Back" fill className="object-contain" />
            </div>
          }
          className="h-auto px-0 text-primary! hover:bg-primary/5!"
        >
          Back
        </Button>

        <h1 className="min-w-0 flex-1 text-lg font-black leading-tight text-[#040B37] lg:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        {nextLessonId && (
          <Button
            type="button"
            variant="outline"
            rounded="[12px]"
            onClick={() => router.push(`/courses/${courseSlug}/watch/${nextLessonId}`)}
            rightIcon={<ArrowRight size={16} />}
            className="flex-1 px-4! py-2.5! text-sm! sm:flex-none"
          >
            Next
          </Button>
        )}
        {isEnrolled && allowManualComplete && !isPreviewMode && (
          <Button
            variant={done ? 'ghost' : 'primary'}
            rounded="[12px]"
            disabled={pending || done}
            onClick={handleMarkComplete}
            className="flex-1 px-3! py-2.5! text-sm! disabled:opacity-60 sm:flex-none lg:px-6!"
          >
            {done ? 'Completed' : pending ? 'Saving...' : 'Mark Complete'}
          </Button>
        )}
      </div>
    </div>
  );
};
