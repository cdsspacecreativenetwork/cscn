'use client';

import React from 'react';
import Image from 'next/image';

const REQUIREMENTS = [
  "Watch all the course videos",
  "Complete each class project",
  "Ask for help and feedback whenever you need it",
  "Request your certificate once you’re ready"
];

export const CertificateHero = () => {
  return (
    <section className="relative z-30 w-full flex flex-col items-center bg-white overflow-visible">
      {/* 1. Stage: Clean White Top Section (Figma: y: 0 to 563px on 1728px viewport) */}
      <div className="w-full h-[280px] md:h-[420px] lg:h-[clamp(270px,31vw,500px)] bg-white relative z-0 transition-all duration-300" />

      {/* 2. Stage: Main Navy Container (Figma: y: 563px to 979px, height: 416px) */}
      <div className="relative w-full lg:h-[clamp(280px,24vw,390px)] bg-[#040B37] z-10 flex flex-col items-center overflow-visible py-12 lg:py-0">
        {/* Environmental Layer: Dotted Background Pattern (Figma 9511:10624 - 1441x341) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[120vw] min-w-[1441px] h-[clamp(220px,21vw,320px)] opacity-70">
            <Image
              src="/assets/certificate/dots.svg"
              alt=""
              fill
              className="object-cover object-bottom"
              priority
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW LAYOUT (Figma Math Alignment: 819px centered envelope container) */}
        {/* ========================================================================= */}
        <div
          className="hidden lg:block relative w-[var(--cert-envelope-size)] h-full mx-auto z-20 overflow-visible"
          style={{
            '--cert-envelope-size': 'clamp(520px,46vw,720px)',
            '--cert-envelope-top': 'clamp(-255px,-20vw,-190px)',
            '--cert-shade-height': 'clamp(210px,20vw,300px)',
          } as React.CSSProperties}
        >

          {/* Envelope (Figma: width 819px, height 819px) */}
          {/* Pushed down to top-[-450px] so that:
              1. The top of the envelope sits comfortably below the navbar (563px - 450px = 113px top margin)
              2. Exactly 45% of the envelope (369px of 819px) is nested inside the Navy container */}
          <div className="absolute bottom-20 left-0 w-[var(--cert-envelope-size)] h-[var(--cert-envelope-size)] z-20 pointer-events-none select-none overflow-visible">
            <Image
              src="/assets/certificate/envelope.svg"
              alt="Certificate Preview"
              fill
              className="object-cover object-left drop-shadow-[0_35px_50px_rgba(0,0,0,0.3)]"
              priority
            />
          </div>

          <div className="absolute left-1/2 -top-2 w-[clamp(820px,78vw,1320px)] h-[var(--cert-shade-height)] -translate-x-1/2 z-[24] pointer-events-none">
            <Image
              src="/assets/certificate/top shade.svg"
              alt=""
              fill
              className="object-fill"
              priority
            />
          </div>

          {/* Top Shade Overlay (Figma 9511:10626) */}
          <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[clamp(820px,78vw,1320px)] h-[calc(var(--cert-shade-height)*0.92)] rounded-full bg-[#040B37] opacity- blur-[64px] z-[25] pointer-events-none" />

          {/* Text block (Figma 9501:10587 - width 543px, starts at x: 453px) */}
          {/* Placed at z-30 so it floats cleanly on top of the envelope and top shade */}
          <div className="absolute left-16 top-30 z-30 flex flex-col gap-[clamp(12px,1.15vw,20px)] text-left">
            <h1 className="text-[clamp(30px,2.45vw,42px)] font-semibold tracking-[-0.025em] leading-[1.1] bg-gradient-to-r from-[#0035C1] to-[#0575FF] bg-clip-text text-transparent">
              Getting Your Certificate
            </h1>

            <div className="flex flex-col gap-[clamp(8px,0.85vw,13px)] text-left">
              {REQUIREMENTS.map((req, i) => (
                <div key={i} className="flex items-center gap-[clamp(9px,0.85vw,14px)] group">
                  <div className="w-[clamp(20px,1.65vw,28px)] h-[clamp(20px,1.65vw,28px)] flex items-center justify-center shrink-0">
                    <Image
                      src="/assets/certificate/checkmark-badge-01.svg"
                      alt="check"
                      width={32}
                      height={32}
                    />
                  </div>
                  <span className="text-[clamp(13px,1.05vw,17px)] font-normal text-[#F4F6FB] opacity-95 tracking-[-0.01em]">
                    {req}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CDS Wax Stamp (Figma 9501:10583 - width 362px, starts at x: 1057.64px) */}
          {/* Placed at z-30 so it sits on top of the envelope card edge, overextending slightly */}
          <div className="absolute -right-20 top-0 w-[clamp(220px,20vw,340px)] h-[clamp(220px,20vw,340px)] z-[60] animate-float">
            <Image
              src="/assets/certificate/stamp.svg"
              alt="CDS Official Stamp"
              fill
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RESPONSIVE MOBILE & TABLET LAYOUT (Stacked, Clean & 3D Layered) */}
        {/* ========================================================================= */}
        <div className="lg:hidden flex flex-col items-center w-full px-6 relative z-20 gap-8 overflow-visible">

          {/* Scaled-down Envelope overlapping the white section and nested into Navy */}
          <div className="relative w-[320px] md:w-[500px] h-[320px] md:h-[500px] -mt-[170px] md:-mt-[280px] pointer-events-none select-none z-20 overflow-visible">
            <Image
              src="/assets/certificate/envelope.svg"
              alt="Certificate Preview"
              fill
              className="object-cover drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)]"
              priority
            />
          </div>

          {/* Mobile CDS Wax Stamp */}
          <div className="absolute right-0 top-0 w-[140px] md:w-[280px] h-[180px] md:h-[240px] shrink-0 z-[60] animate-float">
            <Image
              src="/assets/certificate/stamp.svg"
              alt="CDS Official Stamp"
              fill
              className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* Mobile Top Shade Fader overlay */}
          <div className="hidden absolute left-1/2 top-[clamp(104px,25vw,196px)] w-[130vw] h-[230px] -translate-x-1/2 z-[24] pointer-events-none">
            <Image
              src="/assets/certificate/top shade.svg"
              alt=""
              fill
              className="object-fill"
              priority
            />
          </div>

          {/* Requirements text list - Floats over bottom part of the envelope wrapper */}
          <div className="flex flex-col gap-5 max-w-[540px] w-full text-left z-30 mt-4">
            <h1 className="text-[24px] md:text-[32px] font-semibold tracking-[-0.025em] leading-[1.12] bg-gradient-to-r from-[#0035C1] to-[#0575FF] bg-clip-text text-transparent">
              Getting Your Certificate
            </h1>

            <div className="flex flex-col gap-3.5 text-left">
              {REQUIREMENTS.map((req, i) => (
                <div key={i} className="flex items-center gap-3.5 group">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0">
                    <Image
                      src="/assets/certificate/checkmark-badge-01.svg"
                      alt="check"
                      width={28}
                      height={28}
                    />
                  </div>
                  <span className="text-[16px] md:text-[18px] font-normal text-[#F4F6FB] opacity-95 tracking-[-0.01em]">
                    {req}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-12px) rotate(2.5deg); }
        }
        .animate-float {
          animation: float 7s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
