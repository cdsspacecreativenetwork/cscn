'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface CourseHeaderProps {
  title: string;
  lessonId: string;
  courseSlug: string;
  nextLessonId: string | null;
  isEnrolled: boolean;
  isCompleted: boolean;
}

export const CourseHeader = ({
  title,
  lessonId,
  courseSlug,
  nextLessonId,
  isEnrolled,
  isCompleted,
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
          router.push(`/courses/${courseSlug}/watch/${nextLessonId}`);
        } else {
          router.refresh();
        }
      } catch {
        // silently fail — user can retry
      }
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4 md:gap-0 font-jakarta">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-start sm:items-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={
            <div className="relative w-6 h-6">
              <Image src="/assets/dashboard/arrow-left-02.svg" alt="Back" fill className="object-contain" />
            </div>
          }
          className="text-primary! hover:bg-primary/5! px-0 h-auto"
        >
          Back
        </Button>

        <h1 className="font-bold text-[#040B37] text-lg lg:text-xl max-w-[501px] leading-tight">
          {title}
        </h1>
      </div>

      {isEnrolled && (
        <Button
          variant={done ? 'ghost' : 'primary'}
          rounded="sm"
          disabled={pending || done}
          onClick={handleMarkComplete}
          className="px-3! lg:px-8 text-xs! lg:text-base py-2.5 h-auto md:ml-1 lg:ml-0 disabled:opacity-60"
        >
          {done ? '✓ Completed' : pending ? 'Saving…' : 'Mark Complete'}
        </Button>
      )}
    </div>
  );
};
