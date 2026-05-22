'use client';

import React from 'react';
import Image from 'next/image';
import { CustomSelect } from '../../ui/CustomSelect';
import { FileText, Link as LinkIcon, Folder, LayoutGrid, GraduationCap, UserRound, BookOpen } from 'lucide-react';

interface ResourceHeaderProps {
  onSearch: (query: string) => void;
  onTypeChange: (type: string) => void;
  onCourseChange: (course: string) => void;
  onScopeChange: (scope: 'student' | 'instructor') => void;
  courses: string[];
  scope: 'student' | 'instructor';
}

const TYPE_OPTIONS = [
  { value: "All Types", label: "All Types", icon: <LayoutGrid size={16} /> },
  { value: "PDF", label: "PDF Documents", icon: <FileText size={16} /> },
  { value: "LINK", label: "External Links", icon: <LinkIcon size={16} /> },
  { value: "FILE", label: "Project Files", icon: <Folder size={16} /> },
];

export const ResourceHeader: React.FC<ResourceHeaderProps> = ({ 
  onSearch, 
  onTypeChange, 
  onCourseChange,
  onScopeChange,
  courses,
  scope,
}) => {
  const [type, setType] = React.useState("All Types");
  const [course, setCourse] = React.useState("All Courses");
  const courseOptions = React.useMemo(() => [
    { value: "All Courses", label: "All Courses", icon: <GraduationCap size={16} /> },
    ...courses.map((item) => ({ value: item, label: item })),
  ], [courses]);

  React.useEffect(() => {
    if (course !== "All Courses" && !courses.includes(course)) {
      setCourse("All Courses");
      onCourseChange("All Courses");
    }
  }, [course, courses, onCourseChange]);

  const handleTypeChange = (val: string) => {
    setType(val);
    onTypeChange(val);
  };

  const handleCourseChange = (val: string) => {
    setCourse(val);
    onCourseChange(val);
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* Title Section */}
      <div className="space-y-2">
        <h1 className="text-[32px] font-bold text-[#040B37] tracking-tight leading-tight font-jakarta">
          Resources
        </h1>
        <p className="text-[#9CA3AF] text-[16px] font-medium tracking-tight">
          Learning downloads and teaching materials in one place
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { value: 'student', label: 'Learning Resources', icon: BookOpen },
          { value: 'instructor', label: 'Teaching Resources', icon: UserRound },
        ] as const).map((item) => {
          const Icon = item.icon;
          const active = scope === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onScopeChange(item.value)}
              className={`inline-flex items-center gap-2 rounded-[8px] px-4 py-2.5 text-sm font-bold transition-colors ${
                active ? 'bg-[#1C4ED1] text-white' : 'bg-white border border-[#E3E8F4] text-[#4B5563] hover:text-[#1C4ED1]'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center">
        {/* Search Input Container */}
        <div className="relative flex-1 group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors pointer-events-none">
            <Image 
              src="/assets/dashboard/search.svg" 
              alt="" 
              fill 
              className="object-contain opacity-40 group-focus-within:opacity-100 group-focus-within:brightness-0 group-focus-within:invert-[.3] group-focus-within:sepia-[1] group-focus-within:saturate-[5] group-focus-within:hue-rotate-[200deg] transition-all" 
            />
          </div>
          <input 
            type="text" 
            placeholder="Search resources..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-white border border-[#E3E8F4] rounded-[32px] py-4 pl-14 pr-6 text-[15px] text-[#040B37] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/5 transition-all shadow-sm font-medium"
          />
        </div>

        {/* Custom Styled Dropdown Filters */}
        <div className="flex flex-row gap-4 items-center">
          <CustomSelect
            options={TYPE_OPTIONS}
            value={type}
            onChange={handleTypeChange}
            className="flex-1 lg:flex-none lg:min-w-[200px]"
          />
          <CustomSelect
            options={courseOptions}
            value={course}
            onChange={handleCourseChange}
            className="flex-1 lg:flex-none lg:min-w-[200px]"
          />
        </div>
      </div>
    </div>
  );
};
