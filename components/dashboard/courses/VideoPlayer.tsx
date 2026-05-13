'use client';

import Link from 'next/link';

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
  canWatch: boolean;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  courseSlug: string;
  lessonTitle: string;
}

export const VideoPlayer = ({
  videoUrl,
  canWatch,
  isAuthenticated,
  isEnrolled,
  courseSlug,
  lessonTitle,
}: VideoPlayerProps) => {
  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;

  if (canWatch && youtubeId) {
    return (
      <div className="relative w-full aspect-video max-h-[472px] h-full bg-black rounded-2xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={lessonTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
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
      {/* Blurred thumbnail hint */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0035C1]/40 to-[#0575FF]/20" />

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
          className="px-8 py-3 bg-gradient-to-r from-[#0035C1] to-[#0575FF] text-white font-semibold rounded-full hover:opacity-90 transition-opacity text-sm font-jakarta"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
};
