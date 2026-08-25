'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Sparkles, Palette, Code2, Briefcase, TrendingUp, Users, Cpu } from 'lucide-react';
import MentorCard from '@/components/ui/MentorCard';
import type { Mentor } from '@/lib/mentorship';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'ai', label: 'AI & Data', icon: Cpu },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'engineering', label: 'Engineering', icon: Code2 },
  { id: 'product', label: 'Product', icon: Briefcase },
  { id: 'business', label: 'Business & Growth', icon: TrendingUp },
  { id: 'soft-skills', label: 'Soft Skills', icon: Users },
];

export default function MentorsFilterSection({ mentors }: { mentors: Mentor[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter mentors logic
  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      // 1. Search Query filter (Name, Role, Bio/Intro, Topics)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = mentor.name?.toLowerCase().includes(query);
        const matchesRole = mentor.role?.toLowerCase().includes(query);
        const matchesIntro = mentor.intro?.toLowerCase().includes(query);
        const matchesTopics = mentor.topics?.some((t) => t.toLowerCase().includes(query));

        if (!matchesName && !matchesRole && !matchesIntro && !matchesTopics) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        const categoryQuery = selectedCategory.toLowerCase();
        const role = (mentor.role || '').toLowerCase();
        const topics = (mentor.topics || []).map((t) => t.toLowerCase());
        const intro = (mentor.intro || '').toLowerCase();

        let matchesCat = false;
        if (categoryQuery === 'ai') {
          matchesCat = role.includes('ai') || role.includes('data') || role.includes('machine learning') || topics.some(t => t.includes('ai') || t.includes('data'));
        } else if (categoryQuery === 'design') {
          matchesCat = role.includes('design') || role.includes('ui') || role.includes('ux') || topics.some(t => t.includes('design') || t.includes('ui') || t.includes('ux'));
        } else if (categoryQuery === 'engineering') {
          matchesCat = role.includes('engineer') || role.includes('developer') || role.includes('frontend') || role.includes('backend') || role.includes('fullstack') || topics.some(t => t.includes('code') || t.includes('engineering') || t.includes('dev'));
        } else if (categoryQuery === 'product') {
          matchesCat = role.includes('product') || role.includes('pm') || topics.some(t => t.includes('product') || t.includes('agile'));
        } else if (categoryQuery === 'business') {
          matchesCat = role.includes('business') || role.includes('marketing') || role.includes('growth') || role.includes('strategy') || topics.some(t => t.includes('business') || t.includes('marketing'));
        } else if (categoryQuery === 'soft-skills') {
          matchesCat = role.includes('career') || role.includes('lead') || topics.some(t => t.includes('career') || t.includes('interview') || t.includes('resume') || t.includes('leadership'));
        }

        if (!matchesCat) return false;
      }

      // 3. Price Filter
      if (showFreeOnly && !mentor.priceLabel?.toLowerCase().includes('free')) {
        return false;
      }

      return true;
    });
  }, [mentors, searchQuery, selectedCategory, showFreeOnly]);

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (showFreeOnly ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full">
      {/* ── Search & Filter Control Row ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 w-full">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md lg:max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF]">
            <Search size={19} />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or role..."
            className="pl-12 pr-10 h-12 text-[15px] rounded-full outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#040B37] transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className="relative flex items-center justify-end w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full text-[15px] font-semibold transition-all cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-[#1C4ED1] text-white border border-[#1C4ED1] hover:bg-[#163fa3] shadow-md'
                : 'bg-white border border-[#E3E8F4] text-[#040B37] hover:border-[#C8D1E0] hover:bg-[#F4F6FB] shadow-2xs'
            }`}
          >
            <SlidersHorizontal size={17} className={activeFiltersCount > 0 ? 'text-white' : 'text-[#4B5563]'} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#1C4ED1] text-[11px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Filters Dropdown Popover */}
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 z-30 bg-white border border-[#E3E8F4] rounded-[16px] p-4 shadow-xl flex flex-col gap-4 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#E3E8F4] pb-2.5">
                <span className="text-[15px] font-semibold text-[#040B37]">Filter Mentors</span>
                <button onClick={() => setIsFilterOpen(false)} className="text-[#9CA3AF] hover:text-[#040B37]">
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showFreeOnly}
                    onChange={(e) => setShowFreeOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-[#C8D1E0] text-[#1C4ED1] focus:ring-[#1C4ED1]"
                  />
                  <span className="text-[14px] font-medium text-[#4B5563]">Free sessions only</span>
                </label>
              </div>

              {activeFiltersCount > 0 && (
                <div className="pt-2 border-t border-[#E3E8F4] flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setShowFreeOnly(false);
                    }}
                    className="text-[13px] font-medium text-[#1C4ED1] hover:underline"
                  >
                    Reset all
                  </button>
                  <Button variant="primary" size="sm" rounded="md" onClick={() => setIsFilterOpen(false)}>
                    Done
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Horizontally Scrollable Industry Category Bar ────────────── */}
      <div className="relative w-full group">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white border border-[#E3E8F4] shadow-md text-[#040B37] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Scroll Container with Faded Edges */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#040B37] text-white shadow-xs font-semibold'
                    : 'bg-white border border-[#E3E8F4] text-[#4B5563] hover:border-[#C8D1E0] hover:text-[#040B37] hover:bg-[#F4F6FB]'
                }`}
              >
                {Icon && <Icon size={15} className={isSelected ? 'text-white' : 'text-[#4B5563]'} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white border border-[#E3E8F4] shadow-md text-[#040B37] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Filtered Mentors Grid ──────────────────────────────────────── */}
      {filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} {...mentor} />
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F6FB] flex items-center justify-center text-[#9CA3AF]">
            <Search size={22} />
          </div>
          <p className="text-[18px] font-bold text-[#040B37]">No mentors found</p>
          <p className="text-[14px] font-medium text-[#9CA3AF] max-w-sm">
            We couldn&apos;t find any mentors matching your search or filters. Try adjusting your search query or reset filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setShowFreeOnly(false);
            }}
            className="mt-2 text-[14px] font-semibold text-[#1C4ED1] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
