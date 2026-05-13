'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export interface LegalSection {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  badge: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  children: React.ReactNode;
}

export default function LegalLayout({
  title,
  badge,
  lastUpdated,
  intro,
  sections,
  children,
}: LegalLayoutProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [sections]);

  const handleNav = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-[#E3E8F4] pt-[72px]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 xl:px-16 py-14 xl:py-20">
          <span className="inline-block text-[12px] font-semibold text-[#1C4ED1] bg-[#EFF3FF] px-3 py-1 rounded-full mb-5 tracking-widest uppercase">
            {badge}
          </span>
          <h1 className="text-[36px] md:text-[48px] xl:text-[56px] font-semibold text-[#040B37] leading-tight tracking-tight font-outfit mb-4">
            {title}
          </h1>
          <p className="text-[14px] text-[#9CA3AF] font-medium mb-6">
            Last updated: {lastUpdated}
          </p>
          <p className="text-[17px] text-[#4B5563] leading-relaxed max-w-[680px]">
            {intro}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 xl:py-16 bg-[#F4F6FB]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 xl:px-16">
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-14 items-start">

            {/* Sticky TOC */}
            <aside className="w-full lg:w-[260px] shrink-0">
              <div className="sticky top-[88px]">
                <div className="bg-white rounded-[12px] border border-[#E3E8F4] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E3E8F4]">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
                      On this page
                    </p>
                  </div>
                  <nav className="px-2 py-2">
                    {sections.map(({ id, label }) => {
                      const isActive = activeId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => handleNav(id)}
                          className={`w-full text-left px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-150 flex items-center gap-2.5 ${
                            isActive
                              ? 'bg-[#EFF3FF] text-[#1C4ED1]'
                              : 'text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                              isActive ? 'bg-[#1C4ED1]' : 'bg-[#E3E8F4]'
                            }`}
                          />
                          {label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="mt-3 bg-white rounded-[12px] border border-[#E3E8F4] px-5 py-5">
                  <p className="text-[14px] font-semibold text-[#040B37] mb-1">Have questions?</p>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed mb-4">
                    Our team is happy to clarify anything in this document.
                  </p>
                  <Link
                    href="mailto:legal@cscn.com"
                    className="text-[13px] font-semibold text-[#1C4ED1] hover:underline underline-offset-2"
                  >
                    Contact legal team →
                  </Link>
                </div>
              </div>
            </aside>

            {/* Article */}
            <article className="flex-1 min-w-0 bg-white rounded-[12px] border border-[#E3E8F4] px-6 md:px-10 xl:px-14 py-10 xl:py-14">
              {children}
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
