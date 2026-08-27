'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import MentorCard from '@/components/ui/MentorCard';
import type { Mentor } from '@/lib/mentorship';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EXPERTISE_CATEGORIES, INDUSTRY_SECTORS } from '@/lib/categories';
import { MENTORSHIP_BENEFITS } from '@/lib/mentorship';
import { ScheduleDatePicker } from '@/components/dashboard/instructor/ScheduleDatePicker';
import { BecomeInstructorModal } from '@/components/marketing/BecomeInstructorModal';
import { WORLD_COUNTRIES } from '@/lib/countries';
import { parseISO } from 'date-fns';

type MentorsFilterSectionProps = {
  mentors: Mentor[];
  stats: Array<{ label: string; value: string; isRating?: boolean }>;
  bookingError?: string;
};

// Smooth cubic-bezier ease curve and spring physics
const easeCurve = [0.16, 1, 0.3, 1] as const;
const springLayout = { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.8 };

type SidebarFilterState = {
  selectedIndustries: string[];
  selectedLevels: string[];
  selectedGenders: string[];
  selectedCountries: string[];
  showFreeOnly: boolean;
  isAsapOnly: boolean;
  dateFrom: string;
  dateTo: string;
};

const initialSidebarFilters: SidebarFilterState = {
  selectedIndustries: [],
  selectedLevels: [],
  selectedGenders: [],
  selectedCountries: [],
  showFreeOnly: false,
  isAsapOnly: false,
  dateFrom: '',
  dateTo: '',
};

const GENDER_OPTIONS = ['Male', 'Female'];

function MentorCardSkeleton() {
  return (
    <div className="flex w-full max-w-[270px] mx-auto sm:mx-0 flex-col overflow-hidden rounded-[20px] border border-[#E3E8F4] bg-white p-3 shadow-xs animate-pulse">
      <div className="w-full h-[245px] sm:h-[260px] rounded-[16px] bg-slate-200/70" />
      <div className="flex flex-col gap-3.5 pt-3.5 pb-1 px-1 flex-1">
        <div className="h-5 bg-slate-200/70 rounded-md w-3/4" />
        <div className="h-4 bg-slate-200/60 rounded-md w-full" />
        <div className="h-4 bg-slate-200/50 rounded-md w-1/2" />
        <div className="mt-auto pt-1">
          <div className="bg-slate-100 rounded-md p-3 h-12" />
        </div>
      </div>
    </div>
  );
}

