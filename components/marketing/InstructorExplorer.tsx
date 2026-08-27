'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Search, SearchX, Star, Users, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { EXPERTISE_CATEGORIES } from '@/lib/categories';
import { Separator } from '@/components/ui/Separator';

export type PublicInstructorCard = {
  id: string;
  name: string;
  headline: string;
  image: string;
  slug: string;
  expertise: string[];
  courses: number;
  students: number;
  rating: number;
  ratingCount: number;
};

type InstructorExplorerProps = {
  instructors: PublicInstructorCard[];
};

export default function InstructorExplorer({ instructors }: InstructorExplorerProps) {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const [categoryScrollEdges, setCategoryScrollEdges] = useState({ left: false, right: false });

  // Debounce search input (~300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const filteredInstructors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return instructors.filter((instructor) => {
      const searchable = [instructor.name, instructor.headline, ...instructor.expertise]
        .join(' ')
        .toLowerCase();

      let matchesCategory = true;
      if (activeCategoryId !== 'all') {
        const catObj = EXPERTISE_CATEGORIES.find((c) => c.id === activeCategoryId);
        if (catObj && catObj.keywords.length > 0) {
          matchesCategory = catObj.keywords.some((kw) => searchable.includes(kw));
        } else {
          matchesCategory = searchable.includes(activeCategoryId.toLowerCase());
        }
      }

      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategoryId, instructors, query]);

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

  return (
    <section id="meet-instructors" className="overflow-hidden bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-[83rem] px-4">
      <div className="max-w-[720px]">
        <h1 className="font-inter text-[2.5rem] font-semibold leading-[1.12] tracking-tight text-navy md:text-[3.5rem]">
          Find an instructor for<br className="hidden sm:block" /> where you want to go
        </h1>
        <p className="mt-5 max-w-[620px] text-lg font-medium leading-relaxed text-text-body md:text-xl">
          Learn from experienced professionals teaching practical, career-ready skills.
        </p>
      </div>

      {/* ── Debounced Search Bar (Modeled after /mentorship) ───────────── */}
      <div className="mt-10 max-w-xl">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF]">
            <Search size={19} />
          </div>
          <Input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, role, or expertise..."
            className="pl-12 pr-10 h-14 text-[15px] rounded-full outline-none border-[#E3E8F4] bg-white focus-visible:ring-primary/30"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#040B37] transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Scroll Rail with Faded Edges ──────────────────────── */}
      <div className="relative mt-8">
        <div
          ref={categoryRailRef}
          className="flex gap-2.5 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {EXPERTISE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#1C4ED1] border-[#1C4ED1] text-white font-semibold'
                    : 'bg-white border-[#E3E8F4] text-[#4B5563] hover:border-[#1C4ED1] hover:text-[#1C4ED1] hover:bg-[#1C4ED1]/5'
                }`}
              >
                <Icon className={`h-4 w-4 transition-colors ${isSelected ? 'text-white' : 'text-[#4B5563] group-hover:text-[#1C4ED1]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-background via-background/85 to-transparent transition-opacity duration-200 ${categoryScrollEdges.left ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background via-background/85 to-transparent transition-opacity duration-200 ${categoryScrollEdges.right ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div className="mt-12 flex items-center justify-between border-b border-stroke pb-4">
        <h2 className="font-inter text-[24px] font-semibold tracking-tight text-navy">Instructors</h2>
        <p className="text-[13px] font-medium text-text-mute">
          <span className="font-semibold text-text-body">{filteredInstructors.length}</span>{' '}
          {filteredInstructors.length === 1 ? 'instructor' : 'instructors'}
        </p>
      </div>

      {filteredInstructors.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredInstructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructor/${instructor.slug}`}
              className="group block"
            >
              <Card className="h-full overflow-hidden rounded-[24px] border-stroke transition-shadow duration-300 group-hover:shadow-xl">
              <div className="relative aspect-[4/3.25] overflow-hidden bg-[#E8ECF6]">
                <Image
                  src={instructor.image}
                  alt={instructor.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  unoptimized={instructor.image.endsWith('.svg')}
                />
              </div>
              <CardHeader className="p-5 pb-0">
                <CardTitle className="truncate">
                  {instructor.name}
                </CardTitle>
                <p className="mt-1 min-h-10 line-clamp-2 font-inter text-[14px] font-medium leading-5 text-text-body">
                  {instructor.headline}
                </p>
              </CardHeader>
              <CardContent className="mt-auto px-5 pb-5 pt-4">
                <Separator />
                <CardFooter className="gap-3 px-0 pb-0 pt-4 font-inter text-[11px] font-medium text-text-mute">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    {instructor.courses} {instructor.courses === 1 ? 'course' : 'courses'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {instructor.students.toLocaleString()}
                  </span>
                  {instructor.ratingCount > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-navy">
                      <Star className="h-3.5 w-3.5 fill-[#F8B84E] text-[#F8B84E]" />
                      {instructor.rating.toFixed(1)}
                    </span>
                  )}
                </CardFooter>
              </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState className="mt-5 rounded-[24px] py-16">
          <EmptyStateIcon><SearchX /></EmptyStateIcon>
          <EmptyStateTitle>No instructors match that search</EmptyStateTitle>
          <EmptyStateDescription>Try another skill, role, or category.</EmptyStateDescription>
          <EmptyStateContent>
            <Button
              type="button"
              variant="secondary"
              size="md"
              rounded="full"
              onClick={() => {
                setSearchInput('');
                setQuery('');
                setActiveCategoryId('all');
                }}
            >
              Reset filters
            </Button>
          </EmptyStateContent>
        </EmptyState>
      )}
      </div>
    </section>
  );
}
