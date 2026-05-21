'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface Lesson {
  id: string | number;
  title: string;
  duration: string;
  isLocked: boolean;
  isPreview?: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface ClassLessonsProps {
  totalLessons: number;
  totalDuration: string;
  modules: Module[];
}

export const ClassLessons: React.FC<ClassLessonsProps> = ({
  totalLessons,
  totalDuration,
  modules,
}) => {
  // Exclusive accordion — open one module at a time
  const [openId, setOpenId] = React.useState<string | null>(
    modules[0]?.id ?? null
  );

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  // Global lesson numbers are stable regardless of which module is open
  const lessonNumbers = React.useMemo(() => {
    const map = new Map<string | number, number>();
    let i = 0;
    modules.forEach((mod) => mod.lessons.forEach((l) => map.set(l.id, ++i)));
    return map;
  }, [modules]);

  return (
    <div className="bg-white rounded-[16px] p-[24px] border border-[#E3E8F4] flex flex-col gap-[16px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h2 className="font-semibold text-[20px] text-[#040B37] tracking-[-0.4px] leading-[1.24]">
          Class Lessons
        </h2>
        <span className="font-semibold text-[14px] text-[#040B37] tracking-[-0.14px]">
          {totalLessons} Lessons ({totalDuration})
        </span>
      </div>

      {/* Accordion */}
      <div className="flex flex-col w-full">
        {modules.map((mod) => {
          const isOpen = openId === mod.id;

          return (
            <div key={mod.id}>
              {/* ── Module header ──────────────────────────────────────────
                  Layout: [16px pad] [chevron 16px] [8px gap] [title text]
                  Title text starts at 40px from the left edge of the card.
                  Lesson rows use pl-[40px] so the icon aligns with the title.
              */}
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center justify-between px-[16px] py-[12px] hover:bg-[#F4F6FB] transition-colors text-left rounded-[10px]"
              >
                <div className="flex items-center gap-[8px] min-w-0">
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-[#9CA3AF] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                  <span className="font-semibold text-[14px] text-[#040B37] tracking-[-0.14px] truncate">
                    {mod.title}
                  </span>
                </div>
                <span className="text-[12px] text-[#9CA3AF] shrink-0 ml-3">
                  {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                </span>
              </button>

              {/* ── Lessons ─────────────────────────────────────────────── */}
              {isOpen &&
                mod.lessons.map((lesson) => {
                  const num = lessonNumbers.get(lesson.id);
                  // Locked → grey padlock  |  accessible → green open padlock
                  const icon = lesson.isLocked
                    ? '/assets/courses/circle-lock-01.svg'
                    : '/assets/courses/circle-unlock.svg';

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between pl-[40px] pr-[16px] py-[14px] rounded-[10px] border border-transparent hover:bg-[#F4F6FB] transition-colors"
                    >
                      <div className="flex items-center gap-[8px] min-w-0">
                        <Image
                          src={icon}
                          alt=""
                          width={24}
                          height={24}
                          className="shrink-0"
                        />
                        <div className="font-medium text-[14px] text-[#4B5563] tracking-[-0.14px] leading-normal min-w-0 flex items-center gap-[6px]">
                          <span className="truncate">
                            {num}. {lesson.title}
                          </span>
                          {/* Free badge — only for unenrolled users viewing a preview lesson */}
                          {lesson.isPreview && !lesson.isLocked && (
                            <span className="shrink-0 text-[10px] font-semibold px-[6px] py-[2px] rounded-full bg-emerald-100 text-emerald-700">
                              Free
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-[14px] text-[#4B5563] tracking-[-0.14px] ml-4 shrink-0">
                        {lesson.duration}
                      </span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
