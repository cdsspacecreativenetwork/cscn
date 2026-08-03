'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface HomepageReviewCard {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  content: string;
  rating: number | null;
}

const ReviewCard = ({ review }: { review: HomepageReviewCard }) => (
  <div className="bg-[#E9EEF8] p-6 rounded-[18px] mb-5 flex flex-col gap-6 w-full">
    <div className="flex items-center gap-3">
      <div className="relative w-11 h-11 rounded-[16px] overflow-hidden bg-white">
        {review.avatarUrl ? (
          <Image src={review.avatarUrl} alt={review.name} fill className="object-cover" sizes="44px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1C4ED1]/10 text-[16px] font-black text-[#1C4ED1]">
            {review.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-[18px] font-semibold text-[#040B37] font-inter">{review.name}</h4>
        {review.role && <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#1C4ED1]">{review.role}</p>}
      </div>
    </div>
    <p className="text-[16px] font-medium text-[#4B5563] leading-relaxed font-inter">
      {review.content}
    </p>
  </div>
);

const InfiniteColumn = ({ reviews, duration = 20, reverse = false }: { reviews: HomepageReviewCard[], duration?: number, reverse?: boolean }) => {
  const [isPaused, setIsPaused] = useState(false);
  const doubledReviews = [...reviews, ...reviews, ...reviews, ...reviews];

  return (
    <div
      className="relative overflow-hidden h-[600px] flex flex-col group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        style={{
          animation: `${reverse ? 'scrollDown' : 'scrollUp'} ${duration}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
        className="flex flex-col"
      >
        {doubledReviews.map((review, i) => (
          <ReviewCard key={`${review.id}-${i}`} review={review} />
        ))}
      </div>
    </div>
  );
};

export default function ReviewsSection({ reviews }: { reviews: HomepageReviewCard[] }) {
  if (reviews.length === 0) return null;

  const columnOne = reviews.filter((_, index) => index % 3 === 0);
  const columnTwo = reviews.filter((_, index) => index % 3 === 1);
  const columnThree = reviews.filter((_, index) => index % 3 === 2);
  const safeColumnOne = columnOne.length > 0 ? columnOne : reviews;
  const safeColumnTwo = columnTwo.length > 0 ? columnTwo : reviews;
  const safeColumnThree = columnThree.length > 0 ? columnThree : reviews;

  return (
    <section className="py-24 bg-background overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}} />
      <div className="mx-auto w-full max-w-[83rem] px-4">
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <h2 className="text-[48px] font-semibold text-[#040B37] leading-[1.24] tracking-tight font-inter">
            What learners are saying
          </h2>
          <p className="text-[16px] font-medium text-[#4B5563] max-w-[596px] leading-relaxed font-inter">
            Real feedback from the CSCN learning community.
          </p>
        </div>

        <div className="relative bg-background">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent z-10 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-[600px]">
            <InfiniteColumn reviews={safeColumnOne} duration={25} />
            <div className="hidden md:block">
              <InfiniteColumn reviews={safeColumnTwo} duration={35} reverse />
            </div>
            <div className="hidden lg:block">
              <InfiniteColumn reviews={safeColumnThree} duration={30} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
