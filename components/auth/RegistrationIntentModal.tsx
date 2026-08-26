'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, Check, ArrowRight, ShieldCheck, X } from 'lucide-react';
import Button from '@/components/ui/Button';

type IntentType = 'LEARNER' | 'INSTRUCTOR';

type RegistrationIntentModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectIntent: (intent: IntentType) => void;
};

export function RegistrationIntentModal({
  open,
  onClose,
  onSelectIntent,
}: RegistrationIntentModalProps) {
  const [selectedIntent, setSelectedIntent] = useState<IntentType>('LEARNER');

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040B37]/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl border border-[#E3E8F4]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#9CA3AF] hover:text-[#040B37] hover:bg-[#F4F6FB] transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex flex-col gap-2 pr-8">
            <h2 className="text-[22px] sm:text-[26px] font-bold text-[#040B37] tracking-[-0.02em] font-inter">
              Welcome to CSCN! 👋
            </h2>
            <p className="text-[14px] text-[#4B5563] font-medium leading-relaxed">
              What brings you to the community today? Select your primary intent to customize your experience.
            </p>
          </div>

          {/* Intent Cards */}
          <div className="mt-6 flex flex-col gap-3.5">
            {/* Card 1: Learner / Student */}
            <div
              onClick={() => setSelectedIntent('LEARNER')}
              className={`relative flex items-start gap-4 p-4 rounded-[18px] border-2 cursor-pointer transition-all duration-200 ${
                selectedIntent === 'LEARNER'
                  ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-xs'
                  : 'border-[#E3E8F4] bg-white hover:border-[#C8D1E0]'
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  selectedIntent === 'LEARNER' ? 'bg-[#1C4ED1] text-white' : 'bg-[#F4F6FB] text-[#040B37]'
                }`}
              >
                <GraduationCap size={24} />
              </div>

              <div className="flex-1 flex flex-col gap-1 pr-6">
                <h3 className="text-[15px] font-bold text-[#040B37]">Join as a Community Learner</h3>
                <p className="text-[12px] text-[#4B5563] leading-relaxed">
                  Browse masterclasses, join live cohorts, earn verified credentials, and book 1:1 mentorship calls.
                </p>
              </div>

              <div className="absolute top-4 right-4">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedIntent === 'LEARNER'
                      ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white'
                      : 'border-[#C8D1E0] bg-white'
                  }`}
                >
                  {selectedIntent === 'LEARNER' && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            </div>

            {/* Card 2: Verified Instructor & Mentor */}
            <div
              onClick={() => setSelectedIntent('INSTRUCTOR')}
              className={`relative flex items-start gap-4 p-4 rounded-[18px] border-2 cursor-pointer transition-all duration-200 ${
                selectedIntent === 'INSTRUCTOR'
                  ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-xs'
                  : 'border-[#E3E8F4] bg-white hover:border-[#C8D1E0]'
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  selectedIntent === 'INSTRUCTOR' ? 'bg-[#1C4ED1] text-white' : 'bg-[#F4F6FB] text-[#040B37]'
                }`}
              >
                <Sparkles size={24} />
              </div>

              <div className="flex-1 flex flex-col gap-1 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-[#040B37]">Join as an Instructor & Mentor</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#040B37] text-white text-[10px] font-bold">
                    Verified
                  </span>
                </div>
                <p className="text-[12px] text-[#4B5563] leading-relaxed">
                  Publish courses, lead cohorts, host 1:1 mentorship sessions, and earn income.
                </p>
              </div>

              <div className="absolute top-4 right-4">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedIntent === 'INSTRUCTOR'
                      ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white'
                      : 'border-[#C8D1E0] bg-white'
                  }`}
                >
                  {selectedIntent === 'INSTRUCTOR' && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="mt-8 flex items-center justify-between gap-4 pt-4 border-t border-[#E3E8F4]">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#9CA3AF]">
              <ShieldCheck size={15} className="text-[#10B981]" />
              <span>You can always switch roles later</span>
            </div>

            <Button
              variant="default"
              size="md"
              rounded="full"
              onClick={() => onSelectIntent(selectedIntent)}
              rightIcon={<ArrowRight size={16} />}
              className="px-6 py-2.5 text-[14px] font-bold"
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
