'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RealNotification } from '@/hooks/useNotifications';

// ── Type → icon ───────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  COURSE_INVITE:            '🤝',
  COURSE_FEEDBACK:          '💬',
  COURSE_PUBLISHED:         '🚀',
  COURSE_REJECTED:          '❌',
  COURSE_CHANGES_REQUESTED: '✏️',
  NEW_ENROLLMENT:           '🎓',
  SYSTEM:                   '🔔',
};

function resolveHref(n: RealNotification): string | null {
  const d = n.data;
  if (!d) return '/dashboard';
  switch (n.type) {
    case 'COURSE_INVITE':
      // Handled inline — no navigation on click
      return null;
    case 'COURSE_FEEDBACK':
    case 'COURSE_PUBLISHED':
    case 'COURSE_REJECTED':
    case 'COURSE_CHANGES_REQUESTED':
      return d.courseId ? `/dashboard/instructor/courses/${d.courseId}` : '/dashboard';
    case 'NEW_ENROLLMENT':
      return d.courseId ? `/dashboard/instructor/courses/${d.courseId}?tab=analytics` : '/dashboard';
    default:
      return '/dashboard';
  }
}

// ── Invite action buttons ─────────────────────────────────────────────────────

function InviteActions({
  notification,
  onMarkRead,
  onClose,
}: {
  notification: RealNotification;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const token = notification.data?.token;

  if (!token) return null;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invite/course/${token}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to accept invite');
        return;
      }
      onMarkRead(notification.id);
      onClose();
      toast.success('Invite accepted! Welcome to the course team.');
      router.push(`/dashboard/instructor/courses/${json.courseId}`);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    onMarkRead(notification.id);
    toast('Invite declined.');
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={handleAccept}
        disabled={accepting}
        className="flex items-center gap-1 px-3 py-1 bg-primary text-white text-[11px] font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {accepting ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
        Accept
      </button>
      <button
        onClick={handleDecline}
        disabled={accepting}
        className="px-3 py-1 text-[11px] font-semibold text-text-mute border border-stroke rounded-lg hover:bg-background transition-colors disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}

// ── Legacy shape kept for backward-compatibility ──────────────────────────────
export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  emoji: string;
  isRead: boolean;
}

// ── Main dropdown ─────────────────────────────────────────────────────────────

interface Props {
  notifications: RealNotification[];
  isOpen: boolean;
  onMarkAllAsRead: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<Props> = ({
  notifications,
  isOpen,
  onMarkAllAsRead,
  onMarkRead,
  onClose,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleClick = (n: RealNotification) => {
    if (!n.readAt) onMarkRead(n.id);
    const href = resolveHref(n);
    if (href) {
      onClose();
      router.push(href);
    }
  };

  return (
    <div className="absolute top-[calc(100%+12px)] right-0 w-[clamp(300px,19.33vw,380px)] bg-white border border-[#E3E8F4] rounded-[12px] shadow-[6px_4px_4px_2px_rgba(195,196,246,0.15)] overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="h-[clamp(56px,3.7vw,64px)] px-[clamp(18px,1.33vw,24px)] flex items-center justify-between border-b border-[#E3E8F4]">
        <h3 className="text-[clamp(14px,0.92vw,16px)] font-semibold text-[#040B37]">Notifications</h3>
        {notifications.some((n) => !n.readAt) && (
          <button
            onClick={() => { onMarkAllAsRead(); }}
            className="flex items-center gap-1 text-[clamp(11px,0.69vw,12px)] font-medium text-[#1C4ED1] hover:underline"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[clamp(320px,23vw,420px)] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((n) => {
            const isUnread = !n.readAt;
            const href = resolveHref(n);
            const isInvite = n.type === 'COURSE_INVITE';
            const icon = TYPE_ICON[n.type] ?? '🔔';
            const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });

            return (
              <div
                key={n.id}
                className={`p-[clamp(12px,0.92vw,16px)] pr-[clamp(18px,1.33vw,24px)] flex items-start gap-[clamp(12px,0.92vw,16px)] relative group ${
                  isUnread ? 'bg-[#1C4ED1]/[0.02]' : ''
                } ${href && !isInvite ? 'cursor-pointer hover:bg-[#F4F6FB]/60 transition-colors' : ''}`}
                onClick={() => !isInvite && handleClick(n)}
              >
                {isUnread && (
                  <div className="absolute left-[clamp(6px,0.46vw,8px)] top-[22px] w-2 h-2 bg-[#1C4ED1] rounded-full shrink-0" />
                )}

                <div className="w-[clamp(32px,2.31vw,40px)] h-[clamp(32px,2.31vw,40px)] bg-[#F4F6FB] rounded-[12px] flex items-center justify-center text-[clamp(14px,0.92vw,16px)] shrink-0 mt-0.5">
                  {icon}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <p className={`text-[clamp(12px,0.81vw,14px)] leading-snug ${isUnread ? 'text-[#040B37] font-semibold' : 'text-[#4B5563] font-medium'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-[11px] text-[#6B7280] leading-snug line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[clamp(8px,0.46vw,10px)] text-[#9CA3AF] mt-0.5">{timeAgo}</p>

                  {isInvite && isUnread && (
                    <InviteActions
                      notification={n}
                      onMarkRead={onMarkRead}
                      onClose={onClose}
                    />
                  )}

                  {isInvite && !isUnread && (
                    <p className="text-[11px] text-text-mute mt-1 italic">Already actioned</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-[#9CA3AF] text-[14px]">
            No notifications yet
          </div>
        )}
      </div>
    </div>
  );
};
