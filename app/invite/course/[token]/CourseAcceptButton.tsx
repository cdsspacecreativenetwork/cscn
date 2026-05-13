'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  token: string;
}

export function CourseAcceptButton({ token }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
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
      }
    });
  };

  return (
    <button
      onClick={handleAccept}
      disabled={isPending}
      className="w-full h-[52px] flex items-center justify-center gap-2 bg-[#1C4ED1] hover:bg-[#163BB1] text-white rounded-[12px] text-[15px] font-semibold transition-all disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <CheckCircle size={18} />
      )}
      {isPending ? 'Accepting…' : 'Accept Invite'}
    </button>
  );
}
