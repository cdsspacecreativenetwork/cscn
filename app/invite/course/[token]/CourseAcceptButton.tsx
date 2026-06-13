'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  token: string;
}

export function CourseAcceptButton({ token }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = () => {
    setPendingAction('accept');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/invite/course/${token}`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? 'Failed to accept invite');
          return;
        }
        toast.success('Invite accepted! Welcome to the course team.');
        router.push(`/dashboard/instructor/courses/${json.courseId}`);
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleDecline = () => {
    setPendingAction('decline');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/invite/course/${token}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? 'Failed to decline invite');
          return;
        }
        toast.success('Invite declined.');
        router.push('/dashboard');
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="grid gap-3">
      <button
        onClick={handleAccept}
        disabled={isPending}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#1C4ED1] text-[15px] font-semibold text-white transition-all hover:bg-[#163BB1] disabled:opacity-60"
      >
        {pendingAction === 'accept' ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <CheckCircle size={18} />
        )}
        {pendingAction === 'accept' ? 'Accepting…' : 'Accept invite'}
      </button>
      <button
        onClick={handleDecline}
        disabled={isPending}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#FECACA] bg-white text-[15px] font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-60"
      >
        {pendingAction === 'decline' ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <XCircle size={18} />
        )}
        {pendingAction === 'decline' ? 'Declining…' : 'Decline invite'}
      </button>
    </div>
  );
}
