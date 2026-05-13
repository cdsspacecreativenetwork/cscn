'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';

interface EnrollButtonProps {
  courseSlug: string;
  firstLessonId?: string | null;
}

export function EnrollButton({ courseSlug, firstLessonId }: EnrollButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseSlug}/enroll`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to enroll. Please try again.');
        return;
      }

      toast.success('Enrolled successfully!');
      if (firstLessonId) {
        router.push(`/courses/${courseSlug}/watch/${firstLessonId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Button
      variant="gradient"
      size="lg"
      className="w-full mlg:w-auto"
      onClick={handleEnroll}
      loading={isPending}
    >
      Take this Course
    </Button>
  );
}
