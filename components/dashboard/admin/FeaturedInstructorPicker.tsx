"use client";

import Image from "next/image";
import { useTransition } from "react";
import { CheckCircle2, Loader2, Star, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  assignFeaturedInstructorAction,
  removeFeaturedInstructorAction,
} from "@/actions/admin-featured-instructors";
import type { FeaturedInstructorRow } from "@/data/featured-instructors";
import Button from "@/components/ui/Button";

interface FeaturedInstructorPickerProps {
  slots: Array<FeaturedInstructorRow | null>;
  suggestions: FeaturedInstructorRow[];
}

export function FeaturedInstructorPicker({ slots, suggestions }: FeaturedInstructorPickerProps) {
  const [isPending, startTransition] = useTransition();

  const assignInstructor = (instructorId: string, slot: number) => {
    startTransition(async () => {
      const result = await assignFeaturedInstructorAction(instructorId, slot);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Featured slot ${slot} updated`);
    });
  };

  const removeInstructor = (instructorId: string) => {
    startTransition(async () => {
      const result = await removeFeaturedInstructorAction(instructorId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Featured instructor removed");
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {slots.map((instructor, index) => {
          const slot = index + 1;
          return (
            <div key={slot} className="rounded-[16px] border border-[#E3E8F4] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[12px] font-bold text-[#1C4ED1]">
                  Slot {slot}
                </span>
                {instructor && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => removeInstructor(instructor.id)}
                    className="text-[12px] font-semibold text-[#EF4444] transition hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>

              {instructor ? (
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-[14px] border border-[#E3E8F4] bg-[#F4F6FB]">
                    <Image src={instructor.image} alt={instructor.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-[#040B37]">{instructor.name}</p>
                    <p className="truncate text-[12px] font-medium text-[#9CA3AF]">{instructor.headline}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#1C4ED1]">
                      {instructor.averageRating || "New"} rating | {instructor.totalStudents} students
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[72px] items-center gap-3 rounded-[12px] border border-dashed border-[#B8C7EA] bg-[#F8FAFF] p-4">
                  <UserRound className="text-[#1C4ED1]" size={22} />
                  <div>
                    <p className="text-[14px] font-bold text-[#040B37]">Empty slot</p>
                    <p className="text-[12px] font-medium text-[#9CA3AF]">Choose from suggestions below.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-[16px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E3E8F4] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#040B37]">Suggested instructors</h2>
            <p className="text-[13px] font-medium text-[#9CA3AF]">
              Ranked by rating, enrollments, published courses, and profile completeness. Final placement is editorial.
            </p>
          </div>
          {isPending && (
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1C4ED1]">
              <Loader2 className="animate-spin" size={16} />
              Updating
            </span>
          )}
        </div>

        {suggestions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[15px] font-bold text-[#040B37]">No verified instructors yet</p>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
              Instructors will appear here after verification and profile completion.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6FB]">
            {suggestions.map((instructor) => (
              <div key={instructor.id} className="grid gap-5 px-6 py-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)_auto] xl:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-[14px] border border-[#E3E8F4] bg-[#F4F6FB]">
                    <Image src={instructor.image} alt={instructor.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-[#040B37]">{instructor.name}</p>
                    <p className="truncate text-[13px] font-medium text-[#4B5563]">{instructor.headline}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#9CA3AF]">
                      <span className="inline-flex items-center gap-1 text-[#1C4ED1]">
                        <Star size={13} fill="currentColor" />
                        {instructor.averageRating || "New"} ({instructor.ratingCount})
                      </span>
                      <span>{instructor.totalStudents} students</span>
                      <span>{instructor.publishedCourses} courses</span>
                      <span>Score {instructor.score}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {instructor.checklist.map((item) => (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        item.complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.complete ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {item.label}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  {[1, 2, 3, 4].map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={instructor.featuredOrder === slot ? "primary" : "secondary"}
                      size="sm"
                      rounded="[10px]"
                      hasBorder={false}
                      disabled={isPending}
                      onClick={() => assignInstructor(instructor.id, slot)}
                      className="px-3"
                    >
                      Slot {slot}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
