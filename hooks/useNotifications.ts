'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  readAt: string | null;
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
      notifications: prev.notifications.map((n) => ({ ...n, readAt: n.readAt ?? now })),
      unreadCount: 0,
    }));
    await fetch('/api/notifications', { method: 'PATCH' });
  }, []);

  return { ...state, markRead, markAllRead, refetch: fetch_ };
}
