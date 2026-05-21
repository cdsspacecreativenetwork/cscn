'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  rating?: number;
  reviews?: number;
  students?: string;
  level?: string;
  view?: 'grid' | 'list';
  showLevel?: boolean;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'ui/ux design':    'from-violet-500 to-purple-700',
  'brand identity':  'from-orange-400 to-rose-600',
  'ai engineering':  'from-cyan-500 to-blue-700',
  'motion design':   'from-fuchsia-500 to-purple-700',
  'web development': 'from-blue-500 to-indigo-700',
  'cybersecurity':   'from-green-500 to-emerald-700',
  'data science':    'from-amber-400 to-orange-600',
  'design':          'from-purple-400 to-pink-600',
  'brand':           'from-orange-400 to-rose-600',
  'ai':              'from-cyan-400 to-blue-600',
  'development':     'from-blue-500 to-indigo-700',
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
  rating = 4.8,
  reviews = 0,
  students = '1.2k',
  level = 'Beginner',
  view = 'grid',
  showLevel = true,
}: CourseCardProps) {
  const isList = view === 'list';
  const [thumbErr, setThumbErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const gradient = categoryGradient(category);

  const Thumbnail = ({ className }: { className: string }) => (
    <div className={`bg-[#F4F6FB] relative rounded-[10px] overflow-hidden flex-shrink-0 ${className}`}>
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
          className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
          onError={() => setThumbErr(true)}
          sizes={
            isList
              ? "(max-width: 768px) 76px, 240px"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          }
          unoptimized={shouldSkipOptimization(image)}
        />
      )}
    </div>
  );

  const Avatar = ({ size, className = '' }: { size: string; className?: string }) => (
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
          sizes={size.includes('20px') ? "20px" : "18px"}
          unoptimized
        />
      )}
    </div>
  );

  return (
    <Link href={`/courses/${slug ?? id}`} className="block h-full font-jakarta">
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
        className={`bg-white rounded-2xl border border-stroke-ii shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group cursor-pointer overflow-hidden ${
          isList
            ? 'flex flex-row p-3 md:p-4 gap-4 md:gap-6 items-center'
            : 'flex flex-col p-[8px] pb-[16px] gap-[16px] h-full'
        }`}
      >
        {/* Thumbnail + mobile-list instructor */}
        <div className={`flex flex-col gap-3 flex-shrink-0 ${isList ? 'max-w-[120px] md:max-w-none' : 'w-full'}`}>
          <Thumbnail
            className={
              isList
                ? 'h-[76px] w-[76px] md:h-[140px] md:w-[240px]'
                : 'h-[216px] w-full'
            }
          />

          {isList && (
            <div className="flex md:hidden flex-row items-center gap-2">
              <Avatar size="w-[20px] h-[20px]" />
              <span className="text-[10px] font-medium text-text-body font-inter tracking-[-0.01em] truncate">
                {author}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col justify-between flex-grow ${isList ? 'py-0.5 min-w-0' : 'px-[8px] min-h-[110px]'}`}>
          <div className="flex flex-col gap-1 md:gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-[12px] font-medium text-text-mute font-inter tracking-[-0.01em]">
                {lessons} lessons{duration ? <span className="hidden md:inline"> / {duration}</span> : null}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3
                className={`${isList ? 'text-[15px] md:text-xl' : 'text-[16px]'} font-semibold text-navy leading-[1.3] tracking-[-0.01em] font-jakarta group-hover:text-primary transition-colors`}
              >
                {title}
              </h3>
              {isList && (
                <p className="hidden md:block text-[14px] text-text-body font-inter line-clamp-2 leading-relaxed opacity-70">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between ${isList ? 'mt-2 md:mt-4' : 'mt-auto pt-3'}`}>
            <div className={`items-center gap-2 ${isList ? 'hidden md:flex' : 'flex'}`}>
              <Avatar size="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" />
              <span className="text-[11px] md:text-[12px] font-medium text-text-body font-inter tracking-[-0.01em]">
                {author}
              </span>
            </div>

            {isList && (
              <div className="flex items-center gap-4 md:gap-6 ml-auto md:ml-0">
                <div className="hidden sm:flex items-center gap-1 font-jakarta">
                  <span className="text-[13px] font-bold text-navy">★ {rating > 0 ? rating.toFixed(1) : 'New'}</span>
                  <span className="text-[11px] text-text-body">({reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 font-inter">
                  {showLevel && (
                    <span className="hidden md:inline px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider rounded-sm">
                      {level}
                    </span>
                  )}
                  <button className="px-3 md:px-4 py-1 md:py-1.5 bg-navy text-white text-[12px] md:text-sm font-medium rounded-sm hover:bg-primary transition-colors">
                    Enroll
                  </button>
                </div>
              </div>
            )}

            {!isList && showLevel && (
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-sm font-inter">
                {level}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
