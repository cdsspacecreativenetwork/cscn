'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CheckCheck, MessageSquare, Send, Loader2, Star } from 'lucide-react';
import { postFeedbackAction } from '@/actions/admin-courses';
import { markFeedbackAddressedAction, resolveFeedbackAction } from '@/actions/instructor';
import { toast } from 'sonner';

interface FeedbackAuthor {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface FeedbackItem {
  id: string;
  rawId?: string;
  source?: 'COURSE_FEEDBACK' | 'ADMIN_REVIEW' | 'STUDENT_REVIEW';
  status?: string | null;
  rating?: number | null;
  body: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  author: FeedbackAuthor;
}

interface Props {
  courseId: string;
  isAdmin: boolean;
  currentUserId: string;
  initialItems?: FeedbackItem[];
}

function Avatar({ author }: { author: FeedbackAuthor }) {
  const initials = (author.name ?? 'A').charAt(0).toUpperCase();
  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-primary/10">
      {author.image ? (
        <Image src={author.image} alt="" fill className="object-cover" unoptimized />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
          {initials}
        </span>
      )}
    </div>
  );
}

function FeedbackCard({
  item, courseId, isAdmin, currentUserId, onResolved,
}: {
  item: FeedbackItem;
  courseId: string;
  isAdmin: boolean;
  currentUserId: string;
  onResolved: (id: string) => void;
}) {
  const [resolving, startResolve] = useTransition();
  const isResolved = !!item.resolvedAt;
  const isOwnItem = item.author.id === currentUserId;
  const source = item.source ?? 'COURSE_FEEDBACK';
  const isStudentReview = source === 'STUDENT_REVIEW';
  const isAdminReview = source === 'ADMIN_REVIEW';
  const canResolve = !isResolved && !isAdmin && !isOwnItem && !isStudentReview;

  const sourceLabel =
    source === 'ADMIN_REVIEW'
      ? item.status === 'REJECTED'
        ? 'Admin review: rejected'
        : item.status === 'CHANGES_REQUESTED'
          ? 'Admin review: changes requested'
          : 'Admin review'
      : source === 'STUDENT_REVIEW'
        ? 'Student review'
        : 'Course feedback';

  const sourceClass =
    source === 'ADMIN_REVIEW'
      ? item.status === 'REJECTED'
        ? 'bg-red-50 text-red-600'
        : 'bg-amber-50 text-amber-700'
      : source === 'STUDENT_REVIEW'
        ? 'bg-[#EEF3FF] text-[#1C4ED1]'
        : 'bg-primary/10 text-primary';

  const handleResolve = () => {
    startResolve(async () => {
      try {
        if (isAdminReview) {
          await markFeedbackAddressedAction(item.rawId ?? item.id.replace(/^review:/, ''), courseId);
        } else {
          await resolveFeedbackAction(item.rawId ?? item.id.replace(/^feedback:/, ''), courseId);
        }
        onResolved(item.id);
        toast.success('Feedback marked as resolved.');
      } catch {
        toast.error('Failed to resolve feedback.');
      }
    });
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 transition-all ${
      isResolved || isStudentReview ? 'border-stroke' : 'border-amber-200 shadow-sm'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar author={item.author} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy truncate">
              {item.author.name ?? 'Admin'}
              <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                {item.author.role === 'ADMIN' || item.author.role === 'SUPER_ADMIN' ? 'Admin' : 'Instructor'}
              </span>
            </p>
            <p className="text-[11px] text-text-mute">
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {item.rating ? (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              <Star size={12} className="fill-current" /> {item.rating}/5
            </span>
          ) : null}
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${sourceClass}`}>
            {sourceLabel}
          </span>
        {isResolved ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
            <CheckCheck size={12} /> Resolved
          </span>
        ) : isStudentReview ? null : (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
            Open
          </span>
        )}
        </div>
      </div>

      <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap">{item.body}</p>

      {canResolve && (
        <div className="flex justify-end pt-1">
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-all disabled:opacity-50"
          >
            {resolving ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
            Mark as resolved
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeedbackTab({ courseId, isAdmin, currentUserId, initialItems }: Props) {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [body, setBody] = useState('');
  const [posting, startPost] = useTransition();

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/feedback`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!initialItems) {
      fetchFeedback();
    }
  }, [fetchFeedback, initialItems]);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    startPost(async () => {
      const res = await postFeedbackAction(courseId, body.trim());
      if (res.error) { toast.error(res.error); return; }
      toast.success('Feedback posted.');
      setBody('');
      fetchFeedback();
    });
  };

  const handleResolved = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, resolvedAt: new Date().toISOString(), resolvedBy: currentUserId } : item
      )
    );
  };

  const actionItems = items.filter((i) => i.source !== 'STUDENT_REVIEW');
  const studentReviews = items.filter((i) => i.source === 'STUDENT_REVIEW');
  const open = actionItems.filter((i) => !i.resolvedAt);
  const resolved = actionItems.filter((i) => i.resolvedAt);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-stroke rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-background" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-background" />
                <div className="h-2.5 w-20 rounded bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded bg-background" />
              <div className="h-3 w-4/5 rounded bg-background" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Compose — admin only */}
      {isAdmin && (
        <div className="bg-white border border-stroke rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-navy mb-3">Post feedback for instructor</h2>
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe what needs to be changed or improved…"
              rows={4}
              className="w-full px-4 py-3 text-sm text-navy border border-stroke rounded-xl resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-text-mute transition-all"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || !body.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Post Feedback
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Open items */}
      {open.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
            Open
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {open.length}
            </span>
          </h2>
          <div className="space-y-3">
            {open.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                courseId={courseId}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onResolved={handleResolved}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <MessageSquare size={24} className="text-emerald-500" />
          </div>
          <p className="font-semibold text-navy">No feedback yet</p>
          <p className="text-sm text-text-mute max-w-xs">
            {isAdmin
              ? 'Post feedback above to request changes from the instructor.'
              : 'No feedback from the admin yet. Check back after your course is reviewed.'}
          </p>
        </div>
      )}

      {studentReviews.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
            Student reviews
            <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 text-[11px] font-bold text-[#1C4ED1]">
              {studentReviews.length}
            </span>
          </h2>
          <div className="space-y-3">
            {studentReviews.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                courseId={courseId}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onResolved={handleResolved}
              />
            ))}
          </div>
        </section>
      )}

      {/* Resolved items (collapsed section) */}
      {resolved.length > 0 && (
        <details className="group">
          <summary className="text-sm font-semibold text-text-mute cursor-pointer select-none list-none flex items-center gap-2 py-2">
            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
            Resolved ({resolved.length})
          </summary>
          <div className="space-y-3 mt-3">
            {resolved.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                courseId={courseId}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onResolved={handleResolved}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
