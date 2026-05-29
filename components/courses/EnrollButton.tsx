'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { startCourseCheckoutAction } from '@/actions/payments';

interface EnrollButtonProps {
  courseSlug: string;
  firstLessonId?: string | null;
  isPaid?: boolean;
}

export function EnrollButton({ courseSlug, firstLessonId, isPaid = false }: EnrollButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    startTransition(async () => {
      if (isPaid) {
        const result = await startCourseCheckoutAction(courseSlug);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (result.authorizationUrl) {
          window.location.href = result.authorizationUrl;
          return;
        }
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
          return;
        }
      }

      const res = await fetch(`/api/courses/${courseSlug}/enroll`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to enroll. Please try again.');
        return;
      }

      toast.success('Enrolled successfully!');
      const playableLessonId = data.firstLessonId ?? firstLessonId;
      if (playableLessonId) {
        router.push(`/courses/${courseSlug}/watch/${playableLessonId}`);
      } else {
        toast.info('You are enrolled. Lessons will be available once the instructor publishes them.');
        router.refresh();
      }
    });
  };

  return (
    <Button
      variant="gradient"
      size="lg"
      rounded="full"
      className="w-full mlg:w-auto"
      onClick={handleEnroll}
      loading={isPending}
    >
      {isPaid ? 'Buy this Course' : 'Take this Course'}
    </Button>
  );
}
