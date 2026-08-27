'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

type IntentType = 'LEARNER' | 'INSTRUCTOR';

export default function OnboardingIntentPage() {
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

      {/* Main Card Stage */}
      <main className="w-full max-w-3xl flex-1 flex flex-col justify-center py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white rounded-[24px] p-6 sm:p-10 border border-[#E3E8F4] shadow-xs flex flex-col gap-6 sm:gap-8"
        >
          {/* Header Title */}
          <div className="flex flex-col items-center text-center gap-2 max-w-xl mx-auto">
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#040B37] tracking-[-0.02em] leading-snug">
              Welcome to CSCN!<br />What brings you to the community?
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#6B7280] font-normal">
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
              <div className="flex items-start justify-between w-full mb-3">
                <h3 className="text-[16px] font-bold text-[#040B37] pr-4">
                  Join as a Student
                </h3>

                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    selectedIntent === 'LEARNER'
                      ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white'
                      : 'border-[#D1D5DB] bg-white'
                  }`}
                >
                  {selectedIntent === 'LEARNER' && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              <ul className="flex flex-col gap-2 text-[12px] text-[#4B5563] font-medium pt-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1C4ED1] shrink-0" strokeWidth={2.5} />
                  <span>Access courses & live cohorts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1C4ED1] shrink-0" strokeWidth={2.5} />
                  <span>Book 1:1 mentorship calls</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1C4ED1] shrink-0" strokeWidth={2.5} />
                  <span>Earn verified credentials & badges</span>
                </li>
              </ul>
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
              <div className="flex items-start justify-between w-full mb-3">
                <h3 className="text-[16px] font-bold text-[#040B37] pr-4">
                  Join as an Instructor
                </h3>

                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    selectedIntent === 'INSTRUCTOR'
                      ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white'
                      : 'border-[#D1D5DB] bg-white'
                  }`}
                >
                  {selectedIntent === 'INSTRUCTOR' && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              <ul className="flex flex-col gap-2 text-[12px] text-[#4B5563] font-medium pt-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1C4ED1] shrink-0" strokeWidth={2.5} />
                  <span>Create & publish courses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1C4ED1] shrink-0" strokeWidth={2.5} />
                  <span>Lead cohorts & teach students</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1C4ED1] shrink-0" strokeWidth={2.5} />
                  <span>Track student performance & earn income</span>
                </li>
              </ul>
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
              rightIcon={<ArrowRight size={15} />}
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
      <footer className="w-full max-w-3xl py-4 text-center text-[12px] text-[#9CA3AF]" />
    </div>
  );
}
