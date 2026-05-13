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
    <section className="relative w-full flex flex-col items-center">
      {/* 1. Stage: White Top Section */}
      <div className="w-full h-[clamp(350px,40vw,650px)] bg-white relative z-0" />

      {/* 2. Stage: Main Navy Container (Figma 9501:6749 - 416px height) */}
      <div className="relative w-full h-[416px] bg-[#040B37] z-10 flex flex-col items-center overflow-visible">
        
        {/* Environmental Layer: Dots & Objects */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Big Dots Pattern (Figma 9511:10624 - 1441x341) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[1441px] h-[341px] opacity-40">
            <Image 
              src="/assets/certificate/dots.svg" 
              alt="" 
              fill
              className="object-contain object-bottom"
            />
          </div>

          {/* Footer Corner Objects */}
          <div className="absolute left-0 bottom-0 opacity-20 lg:opacity-40 scale-x-[-1] translate-x-[-10%] translate-y-[20%]">
            <Image src="/assets/footer/Objects.svg" alt="" width={800} height={600} />
          </div>
          <div className="absolute right-0 bottom-0 opacity-20 lg:opacity-40 translate-x-[10%] translate-y-[20%]">
            <Image src="/assets/footer/Objects.svg" alt="" width={800} height={600} />
          </div>
        </div>

        {/* 3. The Focal Point: Massive Envelope (Centered, straddling both sections) */}
        {/* Width increased to 920px for massive visual impact as requested */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[-620px] w-[clamp(400px,53.2vw,920px)] aspect-square z-20 pointer-events-none">
          <Image 
            src="/assets/certificate/envelope.svg" 
            alt="Certificate Preview" 
            fill
            className="object-contain drop-shadow-[0_60px_100px_rgba(0,0,0,0.5)]"
            priority
          />
        </div>

        {/* 4. The "Top Shade" (Figma 9511:10626) - OVERLAID on Envelope bottom */}
        {/* This creates the immersive blend that washes over the envelope bottom */}
        <div 
          className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-full max-w-[1600px] h-[341px] bg-[#040B37] blur-[100px] opacity-100 z-25 pointer-events-none"
          style={{ mixBlendMode: 'normal' }}
        />

        {/* 5. Foreground Cluster: Text & Stamp (Centered vertically on the envelope's bottom area) */}
        <div className="relative z-30 w-full max-w-[1728px] h-full flex flex-col justify-center px-4 lg:px-[150px]">
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-center gap-10 lg:gap-32 lg:translate-y-8">
            
            {/* Text Section */}
            <div className="flex flex-col gap-6 lg:gap-10 max-w-[543px]">
              <h1 className="text-[clamp(36px,3.7vw,48px)] font-bold tracking-[-0.03em] leading-[1.1] bg-gradient-to-r from-[#0035C1] to-[#0575FF] bg-clip-text text-transparent">
                Getting Your Certificate
              </h1>
              
              <div className="flex flex-col gap-[18px]">
                {REQUIREMENTS.map((req, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <Image 
                        src="/assets/certificate/checkmark-badge-01.svg" 
                        alt="check" 
                        width={32} 
                        height={32} 
                      />
                    </div>
                    <span className="text-[clamp(16px,1.2vw,20px)] font-medium text-[#F4F6FB] opacity-90 tracking-[-0.01em]">
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* The Wax Stamp (Moved closer to center/text) */}
            <div className="w-[180px] lg:w-[362px] h-[180px] lg:h-[362px] animate-float">
              <Image 
                src="/assets/certificate/stamp.svg" 
                alt="CDS Official Stamp" 
                fill
                className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(4deg); }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
