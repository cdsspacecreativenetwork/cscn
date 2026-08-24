'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bot,
  BookOpen,
  Braces,
  BriefcaseBusiness,
  Clapperboard,
  Code2,
  LayoutGrid,
  Megaphone,
  Palette,
  PenTool,
  SearchX,
  Shapes,
  Star,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
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

const EXPERTISE_CATEGORIES = [
  { label: 'All', icon: LayoutGrid, keywords: [] },
  { label: 'Product Design', icon: PenTool, keywords: ['product design'] },
  { label: 'UI/UX Design', icon: Palette, keywords: ['ui/ux', 'ui design', 'ux design', 'user experience', 'interface design'] },
  { label: 'Brand Design', icon: Tag, keywords: ['brand design', 'branding', 'brand identity'] },
  { label: 'Graphic Design', icon: Shapes, keywords: ['graphic design', 'visual design'] },
  { label: 'Motion Design', icon: Clapperboard, keywords: ['motion design', 'animation', 'motion graphics'] },
  { label: 'Web Development', icon: Code2, keywords: ['web development', 'frontend', 'front-end', 'full stack', 'full-stack'] },
  { label: 'Software Engineering', icon: Braces, keywords: ['software engineering', 'software engineer', 'backend', 'back-end', 'developer'] },
  { label: 'AI & Automation', icon: Bot, keywords: ['artificial intelligence', 'ai ', 'automation', 'machine learning'] },
  { label: 'Product Management', icon: BriefcaseBusiness, keywords: ['product management', 'product manager'] },
  { label: 'Marketing & Growth', icon: Megaphone, keywords: ['marketing', 'growth', 'content strategy'] },
  { label: 'Data & Analytics', icon: BarChart3, keywords: ['data science', 'data analytics', 'analytics', 'data engineer'] },
  { label: 'Career Growth', icon: TrendingUp, keywords: ['career', 'leadership', 'interview', 'portfolio'] },
] as const;

export default function InstructorExplorer({ instructors }: InstructorExplorerProps) {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [activeExpertise, setActiveExpertise] = useState('All');
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const [categoryScrollEdges, setCategoryScrollEdges] = useState({ left: false, right: false });

  const expertiseOptions = useMemo(() => {
    const available = new Set(instructors.flatMap((instructor) => instructor.expertise));
    const curated: string[] = EXPERTISE_CATEGORIES.map((category) => category.label);
    const extra = Array.from(available).filter((item) => !curated.includes(item)).slice(0, 4);
    return [...curated, ...extra];
  }, [instructors]);

  const filteredInstructors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return instructors.filter((instructor) => {
      const searchable = [instructor.name, instructor.headline, ...instructor.expertise]
        .join(' ')
        .toLowerCase();
      const selectedCategory = EXPERTISE_CATEGORIES.find(
        (category) => category.label === activeExpertise
      );
      const matchesExpertise =
        activeExpertise === 'All' ||
        (selectedCategory
          ? selectedCategory.keywords.some((keyword) => searchable.includes(keyword))
          : searchable.includes(activeExpertise.toLowerCase()));
      return matchesExpertise && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeExpertise, instructors, query]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(searchInput.trim());
  };

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
  }, [expertiseOptions.length]);

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

      <form onSubmit={submitSearch} className="mt-10 flex flex-col gap-3 md:flex-row">
        <SearchField
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name, role, or expertise"
          aria-label="Search instructors"
          containerClassName="flex-1"
        />
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          rounded="full"
          className="!h-12 w-full md:w-[220px] [&>span]:h-full"
        >
          Search
        </Button>
      </form>

      {expertiseOptions.length > 1 && (
        <div className="relative mt-8">
          <div
            ref={categoryRailRef}
            className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {expertiseOptions.map((expertise) => {
              const ExpertiseIcon =
                EXPERTISE_CATEGORIES.find((category) => category.label === expertise)?.icon ?? Tag;
              return (
                <Button
                  key={expertise}
                  type="button"
                  variant={activeExpertise === expertise ? 'primary' : 'outline'}
                  size="sm"
                  rounded="full"
                  leftIcon={<ExpertiseIcon className="h-4 w-4" />}
                  onClick={() => setActiveExpertise(expertise)}
                  aria-pressed={activeExpertise === expertise}
                  className="shrink-0"
                >
                  {expertise}
                </Button>
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
      )}

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
                setActiveExpertise('All');
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
