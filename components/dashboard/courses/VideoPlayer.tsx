'use client';

import { useCallback, useEffect, useRef, useState, type ElementRef } from 'react';
import Link from 'next/link';
import MuxPlayer from '@mux/mux-player-react';
import type { PlayerTimestamp } from '@/types/player';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

interface VideoPlayerProps {
  videoUrl: string | null;
  muxPlaybackId: string | null;
  muxToken: string | null;
  canWatch: boolean;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  courseSlug: string;
  lessonTitle: string;
  lessonId: string;
  timestamps?: PlayerTimestamp[];
  initialProgress?: {
    lastSeekTime: number;
    percentComplete: number;
    isCompleted: boolean;
  } | null;
  seekRequest?: { id: number; seconds: number } | null;
  onPlaybackTimeChange?: (seconds: number) => void;
}

function timestampToSeconds(value: string) {
  const parts = value.split(':').map((part) => Number(part.trim()));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export const VideoPlayer = ({
  videoUrl,
  muxPlaybackId,
  muxToken,
  canWatch,
  isAuthenticated,
  isEnrolled,
  courseSlug,
  lessonTitle,
  lessonId,
  timestamps = [],
  initialProgress,
  seekRequest,
  onPlaybackTimeChange,
}: VideoPlayerProps) => {
  const muxRef = useRef<ElementRef<typeof MuxPlayer> | null>(null);
  const lastSavedAtRef = useRef(0);
  const hasResumedRef = useRef(false);
  const [resumeLabel, setResumeLabel] = useState<string | null>(() => {
    if (!initialProgress?.lastSeekTime || initialProgress.isCompleted) return null;
    const minutes = Math.floor(initialProgress.lastSeekTime / 60);
    const seconds = Math.floor(initialProgress.lastSeekTime % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });
  const [youtubeStart, setYoutubeStart] = useState(0);

  const saveProgress = useCallback(async (force = false) => {
    if (!isEnrolled || !lessonId || !muxRef.current) return;

    const currentTime = Number(muxRef.current.currentTime ?? 0);
    const duration = Number(muxRef.current.duration ?? 0);
    if (!Number.isFinite(currentTime) || currentTime < 0) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const now = Date.now();
    const percentComplete = Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));

    if (!force && percentComplete < 95 && now - lastSavedAtRef.current < 15000) return;
    lastSavedAtRef.current = now;

    await fetch(`/api/lessons/${lessonId}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastSeekTime: currentTime,
        percentComplete,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [isEnrolled, lessonId]);

  const resumePlayback = useCallback(() => {
    if (hasResumedRef.current || !muxRef.current || !initialProgress?.lastSeekTime) return;
    if (initialProgress.isCompleted) return;

    const duration = Number(muxRef.current.duration ?? 0);
    const target = Math.max(0, initialProgress.lastSeekTime);

    if (Number.isFinite(duration) && duration > 0 && target < duration - 5) {
      muxRef.current.currentTime = target;
      hasResumedRef.current = true;
    }
  }, [initialProgress]);

  const seekToSeconds = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return;
    setYoutubeStart(seconds);
    onPlaybackTimeChange?.(seconds);
    if (!muxRef.current) return;
    muxRef.current.currentTime = seconds;
    muxRef.current.play?.();
  }, [onPlaybackTimeChange]);

  const seekToTimestamp = useCallback((value: string) => {
    const seconds = timestampToSeconds(value);
    if (seconds === null) return;
    seekToSeconds(seconds);
  }, [seekToSeconds]);

  useEffect(() => {
    if (!seekRequest) return;
    const timeout = window.setTimeout(() => seekToSeconds(seekRequest.seconds), 0);
    return () => window.clearTimeout(timeout);
  }, [seekRequest, seekToSeconds]);

  const timestampList = timestamps.length > 0 && (
    <div className="mt-3 rounded-[8px] border border-[#E3E8F4] bg-white p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#1C4ED1]">Lesson timestamps</p>
      <div className="flex flex-col gap-1">
        {timestamps.map((item, index) => (
          <button
            key={`${item.time}-${index}`}
            type="button"
            onClick={() => seekToTimestamp(item.time)}
            className="flex items-center gap-3 rounded-[8px] px-2 py-2 text-left text-sm font-semibold text-navy transition-colors hover:bg-[#F4F6FB]"
          >
            <span className="w-14 shrink-0 rounded-[8px] bg-primary/10 px-2 py-1 text-center text-xs font-bold text-primary">
              {item.time}
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    return () => {
      void saveProgress(true);
    };
  }, [saveProgress]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void saveProgress(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void saveProgress(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveProgress]);

  // Mux (preferred)
  if (canWatch && muxPlaybackId) {
    return (
      <div>
        <div className="relative w-full aspect-video max-h-[472px] h-full bg-black rounded-2xl overflow-hidden shadow-lg">
          {resumeLabel && (
            <div className="absolute left-4 top-4 z-10 rounded-[8px] bg-[#040B37]/85 px-3 py-2 text-xs font-semibold text-white shadow-lg">
              Resumed at {resumeLabel}
            </div>
          )}
          <MuxPlayer
            ref={muxRef}
            playbackId={muxPlaybackId}
            tokens={{ playback: muxToken ?? undefined }}
            streamType="on-demand"
            title={lessonTitle}
            onLoadedMetadata={resumePlayback}
            onCanPlay={resumePlayback}
            onTimeUpdate={() => {
              setResumeLabel(null);
              onPlaybackTimeChange?.(Number(muxRef.current?.currentTime ?? 0));
              void saveProgress(false);
            }}
            onPause={() => void saveProgress(true)}
            onEnded={() => void saveProgress(true)}
            style={{ width: '100%', height: '100%', aspectRatio: '16/9' }}
            className="absolute inset-0 w-full h-full"
          />
        </div>
        {timestampList}
      </div>
    );
  }

  // YouTube fallback (legacy lessons)
  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
  if (canWatch && youtubeId) {
    return (
      <div>
        <div className="relative w-full aspect-video max-h-[472px] h-full bg-black rounded-2xl overflow-hidden shadow-lg">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&start=${youtubeStart}`}
            title={lessonTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
        {timestampList}
      </div>
    );
  }

  // Gate overlay
  const ctaHref = !isAuthenticated
    ? `/signin?callbackUrl=/courses/${courseSlug}/watch/current`
    : `/courses/${courseSlug}`;

  const ctaLabel = !isAuthenticated ? 'Sign in to watch' : !isEnrolled ? 'Enroll to watch' : 'Locked';

  const lockIcon = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="relative w-full aspect-video max-h-[472px] h-full bg-[#0A0E1A] rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
      <div className="absolute inset-0 bg-linear-to-br from-[#0035C1]/40 to-[#0575FF]/20" />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
        {lockIcon}
        <div className="flex flex-col gap-2">
          <p className="text-white font-semibold text-lg font-jakarta">This lesson is locked</p>
          <p className="text-white/60 text-sm font-inter">
            {!isAuthenticated
              ? 'Create a free account or sign in to access this lesson.'
              : 'Enroll in this course to unlock all lessons.'}
          </p>
        </div>
        <Link
          href={ctaHref}
          className="px-8 py-3 bg-linear-to-r from-[#0035C1] to-[#0575FF] text-white font-semibold rounded-full hover:opacity-90 transition-opacity text-sm font-jakarta"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
};