export default function MentorsFilterSection({
  mentors,
  stats,
  bookingError,
}: MentorsFilterSectionProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canBecomeMentor = userRole === 'INSTRUCTOR' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const [becomeInstructorModalOpen, setBecomeInstructorModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter sidebar starts CLOSED by default as requested
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Draft filters (edited in sidebar, NOT applied to grid until user clicks "Show results")
  const [draftFilters, setDraftFilters] = useState<SidebarFilterState>(initialSidebarFilters);

  // Applied filters (currently controlling the mentor grid output)
  const [appliedFilters, setAppliedFilters] = useState<SidebarFilterState>(initialSidebarFilters);

  // Progressive Infinite Scroll & Skeleton Loaders
  const BATCH_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Search queries inside sidebar accordions
  const [industrySearch, setIndustrySearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  // Accordion toggle states (ALL INITIALLY CLOSED)
  const [accordions, setAccordions] = useState({
    availability: false,
    dates: false,
    industry: false,
    level: false,
    gender: false,
    country: false,
  });

  const toggleAccordion = (key: keyof typeof accordions) => {
    setAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categoryRailRef = useRef<HTMLDivElement>(null);
  const [categoryScrollEdges, setCategoryScrollEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const rail = categoryRailRef.current;
    if (!rail) return;

    const updateScrollEdges = () => {
      const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
      setCategoryScrollEdges({
        left: rail.scrollLeft > 4,
        right: rail.scrollLeft < maxScrollLeft - 4,
      });
    };

    const frame = window.requestAnimationFrame(updateScrollEdges);
    const resizeObserver = new ResizeObserver(updateScrollEdges);
    resizeObserver.observe(rail);
    rail.addEventListener('scroll', updateScrollEdges, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      rail.removeEventListener('scroll', updateScrollEdges);
    };
  }, []);

  // Filter industry sectors inside accordion
  const filteredIndustrySectors = useMemo(() => {
    if (!industrySearch.trim()) return INDUSTRY_SECTORS;
    const query = industrySearch.toLowerCase();
    return INDUSTRY_SECTORS.filter((ind) => ind.label.toLowerCase().includes(query));
  }, [industrySearch]);

  // Filter 240+ countries inside accordion
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return WORLD_COUNTRIES;
    const query = countrySearch.toLowerCase();
    return WORLD_COUNTRIES.filter((c) => c.toLowerCase().includes(query));
  }, [countrySearch]);

  const toggleDraftIndustry = (id: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      selectedIndustries: prev.selectedIndustries.includes(id)
        ? prev.selectedIndustries.filter((i) => i !== id)
        : [...prev.selectedIndustries, id],
    }));
  };

  const toggleDraftLevel = (lvl: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      selectedLevels: prev.selectedLevels.includes(lvl)
        ? prev.selectedLevels.filter((l) => l !== lvl)
        : [...prev.selectedLevels, lvl],
    }));
  };

  const toggleDraftGender = (g: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      selectedGenders: prev.selectedGenders.includes(g)
        ? prev.selectedGenders.filter((item) => item !== g)
        : [...prev.selectedGenders, g],
    }));
  };

  const toggleDraftCountry = (c: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      selectedCountries: prev.selectedCountries.includes(c)
        ? prev.selectedCountries.filter((item) => item !== c)
        : [...prev.selectedCountries, c],
    }));
  };

  // Active applied filter count
  const appliedFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    appliedFilters.selectedIndustries.length +
    appliedFilters.selectedLevels.length +
    appliedFilters.selectedGenders.length +
    appliedFilters.selectedCountries.length +
    (appliedFilters.showFreeOnly ? 1 : 0) +
    (appliedFilters.isAsapOnly ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (appliedFilters.dateFrom || appliedFilters.dateTo ? 1 : 0);

  // Active draft filter count
  const draftFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    draftFilters.selectedIndustries.length +
    draftFilters.selectedLevels.length +
    draftFilters.selectedGenders.length +
    draftFilters.selectedCountries.length +
    (draftFilters.showFreeOnly ? 1 : 0) +
    (draftFilters.isAsapOnly ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (draftFilters.dateFrom || draftFilters.dateTo ? 1 : 0);

  // Filter mentors logic (using APPLIED filters)
  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      const role = (mentor.role || '').toLowerCase();
      const topics = (mentor.topics || []).map((t) => t.toLowerCase()).join(' ');
      const intro = (mentor.intro || '').toLowerCase();
      const fullText = `${role} ${topics} ${intro}`;

      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = mentor.name?.toLowerCase().includes(query);
        const matchesRole = role.includes(query);
        const matchesIntro = intro.includes(query);
        const matchesTopics = mentor.topics?.some((t) => t.toLowerCase().includes(query));

        if (!matchesName && !matchesRole && !matchesIntro && !matchesTopics) {
          return false;
        }
      }

      // 2. Expertise / Category filter (Top Rail)
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'asap') {
          const hasSlots = (mentor.availability && mentor.availability.length > 0) || (mentor.slots && mentor.slots.length > 0);
          if (!hasSlots) return false;
        } else if (selectedCategory === 'notable') {
          if ((mentor.courses || 0) < 1) return false;
        } else if (selectedCategory === 'new') {
          if ((mentor.courses || 0) > 3) return false;
        } else {
          const catObj = EXPERTISE_CATEGORIES.find((c) => c.id === selectedCategory);
          if (catObj && catObj.keywords.length > 0) {
            const matchesKeywords = catObj.keywords.some((kw) => fullText.includes(kw));
            if (!matchesKeywords) return false;
          }
        }
      }

      // 3. ASAP Sidebar Filter
      if (appliedFilters.isAsapOnly) {
        const hasSlots = (mentor.availability && mentor.availability.length > 0) || (mentor.slots && mentor.slots.length > 0);
        if (!hasSlots) return false;
      }

      // 4. Industry Sector Filter
      if (appliedFilters.selectedIndustries.length > 0) {
        const matchesAnyIndustry = appliedFilters.selectedIndustries.some((indId) => {
          const indObj = INDUSTRY_SECTORS.find((i) => i.id === indId);
          if (!indObj) return false;
          return indObj.keywords.some((kw) => fullText.includes(kw));
        });
        if (!matchesAnyIndustry) return false;
      }

      // 5. Price Filter
      if (appliedFilters.showFreeOnly && !mentor.priceLabel?.toLowerCase().includes('free')) {
        return false;
      }

      return true;
    });
  }, [mentors, searchQuery, selectedCategory, appliedFilters]);

  // Reset visible count back to initial batch size whenever filters or search change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [searchQuery, selectedCategory, appliedFilters]);

  const visibleMentors = useMemo(() => {
    return filteredMentors.slice(0, visibleCount);
  }, [filteredMentors, visibleCount]);

  const hasMore = visibleCount < filteredMentors.length;

  // IntersectionObserver for Progressive Infinite Scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + 8);
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTargetRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isLoadingMore]);

  const applyDraftFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const clearAllFilters = () => {
    setDraftFilters(initialSidebarFilters);
    setAppliedFilters(initialSidebarFilters);
    setSearchQuery('');
    setSelectedCategory('all');
    setAccordions({
      availability: false,
      dates: false,
      industry: false,
      level: false,
      gender: false,
      country: false,
    });
  };

  const LEVEL_OPTIONS = [
    'Entry Level (1-2 yrs)',
    'Intermediate (2-4 yrs)',
    'Mid-Level (4-6 yrs)',
    'Senior (6-8 yrs)',
    'Lead / Staff (8+ yrs)',
    'Manager',
    'Director',
    'Executive / VP',
    'Founder / C-Level',
  ];

  const minToDate = useMemo(() => {
    if (!draftFilters.dateFrom) return new Date();
    try {
      return parseISO(`${draftFilters.dateFrom}T00:00:00`);
    } catch {
      return new Date();
    }
  }, [draftFilters.dateFrom]);

  return (
    <motion.div layout className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10 w-full items-start">
      {/* ── Left Content Column (Hero Header + Stats + Benefits + Mentors Grid) ── */}
      <motion.div
        layout
        transition={{ duration: 0.4, ease: easeCurve }}
        className="flex-1 min-w-0 flex flex-col gap-8 md:gap-10 w-full"
      >
        {/* Hero Header */}
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 w-full">
            <div className="flex flex-col gap-3 md:gap-4 flex-1 max-w-4xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold text-[#040B37] tracking-[-0.02em] leading-[1.2] font-inter">
                Explore Mentors
              </h1>
              <p className="text-[14px] sm:text-[15px] xl:text-[16px] font-medium text-[#4B5563] tracking-[-0.01em] font-inter leading-relaxed w-full">
                Browse verified mentors and book personalized 1:1 sessions. Explore design, tech, and engineering mentors who help with portfolio reviews, interviews, and practical career growth.
              </p>
            </div>

            {/* "Become a mentor" button ONLY visible if user is logged in AND role === INSTRUCTOR | ADMIN | SUPER_ADMIN */}
            {canBecomeMentor && (
              <div className="shrink-0 pt-1">
                <Button
                  variant="gradient"
                  size="sm"
                  rounded="full"
                  onClick={() => setBecomeInstructorModalOpen(true)}
                  rightIcon={<ArrowRight size={15} />}
                >
                  Become a mentor
                </Button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          {/* <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-[20px]">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col gap-1 sm:gap-2">
                  <span className="text-[13px] sm:text-[14px] font-medium text-[#4B5563] tracking-[-0.01em]">
                    {stat.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {stat.isRating && (
                      <Image src="/assets/star.svg" alt="" width={18} height={18} />
                    )}
                    <span className="text-[16px] sm:text-[18px] font-semibold text-[#040B37] tracking-[-0.02em] leading-[1.24]">
                      {stat.value}
                    </span>
                  </div>
                </div>
                {i < stats.length - 1 && (
                  <div className="hidden sm:block w-[1px] h-[36px] bg-[#C8D1E0]" />
                )}
              </div>
            ))}
          </div> */}
        </div>

        {/* What You'll Get Section */}
        {/* <div className="flex flex-col gap-3 md:gap-4">
          <h2 className="text-[20px] sm:text-[22px] lg:text-[24px] font-semibold text-[#040B37] tracking-[-0.02em] font-inter">
            What You&apos;ll Get
          </h2>
          <div className="flex flex-wrap gap-2 md:gap-2.5">
            {MENTORSHIP_BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="px-3 h-[34px] sm:h-[38px] flex items-center bg-background border border-[#C8D1E0] rounded-full text-[13px] sm:text-[14px] font-medium text-[#4B5563] tracking-[-0.01em]"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div> */}

        {/* Meet the Mentors Section */}
        <div className="flex flex-col gap-5 md:gap-6 w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#040B37] tracking-[-0.02em] font-inter">
              Meet the Mentors
            </h2>
            {bookingError && (
              <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
                {bookingError}
              </div>
            )}
          </div>

          {/* Search Bar & Filters Trigger Row */}
          <div className="w-full flex items-center justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF]">
                <Search size={15} />
              </div>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, or role..."
                className="pl-11 pr-9 h-12 text-base rounded-full outline-none border-[#E3E8F4] bg-white focus-visible:ring-primary/30 w-full"
              />
            </div>

            {/* Filter Trigger Button (Pushed to the far right end) */}
            {!isFilterOpen && (
              <Button
                variant="outline"
                rounded="full"
                size="md"
                onClick={() => setIsFilterOpen(true)}
                leftIcon={<SlidersHorizontal size={16} className="transition-colors" />}
                className="h-12 px-5 text-[14px] shrink-0 ml-auto"
              >
                <span>Filters</span>
                {appliedFilterCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1C4ED1] text-white text-[11px] font-bold">
                    {appliedFilterCount}
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* Horizontally Scrollable Expertise/Role Category Bar */}
          <div className="relative w-full">
            <div
              ref={categoryRailRef}
              className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {EXPERTISE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <Button
                    key={cat.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    rounded="full"
                    onClick={() => setSelectedCategory(cat.id)}
                    leftIcon={Icon && <Icon size={15} className={isSelected ? 'text-white' : 'text-[#4B5563]'} />}
                    className={`shrink-0 px-3.5 py-2 text-[13px] sm:text-[14px] font-medium ${isSelected ? 'font-semibold' : 'bg-white hover:bg-[#1C4ED1]/5'
                      }`}
                  >
                    {cat.label}
                  </Button>
                );
              })}
            </div>

            {/* Side Fading Gradient Masks */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background via-background/85 to-transparent transition-opacity duration-200 ${categoryScrollEdges.left ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-background via-background/85 to-transparent transition-opacity duration-200 ${categoryScrollEdges.right ? 'opacity-100' : 'opacity-0'
                }`}
            />
          </div>

          {/* Filtered Mentors Grid with Progressive Scroll & Skeleton Loaders */}
          <AnimatePresence mode="popLayout">
            {isLoadingInitial ? (
              <div
                className={`grid gap-4 sm:gap-5 ${isFilterOpen
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5'
                  }`}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <MentorCardSkeleton key={`initial-skeleton-${index}`} />
                ))}
              </div>
            ) : filteredMentors.length > 0 ? (
              <div className="flex flex-col gap-6 w-full">
                <motion.div
                  layout
                  key="mentors-grid"
                  className={`grid gap-4 sm:gap-5 ${isFilterOpen
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5'
                    }`}
                >
                  {visibleMentors.map((mentor) => (
                    <motion.div
                      key={mentor.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        layout: springLayout,
                        opacity: { duration: 0.25 },
                      }}
                    >
                      <MentorCard {...mentor} />
                    </motion.div>
                  ))}

                  {/* Skeleton Cards rendered while fetching next batch via infinite scroll */}
                  {isLoadingMore &&
                    Array.from({ length: 4 }).map((_, index) => (
                      <MentorCardSkeleton key={`scroll-skeleton-${index}`} />
                    ))}
                </motion.div>

                {/* Sentinel Element for Intersection Observer */}
                {hasMore && <div ref={observerTargetRef} className="h-8 w-full" />}
              </div>
            ) : (
              <motion.div
                layout
                key="empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-[18px] border border-[#E3E8F4] bg-white p-10 text-center flex flex-col items-center gap-3"
              >
                <div className="w-11 h-11 rounded-full bg-[#F4F6FB] flex items-center justify-center text-[#9CA3AF]">
                  <Search size={20} />
                </div>
                <p className="text-[17px] font-bold text-[#040B37]">No mentors found</p>
                <p className="text-[13px] font-medium text-[#9CA3AF] max-w-sm">
                  We couldn&apos;t find any mentors matching your search or filters. Try adjusting your search query or reset filters.
                </p>
                <Button
                  variant="secondary"
                  rounded="full"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mt-1 text-[13px] font-semibold"
                >
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Right Column: Framer Motion Spring Sidebar Panel ── */}
      <AnimatePresence initial={false}>
        {isFilterOpen && (
          <motion.aside
            key="filter-sidebar"
            initial={{ width: 0, opacity: 0, x: 20 }}
            animate={{ width: typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 'auto', opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: easeCurve }}
            className="shrink-0 sticky top-28 h-[calc(100vh-8rem)] flex flex-col border-l border-[#E3E8F4] w-full sm:w-[280px] lg:w-[300px] xl:w-[330px] overflow-hidden"
          >
            {/* Tier 1: Fixed Clean Panel Header (With Filter Count Badge Restored) */}
            <div className="px-4 sm:px-5 pt-3.5 pb-3.5 border-b border-[#E3E8F4] flex items-center justify-between shrink-0 bg-white z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(false)}
                leftIcon={<ArrowLeft size={18} className="text-[#040B37]" />}
                className="text-[16px] font-bold text-[#040B37] hover:text-[#1C4ED1] p-0 h-auto"
              >
                Filters
              </Button>
              {draftFilterCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#040B37] text-white text-[12px] font-bold">
                  {draftFilterCount} {draftFilterCount === 1 ? 'filter selected' : 'filters selected'}
                </span>
              )}
            </div>

            {/* Tier 2: Scrollable Middle Container (Accordions strictly isolated here) */}
            <div className="flex-1 overflow-y-auto pl-4 sm:pl-5 pr-3 py-4 custom-scrollbar space-y-5">
              {/* Accordion 1: Availability */}
              <div className="border-b border-[#E3E8F4] pb-4">
                <div className="flex items-center justify-between w-full py-1">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('availability')}
                    className="flex items-center justify-between flex-1 text-left focus:outline-none cursor-pointer"
                  >
                    <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#040B37]">Availability</h4>
                    {accordions.availability ? <ChevronUp size={15} className="text-[#9CA3AF]" /> : <ChevronDown size={15} className="text-[#9CA3AF]" />}
                  </button>
                  {accordions.availability && (draftFilters.showFreeOnly || draftFilters.isAsapOnly) && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, showFreeOnly: false, isAsapOnly: false }))}
                      className="ml-3 text-[12px] font-medium text-[#FF5B5B] hover:underline"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {accordions.availability && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeCurve }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-3">
                        {/* Free Sessions Toggle */}
                        <div className="flex items-center justify-between py-1.5">
                          <div>
                            <p className="text-[13px] font-semibold text-[#040B37]">Free sessions only</p>
                            <p className="text-[11px] text-[#4B5563]">100% free booking slots</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={draftFilters.showFreeOnly}
                            onClick={() =>
                              setDraftFilters((prev) => ({ ...prev, showFreeOnly: !prev.showFreeOnly }))
                            }
                            className={`relative inline-flex h-5.5 w-10 p-0.5 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${draftFilters.showFreeOnly ? 'bg-[#1C4ED1]' : 'bg-[#D1D5DB]'
                              }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${draftFilters.showFreeOnly ? 'translate-x-4.5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </div>

                        <div className="border-t border-[#F4F6FB]" />

                        {/* Available ASAP Toggle */}
                        <div className="flex items-center justify-between py-1.5">
                          <div>
                            <p className="text-[13px] font-semibold text-[#040B37]">Available ASAP</p>
                            <p className="text-[11px] text-[#4B5563]">Active slots open within next week</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={draftFilters.isAsapOnly}
                            onClick={() =>
                              setDraftFilters((prev) => ({ ...prev, isAsapOnly: !prev.isAsapOnly }))
                            }
                            className={`relative inline-flex h-5.5 w-10 p-0.5 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${draftFilters.isAsapOnly ? 'bg-[#1C4ED1]' : 'bg-[#D1D5DB]'
                              }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${draftFilters.isAsapOnly ? 'translate-x-4.5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Fixed Dates */}
              <div className="border-b border-[#E3E8F4] pb-4">
                <div className="flex items-center justify-between w-full py-1">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('dates')}
                    className="flex items-center justify-between flex-1 text-left focus:outline-none cursor-pointer"
                  >
                    <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#040B37]">Search within fixed dates</h4>
                    {accordions.dates ? <ChevronUp size={15} className="text-[#9CA3AF]" /> : <ChevronDown size={15} className="text-[#9CA3AF]" />}
                  </button>
                  {accordions.dates && (draftFilters.dateFrom || draftFilters.dateTo) && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, dateFrom: '', dateTo: '' }))}
                      className="ml-3 text-[12px] font-medium text-[#FF5B5B] hover:underline"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {accordions.dates && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeCurve }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 grid grid-cols-2 gap-2.5">
                        <ScheduleDatePicker
                          value={draftFilters.dateFrom}
                          onChange={(val) => setDraftFilters((prev) => ({ ...prev, dateFrom: val }))}
                          minDate={new Date()}
                          placeholder="From"
                        />
                        <ScheduleDatePicker
                          value={draftFilters.dateTo}
                          onChange={(val) => setDraftFilters((prev) => ({ ...prev, dateTo: val }))}
                          minDate={minToDate}
                          placeholder="To"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 3: Industry Sector */}
              <div className="border-b border-[#E3E8F4] pb-4">
                <div className="flex items-center justify-between w-full py-1">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('industry')}
                    className="flex items-center justify-between flex-1 text-left focus:outline-none cursor-pointer"
                  >
                    <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#040B37]">Industry</h4>
                    {accordions.industry ? <ChevronUp size={15} className="text-[#9CA3AF]" /> : <ChevronDown size={15} className="text-[#9CA3AF]" />}
                  </button>
                  {accordions.industry && draftFilters.selectedIndustries.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, selectedIndustries: [] }))}
                      className="ml-3 text-[12px] font-medium text-[#FF5B5B] hover:underline"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {accordions.industry && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeCurve }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-2.5">
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                          <input
                            type="text"
                            value={industrySearch}
                            onChange={(e) => setIndustrySearch(e.target.value)}
                            placeholder="Search industries..."
                            className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[#F4F6FB] border border-[#E3E8F4] rounded-lg outline-none focus:border-[#1C4ED1]"
                          />
                        </div>

                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                          {filteredIndustrySectors.map((ind) => {
                            const Icon = ind.icon;
                            const isChecked = draftFilters.selectedIndustries.includes(ind.id);
                            return (
                              <label
                                key={ind.id}
                                onClick={() => toggleDraftIndustry(ind.id)}
                                className="group flex items-center gap-2 py-1 px-1 rounded-lg cursor-pointer hover:bg-[#F4F6FB] transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => { }}
                                  className="h-3.5 w-3.5 rounded border-[#C8D1E0] text-[#1C4ED1] focus:ring-[#1C4ED1] cursor-pointer shrink-0"
                                />
                                <Icon
                                  size={15}
                                  className={`transition-colors shrink-0 ${isChecked ? 'text-[#1C4ED1]' : 'text-[#9CA3AF] group-hover:text-[#1C4ED1]'
                                    }`}
                                />
                                <span
                                  className={`text-[12px] sm:text-[13px] font-medium transition-colors ${isChecked ? 'text-[#1C4ED1] font-semibold' : 'text-[#040B37] group-hover:text-[#1C4ED1]'
                                    }`}
                                >
                                  {ind.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 4: Experience Level */}
              <div className="border-b border-[#E3E8F4] pb-4">
                <div className="flex items-center justify-between w-full py-1">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('level')}
                    className="flex items-center justify-between flex-1 text-left focus:outline-none cursor-pointer"
                  >
                    <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#040B37]">Experience Level</h4>
                    {accordions.level ? <ChevronUp size={15} className="text-[#9CA3AF]" /> : <ChevronDown size={15} className="text-[#9CA3AF]" />}
                  </button>
                  {accordions.level && draftFilters.selectedLevels.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, selectedLevels: [] }))}
                      className="ml-3 text-[12px] font-medium text-[#FF5B5B] hover:underline"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {accordions.level && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeCurve }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-2">
                        {LEVEL_OPTIONS.map((lvl) => {
                          const isChecked = draftFilters.selectedLevels.includes(lvl);
                          return (
                            <label
                              key={lvl}
                              onClick={() => toggleDraftLevel(lvl)}
                              className="group flex items-center gap-2 py-1 px-1 rounded-lg cursor-pointer hover:bg-[#F4F6FB] transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => { }}
                                className="h-3.5 w-3.5 rounded border-[#C8D1E0] text-[#1C4ED1] focus:ring-[#1C4ED1] cursor-pointer shrink-0"
                              />
                              <span
                                className={`text-[12px] sm:text-[13px] font-medium transition-colors ${isChecked ? 'text-[#1C4ED1] font-semibold' : 'text-[#4B5563] group-hover:text-[#040B37]'
                                  }`}
                              >
                                {lvl}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 5: Gender */}
              <div className="border-b border-[#E3E8F4] pb-4">
                <div className="flex items-center justify-between w-full py-1">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('gender')}
                    className="flex items-center justify-between flex-1 text-left focus:outline-none cursor-pointer"
                  >
                    <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#040B37]">Gender</h4>
                    {accordions.gender ? <ChevronUp size={15} className="text-[#9CA3AF]" /> : <ChevronDown size={15} className="text-[#9CA3AF]" />}
                  </button>
                  {accordions.gender && draftFilters.selectedGenders.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, selectedGenders: [] }))}
                      className="ml-3 text-[12px] font-medium text-[#FF5B5B] hover:underline"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {accordions.gender && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeCurve }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-2">
                        {GENDER_OPTIONS.map((g) => {
                          const isChecked = draftFilters.selectedGenders.includes(g);
                          return (
                            <label
                              key={g}
                              onClick={() => toggleDraftGender(g)}
                              className="group flex items-center gap-2 py-1 px-1 rounded-lg cursor-pointer hover:bg-[#F4F6FB] transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => { }}
                                className="h-3.5 w-3.5 rounded border-[#C8D1E0] text-[#1C4ED1] focus:ring-[#1C4ED1] cursor-pointer shrink-0"
                              />
                              <span
                                className={`text-[12px] sm:text-[13px] font-medium transition-colors ${isChecked ? 'text-[#1C4ED1] font-semibold' : 'text-[#4B5563] group-hover:text-[#040B37]'
                                  }`}
                              >
                                {g}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 6: Country */}
              <div className="pb-4">
                <div className="flex items-center justify-between w-full py-1">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('country')}
                    className="flex items-center justify-between flex-1 text-left focus:outline-none cursor-pointer"
                  >
                    <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#040B37]">Country</h4>
                    {accordions.country ? <ChevronUp size={15} className="text-[#9CA3AF]" /> : <ChevronDown size={15} className="text-[#9CA3AF]" />}
                  </button>
                  {accordions.country && draftFilters.selectedCountries.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, selectedCountries: [] }))}
                      className="ml-3 text-[12px] font-medium text-[#FF5B5B] hover:underline"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {accordions.country && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeCurve }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-2.5">
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search countries..."
                            className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[#F4F6FB] border border-[#E3E8F4] rounded-lg outline-none focus:border-[#1C4ED1]"
                          />
                        </div>

                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                          {filteredCountries.map((c) => {
                            const isChecked = draftFilters.selectedCountries.includes(c);
                            return (
                              <label
                                key={c}
                                onClick={() => toggleDraftCountry(c)}
                                className="group flex items-center gap-2 py-1 px-1 rounded-lg cursor-pointer hover:bg-[#F4F6FB] transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => { }}
                                  className="h-3.5 w-3.5 rounded border-[#C8D1E0] text-[#1C4ED1] focus:ring-[#1C4ED1] cursor-pointer shrink-0"
                                />
                                <span
                                  className={`text-[12px] sm:text-[13px] font-medium transition-colors ${isChecked ? 'text-[#1C4ED1] font-semibold' : 'text-[#040B37] group-hover:text-[#1C4ED1]'
                                    }`}
                                >
                                  {c}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tier 3: Permanently Pinned Footer Base Bar (Disabled when no filter selected) */}
            <div className="px-4 sm:px-5 py-3 border-t border-[#E3E8F4] bg-white flex items-center justify-between z-20 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                disabled={draftFilterCount === 0}
                className={`text-[13px] font-bold text-[#4B5563] hover:text-[#040B37] ${draftFilterCount === 0 ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                  }`}
              >
                Clear all
              </Button>
              <Button
                variant="default"
                size="md"
                rounded="full"
                onClick={applyDraftFilters}
                disabled={draftFilterCount === 0}
                className={`text-[13px] font-bold px-4 py-2 ${draftFilterCount === 0 ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                  }`}
              >
                Show results
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <BecomeInstructorModal
        open={becomeInstructorModalOpen}
        onClose={() => setBecomeInstructorModalOpen(false)}
      />
    </motion.div>
  );
}
