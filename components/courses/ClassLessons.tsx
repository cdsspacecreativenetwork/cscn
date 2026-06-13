'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { LessonTypeIcon } from '@/components/dashboard/courses/LessonTypeIcon';

interface Lesson {
  id: string | number;
  title: string;
  duration: string;
  contentType?: string;
  isLocked: boolean;
  isPreview?: boolean;
}

interface Module {
  id: string;
  title: string;
  isDefault?: boolean;
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
  const [openId, setOpenId] = React.useState<string | null>(
    modules[0]?.id ?? null
  );

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  const lessonNumbers = React.useMemo(() => {
    const map = new Map<string | number, number>();
    let i = 0;
    modules.forEach((mod) => mod.lessons.forEach((lesson) => map.set(lesson.id, ++i)));
    return map;
  }, [modules]);

  const hasOnlyDefaultModule = modules.length === 1 && modules[0]?.isDefault;

  const renderLesson = (lesson: Lesson) => {
    const num = lessonNumbers.get(lesson.id);
    const icon = lesson.isLocked
      ? '/assets/courses/circle-lock-01.svg'
      : '/assets/courses/circle-unlock.svg';

    return (
      <div
        key={lesson.id}
        className="flex items-start justify-between gap-3 rounded-[10px] border border-transparent px-3 py-[14px] transition-colors hover:bg-[#F4F6FB] sm:px-4"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Image
            src={icon}
            alt=""
            width={24}
            height={24}
            className="mt-[1px] shrink-0"
          />
          <div className="mt-[2px] shrink-0">
            <LessonTypeIcon contentType={lesson.contentType} size="xs" />
          </div>
          <div className="min-w-0 flex-1 text-[14px] font-medium leading-[1.45] tracking-[-0.14px] text-[#4B5563]">
            <span className="break-words">
              {num}. {lesson.title}
            </span>
            {lesson.isPreview && !lesson.isLocked && (
              <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-[6px] py-[2px] align-middle text-[10px] font-semibold text-emerald-700">
                Free
              </span>
            )}
          </div>
        </div>
        <span className="mt-[2px] shrink-0 whitespace-nowrap text-[14px] font-medium tracking-[-0.14px] text-[#4B5563]">
          {lesson.duration}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E3E8F4] bg-white p-5 sm:p-6">
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="font-semibold text-[20px] leading-[1.24] tracking-[-0.4px] text-[#040B37]">
          Class Lessons
        </h2>
        <span className="font-semibold text-[14px] tracking-[-0.14px] text-[#040B37] sm:text-right">
          {totalLessons} Lessons ({totalDuration})
        </span>
      </div>

      <div className="flex w-full flex-col">
        {hasOnlyDefaultModule ? (
          <div className="flex flex-col gap-1">
            {modules[0].lessons.map(renderLesson)}
          </div>
        ) : (
          modules.map((mod) => {
            const isOpen = openId === mod.id;

            return (
              <div key={mod.id}>
                <button
                  onClick={() => toggle(mod.id)}
                  className="flex w-full items-start justify-between gap-3 rounded-[10px] px-4 py-3 text-left transition-colors hover:bg-[#F4F6FB]"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <ChevronDown
                      size={16}
                      className={`mt-[2px] shrink-0 text-[#9CA3AF] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                    <span className="break-words text-[14px] font-semibold leading-[1.45] tracking-[-0.14px] text-[#040B37]">
                      {mod.isDefault ? 'Lessons' : mod.title}
                    </span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap pt-[2px] text-[12px] text-[#9CA3AF]">
                    {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-1 pl-3 sm:pl-7">
                    {mod.lessons.map(renderLesson)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
