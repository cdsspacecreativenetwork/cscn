'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

type IntentType = 'LEARNER' | 'INSTRUCTOR';

export default function OnboardingIntentClient() {
  const router = useRouter();
  const [selectedIntent, setSelectedIntent] = useState<IntentType | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleContinue = () => {
    if (!selectedIntent || isNavigating) return;

    setIsNavigating(true);

    // Fire API save in the background asynchronously
    fetch('/api/onboarding/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: selectedIntent }),
    }).catch((err) => console.error('Background intent save error:', err));

    // Navigate immediately
    if (selectedIntent === 'INSTRUCTOR') {
      router.push('/instructor/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFC] flex flex-col justify-between items-center p-4 sm:p-6 font-inter text-[#040B37]">
      {/* Top Edge Progress Bar Loader during navigation */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-[#1C4ED1] z-50 animate-pulse transition-all duration-300" />
      )}

      {/* Top Header with official CSCN Logo */}
      <header className="w-full max-w-3xl py-6 flex items-center justify-start">
        <Image
          src="/images/logo.svg"
          alt="CSCN Logo"
          width={110}
          height={32}
          priority
          className="h-7 w-auto"
        />
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-3xl flex-1 flex flex-col justify-center py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8"
        >
          {/* Header Title */}
          <div className="flex flex-col gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[#040B37] leading-snug">
              Welcome to CSCN! What brings you here today?
            </h1>
            <p className="text-sm sm:text-base text-[#6B7280]">
              Select how you would like to use your account to get started.
            </p>
          </div>

          {/* 2-Column Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full">
            {/* Option 1: Student */}
            <div
              onClick={() => setSelectedIntent('LEARNER')}
              className={`relative flex flex-col justify-between p-6 rounded-[20px] border-2 cursor-pointer transition-all duration-200 select-none ${
                selectedIntent === 'LEARNER'
                  ? 'border-[#1C4ED1] bg-[#F8FAFC] shadow-xs'
                  : 'border-[#E3E8F4] bg-white hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🎓</span>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedIntent === 'LEARNER'
                        ? 'border-[#1C4ED1] bg-[#1C4ED1]'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {selectedIntent === 'LEARNER' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-semibold text-[#040B37]">
                    Explore & Learn
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                    Access expert-led courses, master tech skills, and join a vibrant community of creators.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Instructor */}
            <div
              onClick={() => setSelectedIntent('INSTRUCTOR')}
              className={`relative flex flex-col justify-between p-6 rounded-[20px] border-2 cursor-pointer transition-all duration-200 select-none ${
                selectedIntent === 'INSTRUCTOR'
                  ? 'border-[#1C4ED1] bg-[#F8FAFC] shadow-xs'
                  : 'border-[#E3E8F4] bg-white hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🚀</span>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedIntent === 'INSTRUCTOR'
                        ? 'border-[#1C4ED1] bg-[#1C4ED1]'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {selectedIntent === 'INSTRUCTOR' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-semibold text-[#040B37]">
                    Teach & Earn
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                    Share your experience, publish courses or workshops, and mentor ambitious professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end pt-2">
            <Button
              variant="gradient"
              size="md"
              hasBorder={true}
              rounded="full"
              disabled={!selectedIntent || isNavigating}
              onClick={handleContinue}
              rightIcon={<ArrowRight size={16} />}
              className={`text-[14px] font-bold transition-all ${
                !selectedIntent || isNavigating
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : 'bg-[#1C4ED1] text-white'
              }`}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-3xl py-6 flex items-center justify-between text-xs text-[#9CA3AF]">
        <span>© {new Date().getFullYear()} CSCN Space. All rights reserved.</span>
      </footer>
    </div>
  );
}
