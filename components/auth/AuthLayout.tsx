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
  showBackToHome?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  sidebarTitle,
  sidebarSubtitle,
  showBackToHome = true
}) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center overflow-hidden font-inter overscroll-none lg:p-0">
      {/* Centered Design Container - Adaptive Height (100vh up to 992px max) */}
      <div className="w-full max-w-[1728px] relative flex flex-col lg:flex-row items-center justify-center h-screen lg:max-h-[992px] p-4">

        {/* Sidebar - Adaptive Growth (starts narrow at 1024px, reaches 49.3% design peak at 1728px) */}
        <div 
          className="hidden lg:block relative h-full lg:w-[50%] xl:w-[44%] 2xl:w-[49.3%] max-w-[852px] bg-[#1C4ED1] lg:rounded-4xl overflow-hidden z-20 shrink-0"
        >
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay">
            <Image 
              src="/assets/dashboard/signup/grid-pattern.svg" 
              alt="" 
              fill
              className="object-cover"
              sizes="50vw"
              unoptimized
            />
          </div>

          {/* Vector Gradient Glow */}
          <div className="absolute inset-0 pointer-events-none opacity-80">
            <Image 
              src="/assets/dashboard/vector-4.svg" 
              alt="" 
              fill
              className="object-contain scale-[1.6] translate-x-[10%] translate-y-[15%]"
              sizes="50vw"
              unoptimized
            />
          </div>

          {/* Sidebar Content with Proportional Fluid Scaling */}
          <div className="relative z-10 h-full flex flex-col p-[clamp(24px,5.78vw,100px)_clamp(32px,4.62vw,80px)]">
            {/* Top: Square Logo - Precise 1728px Proportion */}
            <div className="w-[clamp(64px,4.97vw,86px)] h-[clamp(62px,4.86vw,84px)] p-0 rounded-[4px] flex items-center justify-center mb-[clamp(32px,3.01vw,52px)]">
              <Image
                src="/assets/dashboard/signup/square-logo.svg"
                alt="CSCN Logo"
                width={86}
                height={84}
                className="object-contain w-full h-full"
              />
            </div>

            {/* Top-aligned Content - Precise 1728px Proportions */}
            <div className="max-w-[667px] flex-1">
              <h1 className="text-[clamp(22px,1.85vw,32px)] font-bold text-white leading-tight font-outfit mb-[clamp(8px,0.69vw,12px)]">
                {sidebarTitle}
              </h1>
              <p className="text-[clamp(14px,0.92vw,16px)] text-white/70 font-medium leading-relaxed max-w-[480px]">
                {sidebarSubtitle}
              </p>
            </div>

            {/* Bottom: Benefits - Precise 1728px Proportions */}
            <div className="space-y-[clamp(16px,1.38vw,24px)] mt-auto">
              <div className="flex items-start gap-[clamp(12px,0.92vw,16px)]">
                <div className="w-[clamp(32px,2.31vw,40px)] h-[clamp(32px,2.31vw,40px)] rounded-md bg-white flex items-center justify-center flex-shrink-0">
                  <Image src="/assets/dashboard/motorboard-02.svg" alt="Icon" width={24} height={24} className="w-1/2 h-1/2" />
                </div>
                <div>
                  <h3 className="text-[clamp(14px,0.92vw,16px)] font-medium text-white leading-normal">
                    20+ expert-led courses
                  </h3>
                  <p className="text-[clamp(11px,0.69vw,12px)] text-white/70 leading-normal">
                    Curated content from industry practitioners
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-[clamp(12px,0.92vw,16px)]">
                <div className="w-[clamp(32px,2.31vw,40px)] h-[clamp(32px,2.31vw,40px)] rounded-md bg-white flex items-center justify-center flex-shrink-0">
                  <Image src="/assets/dashboard/certificate-01.svg" alt="Icon" width={24} height={24} className="w-1/2 h-1/2" />
                </div>
                <div>
                  <h3 className="text-[clamp(14px,0.92vw,16px)] font-medium text-white leading-normal">
                    Verified certifications
                  </h3>
                  <p className="text-[clamp(11px,0.69vw,12px)] text-white/70 leading-normal">
                    Credentials recognised by top employers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section - Symmetrical 50/50 Split with Balanced Padding */}
        <div className="flex-1 flex flex-col items-center lg:items-start lg:px-12 xl:px-[106px] py-12 bg-white h-full overflow-y-auto">
          <div className="w-full max-w-[480px] xl:max-w-[631px]">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-12">
              <Image src="/images/logo.svg" alt="CSCN Logo" width={120} height={34} />
            </div>

            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="text-left">
                <h2 className="text-[28px] xl:text-[32px] font-semibold text-[#040B37] leading-normal mb-2 font-outfit">
                  {title}
                </h2>
                <p className="text-[#9CA3AF] text-[15px] xl:text-[16px] font-light tracking-[-0.64px]">
                  {subtitle}
                </p>
              </div>

              {showBackToHome && (
                <Link
                  href="/"
                  className="group flex items-center gap-2 px-5 py-2.5 bg-[#F4F6FB] border border-[#E3E8F4] rounded-full text-[#4B5563] text-[14px] font-medium hover:bg-white hover:border-[#1C4ED1] hover:text-[#1C4ED1] transition-all duration-300 shrink-0 self-start sm:self-center shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
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
