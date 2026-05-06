'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FOOTER_LINKS = {
  menu: [
    { name: 'Courses', href: '/courses' },
    { name: 'Community', href: '/community' },
    { name: 'Certificate', href: '/certificate' },
    { name: 'Resources', href: '/resources' },
    { name: 'Mentorship', href: '/mentorship' },
  ],
  discover: [
    { name: 'Figma UIUX Design', href: '/courses/figma-uiux' },
    { name: 'Brand Identity', href: '/courses/brand-identity' },
    { name: 'AI Automation', href: '/courses/ai-automation' },
    { name: 'Grow your brand', href: '/courses/grow-brand' },
  ],
  connect: [
    { name: 'X', href: 'https://x.com' },
    { name: 'Facebook', href: 'https://facebook.com' },
    { name: 'Instagram', href: 'https://instagram.com' },
    { name: 'Linkedin', href: 'https://linkedin.com' },
  ]
};

export default function Footer() {
  return (
    <footer className="relative bg-white pt-10 pb-2 md:pb-4 overflow-hidden">
      {/* Design Baseline Container (1688px) */}
      <div className="mx-auto max-w-[1688px] px-2 lg:px-4">
        <div className="relative bg-[#040B37] rounded-[24px] border-t border-[#111B5C] overflow-hidden flex flex-col pt-10">
          
          {/* Background Dust Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] mix-blend-overlay" />

          {/* Object Vectors - Bottom Left & Right */}
          <div className="absolute -left-[0%] bottom-0 pointer-events-none z-10 opacity-40 lg:opacity-60 scale-x-[-1]">
            <Image 
              src="/assets/footer/Objects.svg" 
              alt="" 
              width={800} 
              height={600} 
              className="object-contain"
            />
          </div>
          <div className="absolute -right-[0%] bottom-0 pointer-events-none z-10 opacity-40 lg:opacity-60">
            <Image 
              src="/assets/footer/Objects.svg" 
              alt="" 
              width={800} 
              height={600} 
              className="object-contain"
            />
          </div>

          {/* Main Content Grid */}
          <div className="relative z-20 flex flex-col lg:flex-row justify-between items-start px-6 md:px-12 lg:px-[180px] gap-16 lg:gap-8">
            {/* Logo & Description */}
            <div className="w-full lg:w-[341px] flex flex-col gap-6 pt-10">
              <Link href="/" className="inline-block h-[44px]">
                <Image 
                  src="/assets/Group 162.svg" 
                  alt="CSCN Logo" 
                  width={45} 
                  height={44} 
                  className="h-11 w-auto"
                />
              </Link>
              <p className="text-[#7F858F] text-sm font-medium leading-relaxed font-inter">
                CSCN is a global learning platform helping creatives and professionals build real skills through courses, mentorship, and community.
              </p>
            </div>

            {/* Vertical Divider (Hidden on Mobile) */}
            <div className="hidden lg:block w-[1px] h-[360px] bg-[#111B5C] self-center" />

            {/* Links Columns */}
            <div className="flex flex-row flex-wrap lg:flex-nowrap gap-x-12 gap-y-12 lg:gap-20 pt-10">
              {/* Menu */}
              <div className="min-w-[76px] flex flex-col">
                <h4 className="text-white font-medium text-base mb-4 font-inter">Menu</h4>
                <div className="flex flex-col gap-0.5">
                  {FOOTER_LINKS.menu.map((link) => (
                    <Link key={link.name} href={link.href} className="text-[#9CA3AF] hover:text-white py-[10.5px] transition-colors font-medium font-inter text-sm whitespace-nowrap">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Discover */}
              <div className="flex flex-col">
                <h4 className="text-white font-medium text-base mb-4 font-inter whitespace-nowrap">Discover top courses</h4>
                <div className="flex flex-col gap-0.5">
                  {FOOTER_LINKS.discover.map((link) => (
                    <Link key={link.name} href={link.href} className="text-[#9CA3AF] hover:text-white py-[10.5px] transition-colors font-medium font-inter text-sm whitespace-nowrap">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Connect */}
              <div className="min-w-[87px] flex flex-col">
                <h4 className="text-white font-medium text-base mb-4 font-inter">Connect</h4>
                <div className="flex flex-col gap-0.5">
                  {FOOTER_LINKS.connect.map((link) => (
                    <Link key={link.name} href={link.href} className="text-[#9CA3AF] hover:text-white py-[10.5px] transition-colors font-medium font-inter text-sm whitespace-nowrap">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar Container */}
          <div className="relative z-20 flex flex-col gap-10">
            <div className="h-[1px] w-full bg-[#111B5C] mx-auto" />
            
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8 px-6 lg:px-[180px] pb-10">
              <p className="text-[#8E8E8E] font-medium font-inter text-sm text-center lg:text-left order-2 lg:order-1">
                © {new Date().getFullYear()} CSCN | E-Learning platform
              </p>
              
              <div className="flex items-center gap-10 order-1 lg:order-2">
                <Link href="/privacy" className="text-[#9CA3AF] hover:text-white transition-colors font-medium font-inter text-sm">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-[#9CA3AF] hover:text-white transition-colors font-medium font-inter text-sm">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
