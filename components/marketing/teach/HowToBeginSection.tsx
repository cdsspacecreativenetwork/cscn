'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Tab Data with exact vector images provided
const TABS = [
  {
    id: 'plan',
    title: 'Plan your curriculum',
    headline: 'You start with your passion and knowledge. Then choose a promising topic with the help of our Marketplace Insights tool.',
    subtext: 'The way that you teach — what you bring to it — is up to you.',
    imageSrc: '/images/plan 1.svg',
    imageAlt: 'Plan your curriculum illustration',
  },
  {
    id: 'record',
    title: 'Record your video',
    headline: 'Use basic tools like a smartphone or DSLR camera. Add a crisp microphone and you’re ready to start recording.',
    subtext: 'If you prefer not to be on camera, simply capture your screen using screen recording software.',
    imageSrc: '/images/record 1.svg',
    imageAlt: 'Record your video illustration',
  },
  {
    id: 'launch',
    title: 'Launch your course',
    headline: 'Gather your first ratings and reviews by sharing your course across your professional network and community.',
    subtext: 'Your course becomes immediately searchable in our marketplace where you earn revenue on every paid enrollment.',
    imageSrc: '/images/publish 1.svg',
    imageAlt: 'Launch your course illustration',
  },
];

export default function HowToBeginSection() {
  const [activeTabId, setActiveTabId] = useState('plan');
  const activeTab = TABS.find((t) => t.id === activeTabId) || TABS[0];

  return (
    <section className="w-full bg-background">
      <div className="w-full max-w-[86rem] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24">
        {/* Section Heading */}
        <h2 className="text-3xl sm:text-[38px] font-semibold tracking-tight text-[#040B37] text-center mb-10">
          How to begin
        </h2>

        {/* Tab Navigation Line */}
        <div className="w-full max-w-3xl mx-auto border-b border-[#E2E8F0]">
          <div className="flex items-center justify-center gap-6 sm:gap-12 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`relative pb-3 text-base sm:text-[17px] font-medium transition-colors whitespace-nowrap outline-none cursor-pointer ${
                    isActive ? 'text-[#040B37] font-semibold' : 'text-[#6B7280] hover:text-[#040B37]'
                  }`}
                >
                  {tab.title}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#040B37] rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content 2-Column Layout */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Left Column Text Content */}
          <div className="md:col-span-6 flex flex-col text-left pl-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <p className="text-base sm:text-lg text-[#374151] leading-relaxed font-normal">
                  {activeTab.headline}
                </p>
                <p className="text-base sm:text-lg text-[#374151] leading-relaxed font-normal">
                  {activeTab.subtext}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column Graphic Vector Image */}
          <div className="md:col-span-6 flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-[200px] sm:h-[230px] flex items-center justify-center overflow-hidden"
              >
                <Image
                  src={activeTab.imageSrc}
                  alt={activeTab.imageAlt}
                  fill
                  className="object-contain select-none"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
