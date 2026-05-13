'use client';

import { useState } from 'react';
import type { PlayerResource } from '@/types/player';

interface CourseTabsProps {
  description: string;
  instructorName: string;
  resources: PlayerResource[];
}

type Tab = 'overview' | 'resources';

function PdfIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 18V17H17V18H7ZM7 15V14H17V15H7ZM7 12V11H17V12H7ZM14 2H6C5.45 2 5 2.45 5 3V21C5 21.55 5.45 22 6 22H18C18.55 22 19 21.55 19 21V7L14 2Z" fill="#1C4ED1" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#1C4ED1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#1C4ED1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const CourseTabs = ({ description, instructorName, resources }: CourseTabsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="flex flex-col gap-6 w-full font-jakarta">
      <div className="bg-stroke p-1 rounded-sm flex items-center gap-1 w-fit">
        {(['overview', 'resources'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2 rounded-sm text-sm font-medium transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-white text-[#040B37] shadow-[0px_2px_2px_rgba(0,0,0,0.12)]'
                : 'text-text-mute hover:text-text-body'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm min-h-[400px]">
        {activeTab === 'overview' ? (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-[#040B37] text-lg">About</h3>
              <p className="font-medium text-text-body text-base leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-[#040B37] text-lg">Instructor</h3>
              <p className="font-medium text-text-body text-base">{instructorName}</p>
            </div>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
              <PdfIcon />
            </div>
            <p className="text-text-mute font-medium text-sm">No resources for this lesson.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-stroke rounded-[14px] p-6 lg:p-8 flex flex-col gap-6 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 bg-primary/4 rounded-lg flex items-center justify-center shrink-0">
                  {r.type === 'PDF' ? <PdfIcon /> : <LinkIcon />}
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-[#040B37] text-lg tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {r.title}
                  </h4>
                  <p className="font-medium text-text-mute text-sm tracking-tight capitalize">{r.type}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
