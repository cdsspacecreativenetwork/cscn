'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SidebarModule } from '@/types/player';
import { LessonTypeIcon } from './LessonTypeIcon';

interface CourseContentSidebarProps {
  modules: SidebarModule[];
  courseSlug: string;
  currentLessonId: string;
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M6 10l3 3 5-5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#1C4ED1" strokeWidth="1.5" />
      <path d="M8 7l6 3-6 3V7z" fill="#1C4ED1" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="8" rx="2" stroke="#9CA3AF" strokeWidth="1.5" />
      <path d="M7 9V7a3 3 0 0 1 6 0v2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M4 6l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const CourseContentSidebar = ({
  modules,
  courseSlug,
  currentLessonId,
}: CourseContentSidebarProps) => {
  const currentModuleId = modules.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId)
  )?.id;

  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(currentModuleId ? [currentModuleId] : [modules[0]?.id])
  );

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedCount = modules.reduce(
    (s, m) => s + m.lessons.filter((l) => l.isCompleted).length,
    0
  );

  return (
    <div className="bg-white border border-[#E3E8F4] w-full h-[472px] max-h-[472px] rounded-xl flex flex-col overflow-hidden shadow-sm font-jakarta">
      {/* Header */}
      <div className="h-16 border-b border-[#E3E8F4] flex items-center justify-between px-6 shrink-0">
        <h2 className="font-semibold text-[#040B37] text-base">Course Content</h2>
        <span className="text-xs text-text-mute font-inter">
          {completedCount}/{totalLessons} done
        </span>
      </div>

      {/* Module accordion */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {modules.map((mod) => {
          const isOpen = openModules.has(mod.id);
          return (
            <div key={mod.id} className="border-b border-[#F4F6FB] last:border-0">
              {/* Module header */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-background/60 transition-colors text-left"
              >
                <span className="font-semibold text-[#040B37] text-sm leading-snug pr-2">
                  {mod.title}
                </span>
                <ChevronIcon open={isOpen} />
              </button>

              {/* Lessons */}
              {isOpen && (
                <div>
                  {mod.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    return lesson.isLocked ? (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between px-6 py-3 border-t border-background opacity-60 cursor-default"
                      >
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-3">
                          <span className="flex items-center gap-2 font-medium text-text-body text-sm min-w-0">
                            <LessonTypeIcon contentType={lesson.contentType} size="xs" />
                            <span className="truncate">{lesson.title}</span>
                          </span>
                          <span className="text-text-mute text-xs">{lesson.duration}</span>
                        </div>
                        <div className="shrink-0"><LockIcon /></div>
                      </div>
                    ) : (
                      <Link
                        key={lesson.id}
                        href={`/courses/${courseSlug}/watch/${lesson.id}`}
                        className={`flex items-center justify-between px-6 py-3 border-t border-background transition-colors ${
                          isCurrent ? 'bg-[#EEF3FF]' : 'hover:bg-background/60'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-3">
                          <span
                            className={`flex items-center gap-2 font-medium text-sm min-w-0 ${
                              isCurrent ? 'text-primary' : 'text-text-body'
                            }`}
                          >
                            <LessonTypeIcon contentType={lesson.contentType} size="xs" />
                            <span className="truncate">{lesson.title}</span>
                          </span>
                          <span className="text-text-mute text-xs">{lesson.duration}</span>
                        </div>
                        <div className="shrink-0">
                          {lesson.isCompleted ? <CheckIcon /> : isCurrent ? <PlayIcon /> : (
                            <div className="w-5 h-5 rounded-full border-2 border-stroke" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
