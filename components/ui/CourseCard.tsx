'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';

export interface CourseCardProps {
  id: string;
  slug?: string;
  title: string;
  category: string;
  description: string;
  lessons: string;
  duration: string;
  author: string;
  authorAvatar: string;
  image: string;
  trailerUrl?: string;
  rating?: number;
  reviews?: number;
  students?: string;
  level?: string;
  courseType?: string;
  priceLabel?: string;
  localizedPriceLabel?: string;
  view?: 'grid' | 'list';
  showLevel?: boolean;
  showMeta?: boolean;
  showRating?: boolean;
  showPrice?: boolean;
  thumbnailHover?: 'in' | 'out';
  presentation?: 'default' | 'homepage';
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'ui/ux design': 'from-violet-500 to-purple-700',
  'brand identity': 'from-orange-400 to-rose-600',
  'ai engineering': 'from-cyan-500 to-blue-700',
  'motion design': 'from-fuchsia-500 to-purple-700',
  'web development': 'from-blue-500 to-indigo-700',
  cybersecurity: 'from-green-500 to-emerald-700',
  'data science': 'from-amber-400 to-orange-600',
  design: 'from-purple-400 to-pink-600',
  brand: 'from-orange-400 to-rose-600',
  ai: 'from-cyan-400 to-blue-600',
  development: 'from-blue-500 to-indigo-700',
};

function categoryGradient(cat: string) {
  return CATEGORY_GRADIENTS[cat.toLowerCase()] ?? 'from-[#0035C1] to-[#0575FF]';
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function shouldSkipOptimization(src: string) {
  return src.endsWith('.svg') || src.startsWith('https://img.youtube.com');
}

function ratingLabel(rating: number, reviews: number) {
  if (rating <= 0 || reviews <= 0) return 'New';
  return rating.toFixed(1);
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      return pathParts.at(-1) ?? null;
    }
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  }
  return null;
}

