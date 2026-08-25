'use client';

import { useState } from 'react';
import { SearchX } from 'lucide-react';
import MyCourseCard from '@/components/dashboard/MyCourseCard';
import type { MyCourseCardProps } from '@/components/dashboard/MyCourseCard';
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@/components/ui/EmptyState';
import SearchField from '@/components/ui/SearchField';

type TabId = 'All' | 'In Progress' | 'Completed';

const TABS: { id: TabId; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Completed', label: 'Completed' },
];

interface MyCoursesClientProps {
  courses: MyCourseCardProps[];
}

export default function MyCoursesClient({ courses }: MyCoursesClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('All');
  const [search, setSearch] = useState('');

  const filtered = courses.filter((c) => {
    const matchesTab = activeTab === 'All' || c.status === activeTab;
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const countByTab = (tab: TabId) =>
    tab === 'All' ? courses.length : courses.filter((c) => c.status === tab).length;

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="bg-[#E3E8F4] p-1 rounded-[12px] flex items-center w-full lg:w-fit overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 lg:flex-none lg:min-w-[180px] px-6 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-[#040B37] shadow-[0px_4px_2px_rgba(0,0,0,0.12)]'
                  : 'text-[#9CA3AF] hover:text-[#4B5563]'
              }`}
            >
              {tab.label} ({countByTab(tab.id)})
            </button>
          ))}
        </div>

        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          aria-label="Search my courses"
          compact
          containerClassName="lg:w-[320px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((course) => (
          <MyCourseCard key={course.id} {...course} />
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState>
          <EmptyStateIcon><SearchX size={23} /></EmptyStateIcon>
          <EmptyStateTitle>No courses found</EmptyStateTitle>
          <EmptyStateDescription>
            {search ? `No courses match "${search}".` : 'No courses in this category.'}
          </EmptyStateDescription>
        </EmptyState>
      )}
    </>
  );
}
