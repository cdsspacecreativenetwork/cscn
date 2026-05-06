'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface Review {
  name: string;
  role: string;
  avatar: string;
  content: string;
}

// Using real faces from pravatar
const REVIEWS: Review[] = [
  {
    name: 'Sarah Jenkins',
    role: 'Product Designer',
    avatar: 'https://i.pravatar.cc/150?img=5',
    content: 'The UI/UX course on CSCN completely transformed how I approach design. The practical lessons helped me land my first junior design role within months!'
  },
  {
    name: 'Michael Chen',
    role: 'Front-End Developer',
    avatar: 'https://i.pravatar.cc/150?img=11',
    content: 'I used to struggle with bridging the gap between design and development. The web development courses here gave me the exact frameworks I needed to build pixel-perfect UIs.'
  },
  {
    name: 'Elena Rodriguez',
    role: 'Freelance Designer',
    avatar: 'https://i.pravatar.cc/150?img=9',
    content: 'Honest Ernest\'s Figma course is incredible! The advanced prototyping and component strategies saved me hundreds of hours on my client projects.'
  },
  {
    name: 'David Smith',
    role: 'AI Enthusiast',
    avatar: 'https://i.pravatar.cc/150?img=12',
    content: 'Barry\'s AI integration course is a game changer. I never thought I could automate so much of my workflow. Truly the best investment I\'ve made in my career.'
  },
  {
    name: 'Jessica Wong',
    role: 'Brand Strategist',
    avatar: 'https://i.pravatar.cc/150?img=20',
    content: 'The Brand Positioning masterclass by Chris John gave me the confidence to pitch to international clients. The curriculum is incredibly detailed and easy to follow.'
  },
  {
    name: 'Marcus Thorne',
    role: 'Senior UX Researcher',
    avatar: 'https://i.pravatar.cc/150?img=33',
    content: 'The quality of instruction on CSCN is unmatched. You learn real-world skills from actual industry leaders, not just theoretical concepts. Highly recommended!'
  }
];

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="bg-[#EAEEF7] p-6 rounded-[24px] mb-5 flex flex-col gap-6 w-full cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="relative w-11 h-11 rounded-[16px] overflow-hidden bg-white">
        <Image src={review.avatar} alt={review.name} fill className="object-cover" />
      </div>
      <h4 className="text-[18px] font-semibold text-[#040B37] font-inter">{review.name}</h4>
    </div>
    <p className="text-[16px] font-medium text-[#4B5563] leading-relaxed font-inter">
      {review.content}
    </p>
  </div>
);

const InfiniteColumn = ({ reviews, duration = 20, reverse = false }: { reviews: Review[], duration?: number, reverse?: boolean }) => {
  const [isPaused, setIsPaused] = useState(false);
  
  // Double the reviews to ensure seamless scrolling
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
          <ReviewCard key={i} review={review} />
        ))}
      </div>
    </div>
  );
};

export default function ReviewsSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
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
      <div className="container max-w-[1200px]">
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <h2 className="text-[48px] font-semibold text-[#040B37] leading-[1.24] tracking-tight font-inter">
            Discover your next skill
          </h2>
          <p className="text-[16px] font-medium text-[#4B5563] max-w-[596px] leading-relaxed font-inter">
            Your feedback keeps our training relevant. We continuously adapt to changes in modern product design with help from our global community.
          </p>
        </div>

        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-[600px]">
            {/* Column 1 */}
            <InfiniteColumn 
              reviews={[REVIEWS[0], REVIEWS[1], REVIEWS[2]]} 
              duration={25} 
            />
            {/* Column 2 - Hidden on small mobile, shown on md+ */}
            <div className="hidden md:block">
              <InfiniteColumn 
                reviews={[REVIEWS[3], REVIEWS[4], REVIEWS[5]]} 
                duration={35} 
                reverse={true}
              />
            </div>
            {/* Column 3 - Only on desktop */}
            <div className="hidden lg:block">
              <InfiniteColumn 
                reviews={[REVIEWS[1], REVIEWS[5], REVIEWS[0]]} 
                duration={30} 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
