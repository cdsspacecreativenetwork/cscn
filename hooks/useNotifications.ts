'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  seenAt: string | null;
  readAt: string | null;
  actionRequired: boolean;
  actionStatus: 'PENDING' | 'COMPLETED' | 'DISMISSED' | 'EXPIRED' | null;
  actionLabel: string | null;
  actionUrl: string | null;
  expiresAt: string | null;
  emailSentAt: string | null;
  emailFailedAt: string | null;
  createdAt: string;
}

interface NotificationsState {
  notifications: RealNotification[];
  unreadCount: number;
  loading: boolean;
}

const POLL_INTERVAL = 45_000; // 45 seconds

export function useNotifications() {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setState({ notifications: json.notifications, unreadCount: json.unreadCount, loading: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetch_();
    intervalRef.current = setInterval(fetch_, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch_]);

  const markRead = useCallback(async (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => {
        const shouldRead =
          !n.actionRequired ||
          n.actionStatus === 'COMPLETED' ||
          n.actionStatus === 'DISMISSED' ||
          n.actionStatus === 'EXPIRED';
        return shouldRead ? { ...n, seenAt: n.seenAt ?? now, readAt: n.readAt ?? now } : n;
      }),
      unreadCount: prev.notifications.filter((n) => !n.readAt && n.actionRequired && n.actionStatus === 'PENDING').length,
    }));
    const res = await fetch('/api/notifications', { method: 'PATCH' });
    if (res.ok) {
      await fetch_();
    }
  }, [fetch_]);

  const markVisibleAsSeen = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    const idSet = new Set(ids);

    setState((prev) => {
      let readDelta = 0;
      const notifications = prev.notifications.map((n) => {
        if (!idSet.has(n.id)) return n;

        const shouldAutoRead =
          !n.actionRequired ||
          n.actionStatus === 'COMPLETED' ||
          n.actionStatus === 'DISMISSED' ||
          n.actionStatus === 'EXPIRED';

        if (shouldAutoRead && !n.readAt) readDelta += 1;

        return {
          ...n,
          seenAt: n.seenAt ?? now,
          readAt: shouldAutoRead ? n.readAt ?? now : n.readAt,
        };
      });

      return {
        ...prev,
        notifications,
        unreadCount: Math.max(0, prev.unreadCount - readDelta),
      };
    });

    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (res.ok) {
      const json = await res.json();
      if (typeof json.unreadCount === 'number') {
        setState((prev) => ({ ...prev, unreadCount: json.unreadCount }));
      }
    }
  }, []);

  return { ...state, markRead, markAllRead, markVisibleAsSeen, refetch: fetch_ };
}
