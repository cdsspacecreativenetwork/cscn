'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface CourseHeroProps {
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  instructorImage: string;
  publishDate: string;
  videoThumbnail: string;
  videoUrl?: string;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id && id.length === 11 ? id : null;
      }

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const candidate = pathParts.at(-1);

      if (
        candidate &&
        ['embed', 'shorts', 'live', 'v'].includes(pathParts[0] ?? '') &&
        candidate.length === 11
      ) {
        return candidate;
      }
    }
  } catch {
    const trimmed = url.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

export const CourseHero: React.FC<CourseHeroProps> = ({
  courseTitle,
  courseDescription,
  instructorName,
  instructorImage,
  publishDate,
  videoThumbnail,
  videoUrl = 'https://res.cloudinary.com/emediong/video/upload/v1778071570/CDS_Space_Branding_Agency_hhhxkq.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const youtubeId = extractYouTubeId(videoUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const clearControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    clearControlsTimeout();

    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 1800);
    }
  }, [clearControlsTimeout, isPlaying]);

  useEffect(() => {
    if (!youtubeId) {
      revealControls();
    }

    return () => clearControlsTimeout();
  }, [clearControlsTimeout, revealControls, youtubeId]);

  const playVideo = useCallback(async () => {
    if (!videoRef.current) return;

    await videoRef.current.play();
    setIsPlaying(true);
    revealControls();
  }, [revealControls]);

  const togglePlayback = useCallback(async () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      await playVideo();
      return;
    }

    videoRef.current.pause();
    setIsPlaying(false);
    setShowControls(true);
    clearControlsTimeout();
  }, [clearControlsTimeout, playVideo]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;

    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    revealControls();
  }, [revealControls]);

  const toggleFullscreen = useCallback(async () => {
    if (!videoRef.current) return;

    revealControls();
    await videoRef.current.requestFullscreen?.();
  }, [revealControls]);

  const handleSurfacePress = useCallback(async () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      await playVideo();
      return;
    }

    revealControls();
  }, [playVideo, revealControls]);

  return (
    <div className="bg-[#040B37] w-full px-[clamp(16px,5vw,200px)] py-[clamp(16px,2vw,24px)] relative overflow-hidden">
      <div
        onMouseMove={!youtubeId ? revealControls : undefined}
        onTouchStart={!youtubeId ? revealControls : undefined}
        className="relative w-full aspect-video md:h-[clamp(400px,46.3vw,800px)] border-[clamp(2px,0.46vw,8px)] border-[#0E1648] rounded-[clamp(12px,1.39vw,24px)] overflow-hidden bg-black group shadow-2xl"
      >
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`}
            title={courseTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            <button
              type="button"
              onClick={handleSurfacePress}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={isPlaying ? 'Show video controls' : 'Play course trailer'}
            />

            <video
              ref={videoRef}
              src={videoUrl}
              poster={videoThumbnail}
              className="h-full w-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setShowControls(true);
                clearControlsTimeout();
              }}
              playsInline
            />
          </>
        )}

        {!isPlaying && !youtubeId && (
          <div className="hidden md:block absolute left-[clamp(20px,2.78vw,48px)] bottom-[clamp(40px,5.56vw,96px)] w-full max-w-[280px] mlg:max-w-[clamp(300px,28.07vw,485px)] backdrop-blur-md bg-[rgba(0,0,0,0.64)] p-4 mlg:p-[clamp(16px,1.39vw,24px)] rounded-[16px] border border-white/10 z-20 transition-opacity duration-500">
            <h1 className="text-[16px] mlg:text-[clamp(20px,1.85vw,32px)] font-bold text-white tracking-tight leading-[1.24] mb-3 mlg:mb-6">
              {courseTitle}
            </h1>
            <p className="text-[13px] mlg:text-[clamp(14px,0.92vw,16px)] font-medium text-[#9CA3AF] leading-relaxed mb-4 mlg:mb-6 line-clamp-2 mlg:line-clamp-none">
              {courseDescription}
            </p>

            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 mlg:w-8 mlg:h-8 rounded-full overflow-hidden border border-white/20">
                <Image src={instructorImage} alt={instructorName} fill className="object-cover" />
              </div>
              <div className="flex items-center gap-2 text-white text-[12px] mlg:text-[14px]">
                <span className="font-semibold">{instructorName}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full" />
                <span className="text-[#9CA3AF] text-[11px] mlg:text-[13px]">{publishDate}</span>
              </div>
            </div>
          </div>
        )}

        {!isPlaying && !youtubeId && (
          <div className="md:hidden absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="h-14 w-14 rounded-full bg-[#1C4ED1]/92 shadow-2xl flex items-center justify-center backdrop-blur-sm">
              <div className="relative h-6 w-6 ml-0.5">
                <Image src="/assets/video-controls/play.svg" alt="Play" fill className="brightness-200" />
              </div>
            </div>
          </div>
        )}

        {!youtubeId && (
          <div
            className={`absolute bottom-3 right-3 md:bottom-5 md:right-5 z-20 flex items-center gap-2 rounded-full border border-white/12 bg-[rgba(4,11,55,0.74)] px-2.5 py-2 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.32)] transition-all duration-300 ${
              !isPlaying
                ? 'opacity-100'
                : showControls
                  ? 'opacity-100 translate-y-0'
                  : 'pointer-events-none opacity-0 translate-y-2'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C4ED1] text-white transition-transform active:scale-95"
              aria-label={isPlaying ? 'Pause trailer' : 'Play trailer'}
            >
              <div className="relative h-4 w-4">
                <Image
                  src={isPlaying ? '/assets/video-controls/pause.svg' : '/assets/video-controls/play.svg'}
                  alt=""
                  fill
                  className="object-contain brightness-200"
                />
              </div>
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/8 transition-colors hover:bg-white/14 ${
                isMuted ? 'opacity-55' : 'opacity-100'
              }`}
              aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
            >
              <div className="relative h-4 w-4">
                <Image src="/assets/video-controls/volume.svg" alt="" fill className="object-contain" />
              </div>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 transition-colors hover:bg-white/14"
              aria-label="Open trailer in fullscreen"
            >
              <div className="relative h-4 w-4">
                <Image src="/assets/video-controls/fullscreen.svg" alt="" fill className="object-contain" />
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="md:hidden mt-6 flex flex-col gap-4">
        <h1 className="text-[24px] font-bold text-white leading-[1.2]">{courseTitle}</h1>
        <p className="text-[14px] text-[#9CA3AF] leading-relaxed">{courseDescription}</p>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
            <Image src={instructorImage} alt={instructorName} fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[14px] font-semibold">{instructorName}</span>
            <span className="text-[#9CA3AF] text-[12px]">{publishDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
