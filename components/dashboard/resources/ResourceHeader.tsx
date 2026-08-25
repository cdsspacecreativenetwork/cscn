'use client';

import React from 'react';
import { CustomSelect } from '../../ui/CustomSelect';
import { FileText, Link as LinkIcon, Folder, LayoutGrid, GraduationCap, UserRound, BookOpen } from 'lucide-react';

import { Plus } from 'lucide-react';
import SearchField from '@/components/ui/SearchField';

interface ResourceHeaderProps {
  onSearch: (query: string) => void;
  onTypeChange: (type: string) => void;
  onCourseChange: (course: string) => void;
  onScopeChange: (scope: 'student' | 'instructor') => void;
  onCreateClick?: () => void;
  courses: string[];
  scope: 'student' | 'instructor';
  canViewTeachingResources: boolean;
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
  onCreateClick,
  courses,
  scope,
  canViewTeachingResources,
}) => {
  const [type, setType] = React.useState("All Types");
  const [course, setCourse] = React.useState("All Courses");

  const courseOptions = React.useMemo(() => {
    const uniqueCourses = Array.from(new Set(courses));
    return uniqueCourses.map((item) => ({
      value: item,
      label: item,
      icon: item === 'All Courses' ? <GraduationCap size={16} /> : undefined,
    }));
  }, [courses]);

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
      {/* Title & Actions Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[32px] font-bold text-[#040B37] tracking-tight leading-tight font-jakarta">
            Resources
          </h1>
          <p className="text-[#9CA3AF] text-[16px] font-medium tracking-tight">
            {canViewTeachingResources
              ? 'Learning downloads and teaching materials in one place'
              : 'Downloads and links from your enrolled courses'}
          </p>
        </div>

        {scope === 'instructor' && onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#1C4ED1] hover:bg-[#153eb2] text-white px-5 py-3 text-[15px] font-bold transition-all shadow-md shrink-0 self-start sm:self-auto"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Resource
          </button>
        )}
      </div>

      {canViewTeachingResources && (
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
                className={`inline-flex items-center gap-2 rounded-[8px] px-4 py-2.5 text-base font-bold transition-colors ${
                  active ? 'bg-[#1C4ED1] text-white' : 'bg-white border border-[#E3E8F4] text-[#4B5563] hover:text-[#1C4ED1]'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center">
        <SearchField
          placeholder="Search resources by title or course..."
          aria-label="Search resources"
          onChange={(e) => onSearch(e.target.value)}
          containerClassName="flex-1"
        />

        {/* Custom Styled Dropdown Filters */}
        <div className="flex flex-row gap-4 items-center">
          <CustomSelect
            size="default"
            options={TYPE_OPTIONS}
            value={type}
            onChange={handleTypeChange}
            className="flex-1 lg:flex-none lg:min-w-[200px]"
          />
          <CustomSelect
            size="default"
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