export default function CourseCard({
  id,
  slug,
  title,
  category,
  description,
  lessons,
  duration,
  author,
  authorAvatar,
  image,
  trailerUrl,
  rating = 0,
  reviews = 0,
  students = '0',
  level = 'Beginner',
  courseType = 'Full Course',
  priceLabel,
  localizedPriceLabel,
  view = 'grid',
  showLevel = true,
  showMeta = true,
  showRating = true,
  showPrice = true,
  thumbnailHover = 'in',
  presentation = 'default',
}: CourseCardProps) {
  const isList = view === 'list';
  const isHomepage = presentation === 'homepage' && !isList;
  const [thumbErr, setThumbErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const gradient = categoryGradient(category);
  const displayPrice = priceLabel ?? 'Free';
  const displayRating = ratingLabel(rating, reviews);
  const youtubeId = trailerUrl ? extractYouTubeId(trailerUrl) : null;
  const thumbHoverClass =
    thumbnailHover === 'out'
      ? 'scale-[1.05] group-hover:scale-100'
      : 'group-hover:scale-[1.05]';

  const renderTrailerPreview = () => {
    if (!trailerUrl || !isPreviewing) return null;

    if (youtubeId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1`}
          title={`${title} trailer preview`}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="pointer-events-none absolute inset-0 z-[3] h-full w-full"
        />
      );
    }

    return (
      <video
        src={trailerUrl}
        muted
        autoPlay
        loop
        playsInline
        className="pointer-events-none absolute inset-0 z-[3] h-full w-full object-cover"
      />
    );
  };

  const renderThumbnail = (className: string) => (
    <div
      className={`bg-[#F4F6FB] relative rounded-[10px] overflow-hidden flex-shrink-0 outline-none ${className}`}
      onMouseEnter={() => {
        if (window.matchMedia('(hover: hover)').matches) setIsPreviewing(true);
      }}
      onMouseLeave={() => setIsPreviewing(false)}
    >
      {showLevel && (
        <span className="absolute left-3 top-3 z-10 max-w-[calc(100%-24px)] rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#1C4ED1] shadow-sm backdrop-blur-sm hidden sm:block">
          {courseType}
        </span>
      )}
      {trailerUrl && (
        <span className="absolute right-3 top-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-[#040B37]/70 text-white shadow-sm backdrop-blur-sm transition-opacity group-hover:flex">
          <Play size={14} fill="currentColor" />
        </span>
      )}
      {thumbErr ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col justify-end p-3`}>
          <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">
            {category}
          </span>
          <span className="text-white text-[12px] font-bold line-clamp-2 leading-snug">
            {title}
          </span>
        </div>
      ) : (
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover transition-transform duration-700 ease-out ${thumbHoverClass}`}
          onError={() => setThumbErr(true)}
          sizes={
            isList
              ? '(max-width: 768px) 76px, 240px'
              : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
          }
          unoptimized={shouldSkipOptimization(image)}
        />
      )}
      {renderTrailerPreview()}
    </div>
  );

  const renderAvatar = (size: string, className = '') => (
    <div className={`rounded-full overflow-hidden relative border border-stroke flex-shrink-0 bg-gray-100 ${size} ${className}`}>
      {avatarErr ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-white text-[8px] font-bold leading-none">
            {initials(author)}
          </span>
        </div>
      ) : (
        <Image
          src={authorAvatar}
          alt={author}
          fill
          className="object-cover"
          onError={() => setAvatarErr(true)}
          sizes={size.includes('20px') ? '20px' : '18px'}
          unoptimized
        />
      )}
    </div>
  );

  const renderRating = () => (
    <div className="flex items-center gap-1.5 font-jakarta">
      <span className="text-[13px] font-bold text-[#B4690E]">{displayRating}</span>
      {displayRating !== 'New' && (
        <span className="flex items-center gap-0.5 text-[#B4690E]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={12}
              fill="currentColor"
              strokeWidth={0}
              className={index < Math.round(rating) ? 'opacity-100' : 'opacity-25'}
            />
          ))}
        </span>
      )}
      <span className="text-[11px] font-medium text-text-mute">
        {displayRating === 'New' ? 'No reviews yet' : `(${reviews.toLocaleString()})`}
      </span>
    </div>
  );

  return (
    <Link href={`/courses/${slug ?? id}`} className="block h-full font-jakarta">
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
        className={`bg-white rounded-2xl border border-stroke-ii shadow-sm ${isHomepage ? 'hover:shadow-sm' : 'hover:shadow-xl'} hover:border-primary/20 transition-all duration-500 group cursor-pointer overflow-hidden ${
          isList
            ? 'flex flex-row p-3 md:p-4 gap-4 md:gap-6 items-center'
            : isHomepage
              ? 'flex flex-col p-2 pb-3 gap-2.5 h-full rounded-[12px]'
              : 'flex flex-col p-[8px] pb-[16px] gap-[16px] h-full'
        }`}
      >
        <div className={`flex flex-col gap-3 flex-shrink-0 ${isList ? 'max-w-[120px] md:max-w-none' : 'w-full'}`}>
          {renderThumbnail(isList ? 'h-[76px] w-[76px] md:h-[140px] md:w-[240px]' : isHomepage ? 'aspect-[136/96] w-full' : 'h-[216px] w-full')}

          {isList && (
            <div className="flex md:hidden flex-row items-center gap-2">
              {renderAvatar('w-[20px] h-[20px]')}
              <span className="text-[10px] font-medium text-text-body font-inter tracking-[-0.01em] truncate">
                {author}
              </span>
            </div>
          )}
        </div>

        <div className={`flex flex-col justify-between flex-grow min-w-0 ${isList ? 'py-0.5' : isHomepage ? 'px-1 min-h-[92px]' : 'px-[8px] min-h-[132px]'}`}>
          <div className={`flex flex-col ${isHomepage ? 'gap-1.5' : 'gap-2'}`}>
            {showMeta && (
              <span className={`block truncate whitespace-nowrap font-medium text-text-mute font-inter tracking-[-0.01em] ${isHomepage ? 'text-[10px] md:text-[11px]' : 'text-[10px] md:text-[12px]'}`}>
                {lessons} lessons{duration ? ` / ${duration}` : ''}{showLevel ? ` / ${level}` : ''}
              </span>
            )}

            <div className={`flex flex-col ${isHomepage ? 'gap-1' : 'gap-1.5'}`}>
              <h3
                className={`${isList ? 'text-[15px] md:text-xl' : isHomepage ? 'text-[13px] md:text-[14px]' : 'text-[16px]'} font-semibold text-navy leading-[1.3] tracking-[-0.01em] font-jakarta group-hover:text-primary transition-colors`}
              >
                {title}
              </h3>
              {isList && (
                <p className="hidden md:block text-[14px] text-text-body font-inter line-clamp-2 leading-relaxed opacity-70">
                  {description}
                </p>
              )}
              {showRating && renderRating()}
            </div>
          </div>

          <div className={`flex items-end justify-between gap-3 ${isList ? 'mt-3' : isHomepage ? 'mt-auto pt-2' : 'mt-auto pt-3'}`}>
            <div className={`items-center gap-2 min-w-0 ${isList ? 'hidden md:flex' : 'flex'}`}>
              {renderAvatar(isHomepage ? 'w-[16px] h-[16px] md:w-[18px] md:h-[18px]' : 'w-[18px] h-[18px] md:w-[20px] md:h-[20px]')}
              <span className={`${isHomepage ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-[12px]'} font-medium text-text-body font-inter tracking-[-0.01em] truncate`}>
                {author}
              </span>
            </div>

            {(showPrice || (isList && students)) && (
              <div className="flex flex-col items-end gap-0.5 text-right leading-tight shrink-0">
                {showPrice && (
                  <>
                    <p className="text-[13px] font-bold text-navy font-jakarta">{displayPrice}</p>
                    {localizedPriceLabel && (
                      <p className="max-w-[140px] truncate text-[10px] font-semibold text-text-mute font-inter">
                        {localizedPriceLabel}
                      </p>
                    )}
                  </>
                )}
                {isList && students && (
                  <p className="hidden xl:block text-[10px] font-semibold text-text-mute font-inter">
                    {students} learners
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
