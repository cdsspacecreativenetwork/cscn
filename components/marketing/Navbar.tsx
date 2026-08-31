'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Button from '../ui/Button';

const exploreLinks = [
  { name: 'Courses', path: '/courses' },
  { name: 'Cohorts', path: '/cohorts' },
  { name: 'Mentorship', path: '/mentorship' },
  { name: 'Showcase', path: '/showcase' },
  { name: 'Career Hub', path: '/career' },
];

const navLinks = [
  // { name: 'Teach on CSCN', path: '/teach' },
  { name: 'Community', path: '/community' },
  { name: 'For Teams', path: '/teams' },
  { name: 'For Instructors', path: '/teach' },
  { name: 'Resources', path: '/resources' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const { status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = status === "authenticated";
  const isExploreActive = exploreLinks.some((link) => pathname === link.path || pathname.startsWith(`${link.path}/`));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center border-b border-[#C8D1E0] bg-background/86 backdrop-blur-md">
        <div className="mx-auto flex min-h-[70px] w-full max-w-[88rem] items-center justify-between gap-4 px-4 lg:min-h-[76px] lg:px-6">
          {/* Logo & Links Group */}
          <div className="flex items-center gap-4 xl:gap-6">
            <Link href="/" className="flex items-center shrink-0">
              <Image 
                src="/assets/Group 162.svg" 
                alt="CSCN Logo" 
                width={34} 
                height={33} 
                className="h-8 w-auto lg:h-9"
                unoptimized
              />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              <div
                className="relative"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsExploreOpen(false);
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsExploreOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setIsExploreOpen(false);
                  }}
                  aria-expanded={isExploreOpen}
                  aria-controls="explore-navigation"
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] font-medium tracking-tight transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 xl:px-3.5 ${
                    isExploreActive ? 'text-primary' : 'text-text-body'
                  }`}
                >
                  Explore
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {isExploreOpen && (
                  <div id="explore-navigation" className="absolute left-0 top-full pt-3">
                    <div className="w-56 rounded-[18px] border border-stroke bg-white p-2 shadow-[0_18px_48px_rgba(4,11,55,0.12)]">
                      {exploreLinks.map((link) => {
                        const isActive = pathname === link.path || pathname.startsWith(`${link.path}/`);
                        return (
                          <Link
                            key={link.name}
                            href={link.path}
                            onClick={() => setIsExploreOpen(false)}
                            className={`flex rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-background hover:text-primary ${
                              isActive ? 'bg-primary/5 text-primary' : 'text-text-body'
                            }`}
                          >
                            {link.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {navLinks.map((link) => {
                const isActive = pathname === link.path || pathname.startsWith(`${link.path}/`);
                return (
                  <Link 
                    key={link.name} 
                    href={link.path}
                    className={`rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors hover:text-primary tracking-tight xl:px-3.5 ${
                      isActive ? 'text-primary' : 'text-text-body'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Actions Group */}
          <div className="flex items-center gap-2.5 lg:gap-3">
            {/* <button className="rounded-full p-2 transition-colors hover:bg-black/5" aria-label="Search">
              <Image 
                src="/assets/search-01.svg" 
                alt="Search" 
                width={24} 
                height={24} 
                className="h-5 w-5"
                unoptimized
              />
            </button> */}
            
            <div className="hidden lg:block">
              <Link href={isLoggedIn ? "/dashboard" : "/signin"}>
                <Button
                  variant="gradient"
                  size="sm"
                  rounded="full"
                >
                  {isLoggedIn ? "Dashboard" : "Sign in"}
                </Button>
              </Link>
            </div>
            
            <button 
              className="lg:hidden flex items-center justify-center w-10 h-10 transition-all active:scale-95 text-navy"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <X size={32} strokeWidth={2} />
              ) : (
                <Image 
                  src="/assets/menu.svg" 
                  alt="Menu" 
                  width={32} 
                  height={32} 
                  className="w-8 h-8 brightness-0"
                  unoptimized
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-[90] pt-[6.25rem] px-6 pb-6 flex flex-col gap-6 lg:hidden">
          <div>
            <button
              type="button"
              onClick={() => setIsExploreOpen((open) => !open)}
              aria-expanded={isExploreOpen}
              aria-controls="mobile-explore-navigation"
              className={`flex w-full items-center justify-between rounded-xl px-2 py-1 text-2xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ${isExploreActive ? 'text-primary' : 'text-navy'}`}
            >
              Explore
              <ChevronDown className={`h-6 w-6 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {isExploreOpen && (
              <div id="mobile-explore-navigation" className="mt-4 grid gap-1 border-l-2 border-primary/15 pl-4">
                {exploreLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => {
                      setIsExploreOpen(false);
                      setIsOpen(false);
                    }}
                    className={`rounded-xl px-3 py-2.5 text-lg font-medium transition-colors hover:bg-background hover:text-primary ${
                      pathname === link.path || pathname.startsWith(`${link.path}/`) ? 'text-primary' : 'text-text-body'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.path}
              onClick={() => setIsOpen(false)}
              className="text-2xl font-semibold text-navy hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <hr className="border-none border-t border-stroke" />
          <Link 
            href={isLoggedIn ? "/dashboard" : "/signin"} 
            onClick={() => setIsOpen(false)}
            className="w-full"
          >
            <Button variant="gradient" size="lg" rounded="full" className="w-full">
              {isLoggedIn ? "Go to Dashboard" : "Sign in"}
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
