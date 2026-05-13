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
      <nav className="fixed top-0 left-0 right-0 h-18 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md border-b border-[#C8D1E0]">
        <div className="mx-auto max-w-[83rem] px-4 flex items-center justify-between w-full">
          {/* Logo & Links Group */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <Image 
                src="/assets/Group 162.svg" 
                alt="CSCN Logo" 
                width={34} 
                height={33} 
                className="h-9 w-auto"
              />
            </Link>

            <div className="hidden lg:flex gap-2 items-center">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link 
                    key={link.name} 
                    href={link.path}
                    className={`px-3 py-2 text-base transition-colors hover:text-primary tracking-tight rounded-sm ${
                      isActive ? 'text-primary font-bold bg-primary/5' : 'text-text-body font-medium'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Actions Group */}
          <div className="flex items-center gap-3.5">
            <button className="p-2.5 hover:bg-black/5 rounded-full transition-colors" aria-label="Search">
              <Image 
                src="/assets/search-01.svg" 
                alt="Search" 
                width={24} 
                height={24} 
                className="w-6 h-6"
              />
            </button>
            
            <div className="hidden lg:block">
              <Link href={isLoggedIn ? "/dashboard" : "/signin"}>
                <Button variant="primary" size="md">
                  {isLoggedIn ? "Go to Dashboard" : "Sign in"}
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
            <Button variant="primary" size="lg" className="w-full">
              {isLoggedIn ? "Go to Dashboard" : "Sign in"}
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
