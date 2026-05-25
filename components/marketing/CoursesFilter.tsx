'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import CourseCard, { type CourseCardProps } from '@/components/ui/CourseCard';
import CourseCardSkeleton from '@/components/ui/CourseCardSkeleton';

interface CoursesFilterProps {
  courses: CourseCardProps[];
  categories?: string[];
  instructors: string[];
}
const INITIAL_VISIBLE_COUNT = 8;
const LOAD_MORE_INCREMENT = 4;

// --- Custom Dropdown Component ---
interface DropdownProps {
  options: readonly string[] | string[];
  selected: string;
  onChange: (value: string) => void;
  icon?: string;
}

const CustomDropdown = ({ options, selected, onChange }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  return (
    <div className="relative inline-block w-fit" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border border-stroke-ii rounded-sm px-3 py-2 text-[14px] font-medium text-navy transition-all group cursor-pointer min-w-[160px] w-full"
      >
        <span className="whitespace-nowrap mr-2">{selected}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 flex items-center justify-center"
        >
          <Image src="/assets/courses/arrow-down-01.svg" alt="" width={24} height={24} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-stroke-ii rounded-sm shadow-2xl overflow-hidden p-1 min-w-full w-max max-w-[300px] md:max-w-none"
          >
            <div className="flex flex-col gap-0.5">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-sm text-lg font-medium transition-all text-left whitespace-nowrap ${selected === option
                    ? 'bg-primary text-white'
                    : 'text-text-body hover:bg-background hover:text-primary'
                    }`}
                >
                  <span className="pr-2">{option}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CoursesFilter({ courses, categories, instructors }: CoursesFilterProps) {
  const ALL_CATEGORIES = useMemo(
    () => ['All Categories', ...Array.from(new Set(categories ?? [])).sort((a, b) => a.localeCompare(b))],
    [categories]
  );
  const [activeCategory, setActiveCategory] = useState<string>('All Categories');
  const [activeInstructor, setActiveInstructor] = useState<string>('All Instructors');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    const savedView = window.localStorage.getItem('cscn-view-preference');
    return savedView === 'grid' || savedView === 'list' ? savedView : 'grid';
  });

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounce search for API readiness
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesCategory = activeCategory === 'All Categories' || course.category === activeCategory;
      const matchesInstructor = activeInstructor === 'All Instructors' || course.author === activeInstructor;
      const matchesSearch = course.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.author.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesCategory && matchesInstructor && matchesSearch;
    });
  }, [courses, activeCategory, activeInstructor, debouncedSearch]);

  const paginatedCourses = useMemo(() => {
    return filteredCourses.slice(0, visibleCount);
  }, [filteredCourses, visibleCount]);

  const hasMore = visibleCount < filteredCourses.length;
  const loadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + LOAD_MORE_INCREMENT);
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const handleInstructorChange = (value: string) => {
    setActiveInstructor(value);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const handleViewChange = (value: 'grid' | 'list') => {
    setView(value);
    localStorage.setItem('cscn-view-preference', value);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search our 100+ courses"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(INITIAL_VISIBLE_COUNT);
          }}
          className="w-full bg-white border border-stroke-ii rounded-2xl px-6 py-5 text-lg font-inter text-navy placeholder:text-text-mute focus:outline-none focus:ring-2 focus:ring-primary/5 focus:border-primary transition-all pr-16"
        />
        <div className="absolute right-7 top-1/2 -translate-y-1/2">
          <Image src="/assets/courses/search-01.svg" alt="Search" width={24} height={24} className="opacity-40" />
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium text-text-mute font-inter tracking-[-0.01em]">
              Showing <span className="text-text-body font-semibold">1-{Math.min(paginatedCourses.length, filteredCourses.length)}</span> of {filteredCourses.length} results
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-[16px]">
            {/* Category Dropdown */}
            <CustomDropdown
              options={ALL_CATEGORIES}
              selected={activeCategory}
              onChange={handleCategoryChange}
            />

            {/* Instructor Dropdown */}
            <CustomDropdown
              options={['All Instructors', ...instructors]}
              selected={activeInstructor}
              onChange={handleInstructorChange}
            />

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-stroke-ii rounded-sm gap-1.5 px-3 py-1.5">
              <button
                onClick={() => handleViewChange('grid')}
                className={`w-8 h-8 items-center justify-center flex rounded-[4px] transition-all cursor-pointer ${view === 'grid' ? 'bg-[#F4F6FB]' : 'hover:bg-gray-50 opacity-40'}`}
              >
                <Image src="/assets/courses/grid-view.svg" alt="Grid" width={20} height={20} />
              </button>
              <div className="w-[1px] h-9.5 bg-stroke-ii opacity-50" />
              <button
                onClick={() => handleViewChange('list')}
                className={`w-8 h-8 items-center justify-center flex rounded-[4px] cursor-pointer transition-all ${view === 'list' ? 'bg-[#F4F6FB]' : 'hover:bg-gray-50 opacity-40'}`}
              >
                <Image src="/assets/courses/menu-01.svg" alt="List" width={20} height={20} />
              </button>
            </div>
        </div>
      </div>

      {/* Grid/List Content */}
      <div className="flex flex-col gap-12 transition-opacity duration-300">
        <motion.div
          layout
          className={view === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[24px]"
            : "flex flex-col gap-6"
          }
        >
          <AnimatePresence mode="popLayout">
            {paginatedCourses.map((course) => (
              <motion.div
                layout
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                <CourseCard {...course} view={view} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Skeletons when loading more */}
          {isLoading && Array.from({ length: LOAD_MORE_INCREMENT }).map((_, i) => (
            <div key={`skeleton-${i}`}>
              <CourseCardSkeleton view={view} />
            </div>
          ))}

          {filteredCourses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-40 text-center">
              <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-8 border border-stroke">
                <Image src="/assets/courses/search-01.svg" alt="Not found" width={40} height={40} className="opacity-10" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-3">No courses found</h3>
              <p className="text-text-body text-lg max-w-md mx-auto">Try adjusting your filters or search query to find the perfect course for you.</p>
            </div>
          )}
        </motion.div>

        {/* Infinite Scroll Sentinel */}
        <div ref={loaderRef} className="w-full h-10" />
      </div>
    </div>
  );
}
