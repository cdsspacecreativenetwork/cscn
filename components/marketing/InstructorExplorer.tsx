'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, Search, Star, Users } from 'lucide-react';

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

const FEATURED_EXPERTISE = [
  'All',
  'Product Design',
  'Brand Design',
  'UI/UX Design',
  'Web Development',
  'AI & Automation',
  'Career Growth',
];

export default function InstructorExplorer({ instructors }: InstructorExplorerProps) {
  const [query, setQuery] = useState('');
  const [activeExpertise, setActiveExpertise] = useState('All');

  const expertiseOptions = useMemo(() => {
    const available = new Set(instructors.flatMap((instructor) => instructor.expertise));
    const curated = FEATURED_EXPERTISE.filter((item) => item === 'All' || available.has(item));
    const extra = Array.from(available).filter((item) => !curated.includes(item)).slice(0, 4);
    return [...curated, ...extra];
  }, [instructors]);

  const filteredInstructors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return instructors.filter((instructor) => {
      const matchesExpertise =
        activeExpertise === 'All' || instructor.expertise.includes(activeExpertise);
      const searchable = [instructor.name, instructor.headline, ...instructor.expertise]
        .join(' ')
        .toLowerCase();
      return matchesExpertise && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeExpertise, instructors, query]);

  return (
    <section id="meet-instructors" className="mx-auto w-full max-w-[83rem] px-4 py-20 md:py-28">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-primary">
            Instructor directory
          </p>
          <h2 className="mt-3 font-inter text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] text-navy md:text-[42px]">
            Find the right expert for your next leap
          </h2>
        </div>
        <p className="max-w-[430px] text-[15px] font-medium leading-7 text-text-body md:text-right">
          Search by skill or browse disciplines to meet the people behind CSCN&apos;s practical learning experiences.
        </p>
      </div>

      <div className="mt-10 rounded-[24px] border border-stroke bg-white p-3 shadow-[0_12px_40px_rgba(4,11,55,0.05)] md:p-4">
        <label className="flex min-h-14 items-center gap-3 rounded-[16px] bg-background px-4 md:px-5">
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="sr-only">Search instructors</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, role, or expertise"
            className="w-full bg-transparent text-[15px] font-medium text-navy outline-none placeholder:text-text-mute"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-text-body transition-colors hover:bg-white hover:text-navy"
            >
              Clear
            </button>
          )}
        </label>
      </div>

      {expertiseOptions.length > 1 && (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {expertiseOptions.map((expertise) => (
            <button
              key={expertise}
              type="button"
              onClick={() => setActiveExpertise(expertise)}
              aria-pressed={activeExpertise === expertise}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all ${
                activeExpertise === expertise
                  ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(28,78,209,0.18)]'
                  : 'border-stroke-ii bg-transparent text-text-body hover:border-primary/50 hover:text-primary'
              }`}
            >
              {expertise}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <p className="text-[14px] font-semibold text-text-body">
          <span className="text-navy">{filteredInstructors.length}</span>{' '}
          {filteredInstructors.length === 1 ? 'instructor' : 'instructors'}
        </p>
      </div>

      {filteredInstructors.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredInstructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructor/${instructor.slug}`}
              className="group overflow-hidden rounded-[24px] border border-stroke bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_55px_rgba(4,11,55,0.10)]"
            >
              <div className="relative aspect-[4/4.35] overflow-hidden bg-[#E8ECF6]">
                <Image
                  src={instructor.image}
                  alt={instructor.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 300px"
                  unoptimized={instructor.image.endsWith('.svg')}
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy/75 via-navy/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {instructor.expertise.slice(0, 2).map((skill) => (
                      <span key={skill} className="rounded-full border border-white/20 bg-navy/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-navy transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-navy">
                  {instructor.name}
                </h3>
                <p className="mt-1 min-h-10 line-clamp-2 text-[13px] font-medium leading-5 text-text-body">
                  {instructor.headline}
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-stroke pt-4 text-[11px] font-semibold text-text-mute">
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-dashed border-stroke-ii bg-white px-6 py-16 text-center">
          <p className="text-[18px] font-semibold text-navy">No instructors match that search</p>
          <p className="mt-2 text-[14px] font-medium text-text-mute">Try another skill, role, or category.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveExpertise('All');
            }}
            className="mt-5 text-[14px] font-bold text-primary hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
