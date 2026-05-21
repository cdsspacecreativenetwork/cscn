'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { submitCourseRatingAction } from '@/actions/course-ratings';

interface CourseRatingPanelProps {
  courseId: string;
  initialRating: { rating: number; comment: string | null } | null;
  summary: { average: number; count: number };
}

export function CourseRatingPanel({
  courseId,
  initialRating,
  summary,
}: CourseRatingPanelProps) {
  const [rating, setRating] = useState(initialRating?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(initialRating?.comment ?? '');
  const [currentSummary, setCurrentSummary] = useState(summary);
  const [pending, startTransition] = useTransition();

  const selected = hovered || rating;

  const handleSubmit = () => {
    if (rating < 1) {
      toast.error('Choose a star rating first.');
      return;
    }

    startTransition(async () => {
      const result = await submitCourseRatingAction(courseId, {
        rating,
        comment: comment.trim() || null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.summary) setCurrentSummary(result.summary);
      toast.success(initialRating ? 'Review updated.' : 'Thanks for reviewing this course.');
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E3E8F4] shadow-sm p-6 lg:p-8 flex flex-col gap-5 font-jakarta">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Course Review</p>
          <h3 className="text-lg font-bold text-[#040B37] mt-1">
            {initialRating ? 'Update your rating' : 'Rate this course'}
          </h3>
          <p className="text-sm text-text-mute mt-1">
            Your feedback helps future learners choose better and helps instructors improve.
          </p>
        </div>
        <div className="rounded-xl bg-[#F4F6FB] px-4 py-3 text-right shrink-0">
          <p className="text-xl font-bold text-[#040B37]">{currentSummary.average || '0.0'}</p>
          <p className="text-xs font-semibold text-text-mute">
            {currentSummary.count} {currentSummary.count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(value)}
            className="p-1 rounded-lg hover:bg-primary/5 transition-colors"
            aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
          >
            <Star
              size={28}
              className={value <= selected ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBD5E1]'}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 600))}
        rows={4}
        className="w-full px-4 py-3 border border-[#E3E8F4] rounded-xl text-sm font-medium text-[#040B37] placeholder:text-text-mute bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
        placeholder="Share what worked well, what could be clearer, or who this course is best for..."
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-text-mute">{comment.length}/600</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Saving...' : initialRating ? 'Update review' : 'Submit review'}
        </button>
      </div>
    </div>
  );
}
