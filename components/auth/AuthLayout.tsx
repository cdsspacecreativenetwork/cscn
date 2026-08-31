'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
  benefits?: readonly AuthBenefit[];
  showBackToHome?: boolean;
}

export interface AuthBenefit {
  title: string;
  description: string;
  iconSrc: string;
}

const defaultBenefits: readonly AuthBenefit[] = [
  {
    title: '20+ expert-led courses',
    description: 'Curated content from industry practitioners',
    iconSrc: '/assets/dashboard/motorboard-02.svg',
  },
  {
    title: 'Verified certifications',
    description: 'Credentials recognised by top employers',
    iconSrc: '/assets/dashboard/certificate-01.svg',
  },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  sidebarTitle,
  sidebarSubtitle,
  benefits = defaultBenefits,
  showBackToHome = true,
}) => {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center font-inter p-3 sm:p-5 lg:p-6">
      {/* Symmetrical Design Container (Max 1680px, Adaptive Height) */}
      <div className="w-full max-w-[1680px] flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-3rem)] lg:max-h-[920px] gap-6 lg:gap-12">
        
        {/* Left Hero Sidebar Card (Figma Node #8732:4401 with /images/Side.svg) */}
        <div className="hidden lg:flex relative h-full lg:w-[46%] xl:w-[44%] 2xl:w-[46%] max-w-[720px] rounded-[28px] xl:rounded-[36px] overflow-hidden z-20 shrink-0 flex-col shadow-xl border border-[#E3E8F4]/30">
          {/* Exact Figma Background SVG (/images/Side.svg) */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <Image
              src="/images/Side.svg"
              alt=""
              fill
              className="object-cover object-center select-none"
              priority
              unoptimized
            />
          </div>

          {/* Sidebar Content Layout - Aligned strictly to Figma x:80px (9.4%), y:100px (10.1%) */}
          <div className="relative z-10 h-full flex flex-col justify-between pl-20 pr-22 pt-25 pb-32">
            {/* Top Logo Badge - Direct Figma SVG rendering without extra wrapper border */}
            <div className="w-[76px] 2xl:w-[86px] h-[74px] 2xl:h-[84px] shrink-0 mb-8 xl:mb-12">
              <Image
                src="/assets/dashboard/signup/square-logo.svg"
                alt="CSCN Logo"
                width={86}
                height={84}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            {/* Middle Main Copy (Figma Spec: 32px Bold / 16px Medium 70% opacity) */}
            <div className="max-w-[560px] mb-auto">
              <h1 className="text-2xl xl:text-[32px] font-bold text-white leading-tight font-jakarta mb-2.5 tracking-tight">
                {sidebarTitle}
              </h1>
              <p className="text-sm xl:text-base text-white/70 font-medium leading-relaxed max-w-[460px] font-jakarta">
                {sidebarSubtitle}
              </p>
            </div>

            {/* Bottom Benefits List (Figma Spec: 16px Medium Title / 12px Regular 70% opacity) */}
            {benefits && benefits.length > 0 && (
              <div className="space-y-6 mt-auto">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[6px] bg-white flex items-center justify-center shrink-0 shadow-xs">
                      <Image src={benefit.iconSrc} alt="" width={24} height={24} className="w-6 h-6 object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm xl:text-[16px] font-medium text-white leading-tight font-jakarta">
                        {benefit.title}
                      </h3>
                      <p className="text-[12px] text-white/70 font-normal leading-normal font-jakarta mt-0.5">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Form Section (Figma Spec Node #8733:5094) */}
        <div className="flex-1 flex flex-col items-center lg:items-start px-2 sm:px-6 lg:px-8 xl:px-12 w-full h-auto lg:h-full lg:overflow-y-auto my-auto justify-center">
          <div className="w-full max-w-[480px] xl:max-w-[540px] my-auto py-4">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-6">
              <Image src="/images/logo.svg" alt="CSCN Logo" width={110} height={32} />
            </div>

            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-left">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#040B37] leading-tight mb-2 font-jakarta">
                  {title}
                </h2>
                <p className="text-[#9CA3AF] text-sm sm:text-base font-medium tracking-tight font-jakarta">
                  {subtitle}
                </p>
              </div>

              {showBackToHome && (
                <Link
                  href="/"
                  className="group flex items-center gap-1.5 px-4 py-2 bg-[#F4F6FB] border border-[#E3E8F4] rounded-full text-[#4B5563] text-xs sm:text-sm font-medium hover:bg-white hover:border-[#1C4ED1] hover:text-[#1C4ED1] transition-all duration-200 shrink-0 shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  <span>Back to home</span>
                </Link>
              )}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
