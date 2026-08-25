'use client';

import { useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  approveInstructorApplicationAction,
  rejectInstructorApplicationAction,
} from '@/actions/instructor-applications';
import Button from '@/components/ui/Button';

export function InstructorApplicationActions({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();

  const decide = (decision: 'approve' | 'reject') => {
    startTransition(async () => {
      const result = decision === 'approve'
        ? await approveInstructorApplicationAction(applicationId)
        : await rejectInstructorApplicationAction(applicationId);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="primary"
        size="sm"
        rounded="full"
        disabled={isPending}
        loading={isPending}
        leftIcon={<Check size={14} />}
        onClick={() => decide('approve')}
      >
        Approve
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        rounded="full"
        disabled={isPending}
        leftIcon={<X size={14} />}
        onClick={() => decide('reject')}
      >
        Reject
      </Button>
    </div>
  );
}
