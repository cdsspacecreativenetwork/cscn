'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface CourseActionButtonProps {
  label: string;
  href?: string;
  disabled?: boolean;
  className?: string;
}

export function CourseActionButton({
  label,
  href,
  disabled = false,
  className = 'w-full mlg:w-auto',
}: CourseActionButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="gradient"
      size="lg"
      rounded="full"
      className={className}
      disabled={disabled}
      onClick={() => {
        if (!href || disabled) return;
        router.push(href);
      }}
    >
      {label}
    </Button>
  );
}
