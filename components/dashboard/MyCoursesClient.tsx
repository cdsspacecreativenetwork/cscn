'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import MyCourseCard from '@/components/dashboard/MyCourseCard';
import type { MyCourseCardProps } from '@/components/dashboard/MyCourseCard';

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

        <div className="relative group w-full lg:w-[320px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#1C4ED1] transition-colors"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-[#E3E8F4] rounded-xl focus:outline-none focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/5 transition-all text-[14px] font-medium text-[#4B5563] placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((course) => (
          <MyCourseCard key={course.id} {...course} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-[#F4F6FB] rounded-full flex items-center justify-center">
            <Search size={32} className="text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] font-medium">
            {search ? `No courses match "${search}".` : 'No courses in this category.'}
          </p>
        </div>
      )}
    </>
  );
}
