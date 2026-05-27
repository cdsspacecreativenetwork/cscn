"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { toggleFeaturedInstructorAction } from "@/actions/admin-featured-instructors";

interface FeaturedInstructorStarProps {
  userId: string;
  featured: boolean;
  disabled?: boolean;
}

export function FeaturedInstructorStar({ userId, featured, disabled }: FeaturedInstructorStarProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleFeaturedInstructorAction(userId);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          toast.success(featured ? "Instructor removed from homepage" : "Instructor featured on homepage");
        });
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border transition ${
        featured
          ? "border-amber-200 bg-amber-50 text-amber-500"
          : "border-[#E3E8F4] bg-white text-[#9CA3AF] hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      aria-label={featured ? "Remove featured instructor" : "Feature instructor"}
      title={featured ? "Remove featured instructor" : "Feature instructor"}
    >
      <Star size={17} fill={featured ? "currentColor" : "none"} />
    </button>
  );
}
