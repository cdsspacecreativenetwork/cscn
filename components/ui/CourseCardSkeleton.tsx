'use client';

import React from 'react';

interface CourseCardSkeletonProps {
  view?: 'grid' | 'list';
}

export default function CourseCardSkeleton({ view = 'grid' }: CourseCardSkeletonProps) {
  const isList = view === 'list';

  return (
    <div className={`bg-white rounded-2xl border border-stroke-ii shadow-sm overflow-hidden ${
      isList ? 'flex flex-row p-4 gap-6 items-center' : 'flex flex-col p-2 pb-5 gap-4 h-full'
    }`}>
      {/* Thumbnail Skeleton */}
      <div className={`bg-gray-100 rounded-[10px] flex-shrink-0 animate-shimmer ${
        isList ? 'h-[8.75rem] w-[15rem]' : 'h-[13.5rem] w-full'
      }`} />

      {/* Content Skeleton */}
      <div className={`flex flex-col justify-between flex-grow ${isList ? 'py-2' : 'px-2'}`}>
        <div className="flex flex-col gap-2.5">
          <div className="h-3 w-24 bg-gray-100 rounded-full mb-1 animate-shimmer" />
          <div className="h-6 w-full bg-gray-100 rounded-md animate-shimmer" />
          <div className="h-6 w-2/3 bg-gray-100 rounded-md animate-shimmer" />
        </div>
        
        {/* Footer Skeleton */}
        <div className={`flex items-center justify-between ${isList ? 'mt-4' : 'mt-auto pt-4'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 animate-shimmer" />
            <div className="h-3 w-20 bg-gray-100 rounded-full animate-shimmer" />
          </div>
          {isList && (
            <div className="h-4 w-16 bg-gray-100 rounded-full animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
}
