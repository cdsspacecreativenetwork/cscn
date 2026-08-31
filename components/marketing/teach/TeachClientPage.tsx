'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, ExternalLink, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import TeachReasonsSection from '@/components/marketing/teach/TeachReasonsSection';
import HowToBeginSection from '@/components/marketing/teach/HowToBeginSection';
import TeachCTASection from '@/components/marketing/teach/TeachCTASection';

const SPOTLIGHT_INSTRUCTORS = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    title: 'Senior Staff Product Designer',
    company: 'Stripe',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    rating: 4.9,
    studentsCount: '12,400+',
    coursesCount: '4 Courses',
    topics: ['Design Systems', 'Figma', 'UI/UX'],
  },
  {
    id: '2',
    name: 'Alex Rivera',
    title: 'Lead Fullstack Engineer',
    company: 'Vercel',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    rating: 4.95,
    studentsCount: '18,900+',
    coursesCount: '6 Courses',
    topics: ['Next.js', 'React', 'TypeScript'],
  },
  {
    id: '3',
    name: 'Marcus Vance',
    title: 'Principal AI Engineer',
    company: 'Google DeepMind',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    rating: 4.88,
    studentsCount: '9,200+',
    coursesCount: '3 Courses',
    topics: ['Machine Learning', 'Python', 'AI Agents'],
  },
];

export default function TeachClientPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isPending, setIsPending] = useState(false);

  const handleGetStarted = async () => {
    if (isPending) return;
    setIsPending(true);

    try {
      if (status === 'unauthenticated') {
        window.location.assign('/signup?intent=INSTRUCTOR&callbackUrl=/instructor/onboarding');
        return;
      }

      await fetch('/api/onboarding/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'INSTRUCTOR' }),
      }).catch((err) => console.error('Intent save error:', err));

      router.push('/instructor/onboarding');
    } catch (err) {
      console.error('Error starting instructor flow:', err);
      router.push('/instructor/onboarding');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-background text-[#040B37] font-inter overflow-x-hidden pt-24 pb-16">
      {/* SECTION 1: HERO SECTION */}
      <section className="relative w-full bg-background overflow-hidden pt-12 md:pt-16 pb-0">
        <div className="w-full max-w-[86rem] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="hidden md:grid md:grid-cols-12 items-center min-h-[440px] lg:min-h-[480px]">
            <div className="md:col-span-7 lg:col-span-6 flex flex-col justify-center text-left z-10 pr-4 my-auto py-8 lg:py-12">
              <h1 className="text-4xl lg:text-[52px] font-semibold tracking-tight text-[#040B37] leading-[1.12]">
                Come teach <br /> with us
              </h1>
              <p className="text-lg lg:text-[20px] text-[#4B5563] font-normal leading-relaxed mt-4 mb-8 max-w-lg">
                Become an instructor and change lives — including your own
              </p>
              <div>
                <Button
                  variant="gradient"
                  size="lg"
                  rounded="full"
                  hasBorder={true}
                  disableScaleHover={true}
                  loading={isPending}
                  onClick={handleGetStarted}
                  rightIcon={!isPending ? <ArrowRight size={18} /> : undefined}
                  className="text-base font-bold text-white bg-[#1C4ED1]"
                >
                  Get started
                </Button>
              </div>
            </div>

            <div className="md:col-span-5 lg:col-span-6 relative flex items-end justify-end h-[440px] lg:h-[480px] overflow-hidden">
              <img
                src="/images/image.svg"
                alt="CSCN Instructor"
                className="h-full w-auto max-w-full object-cover object-bottom select-none"
              />
            </div>
          </div>

          <div className="flex md:hidden flex-col w-full pb-8">
            <div className="relative w-full h-[280px] sm:h-[340px] flex items-end justify-center overflow-hidden border-b border-[#E2E8F0] mb-6">
              <img
                src="/images/image.svg"
                alt="CSCN Instructor"
                className="h-full w-auto max-w-full object-contain object-bottom select-none"
              />
            </div>

            <div className="flex flex-col text-left px-2">
              <h1 className="text-3xl font-bold tracking-tight text-[#040B37]">
                Come teach with us
              </h1>
              <p className="text-base text-[#4B5563] font-normal leading-relaxed mt-2 mb-6">
                Become an instructor and change lives — including your own
              </p>
              <Button
                variant="gradient"
                size="lg"
                rounded="full"
                hasBorder={true}
                disableScaleHover={true}
                loading={isPending}
                onClick={handleGetStarted}
                rightIcon={!isPending ? <ArrowRight size={18} /> : undefined}
                className="w-full py-3.5 text-base font-bold text-white bg-[#1C4ED1]"
              >
                Get started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: REASONS */}
      <TeachReasonsSection />

      {/* SECTION 3: HOW TO BEGIN */}
      <HowToBeginSection />

      {/* SECTION 4: TOP INSTRUCTORS SPOTLIGHT */}
      <section className="w-full max-w-[84rem] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#040B37]">
              Meet our top instructors
            </h2>
            <p className="text-base text-[#6B7280]">
              Learn from leaders who are actively shaping the tech industry.
            </p>
          </div>

          <a
            href="/instructors"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E3E8F4] bg-white hover:bg-[#F4F6FB] hover:border-[#1C4ED1] text-sm font-semibold text-[#040B37] hover:text-[#1C4ED1] transition-all"
          >
            <span>Show all instructors</span>
            <ExternalLink size={15} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SPOTLIGHT_INSTRUCTORS.map((instructor) => (
            <div
              key={instructor.id}
              className="flex flex-col justify-between p-6 rounded-[24px] bg-white border border-[#E3E8F4] hover:border-[#1C4ED1]/40 transition-all duration-300 shadow-xs"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0 border border-[#E2E8F0]">
                    <Image
                      src={instructor.image}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-[#040B37]">{instructor.name}</h3>
                    <p className="text-xs text-[#6B7280]">{instructor.title}</p>
                    <span className="text-xs font-semibold text-[#1C4ED1]">{instructor.company}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {instructor.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-xs font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#F1F5F9] text-xs font-semibold text-[#6B7280]">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={14} fill="currentColor" />
                  <span>{instructor.rating}</span>
                </div>
                <span>{instructor.studentsCount} Students</span>
                <span>{instructor.coursesCount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: CTA BANNER */}
      <TeachCTASection />
    </div>
  );
}
