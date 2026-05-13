'use client';

import React from 'react';
import { CertificateHero } from '@/components/certificate/CertificateHero';
import Footer from '@/components/marketing/Footer';
import Navbar from '@/components/marketing/Navbar';

export default function CertificatePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      
      {/* 
          The Hero handles its own split-background (White top, Navy bottom).
          Since the Navbar is fixed/sticky, we start the content from the top.
      */}
      <div className="flex-1 flex flex-col">
        <CertificateHero />
        
        {/* Outstanding Community Section & other content will follow here in Navy */}
        <div className="bg-[#040B37] pt-20">
          <div className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-[200px]">
             {/* Community content placeholder */}
          </div>
        </div>
      </div>

    </main>
  );
}
