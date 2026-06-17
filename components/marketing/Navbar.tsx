'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Button from '../ui/Button';

const navLinks = [
  { name: 'Courses', path: '/courses' },
  { name: 'Community', path: '/community' },
  { name: 'Certificate', path: '/certificate' },
  { name: 'Resources', path: '/resources' },
  { name: 'Mentorship', path: '/mentorship' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = status === "authenticated";

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
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link 
                    key={link.name} 
                    href={link.path}
                    className={`rounded-full px-3 py-1.5 text-[14px] transition-colors hover:text-primary tracking-tight xl:px-3.5 ${
                      isActive ? 'bg-primary/5 font-bold text-primary' : 'font-medium text-text-body'
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
                  className="min-w-[118px] xl:min-w-[132px]"
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
