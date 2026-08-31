'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Sparkles, CreditCard, User, MailCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import type { CreatorReadiness } from '@/lib/trust-gates';

interface Props {
  user: any;
  creatorReadiness?: CreatorReadiness;
}

export default function GetStartedChecklistCard({ user, creatorReadiness }: Props) {
  const isEmailVerified = creatorReadiness
    ? creatorReadiness.isEmailVerified
    : Boolean(user?.emailVerified);

  const isProfileComplete = creatorReadiness
    ? creatorReadiness.isProfileComplete
    : Boolean(
        (user?.image || user?.profile?.image) &&
        (user?.profile?.bio || user?.bio) &&
        (user?.profile?.headline || user?.headline) &&
        (user?.instructorProfile?.primaryExpertise || (user?.instructorProfile?.disciplines && user.instructorProfile.disciplines.length > 0) || user?.expertise) &&
        (user?.profile?.linkedinUrl || user?.profile?.portfolioUrl || user?.profile?.websiteUrl || user?.linkedinUrl || user?.portfolioUrl)
      );

  const isPayoutConfigured = creatorReadiness
    ? creatorReadiness.isPayoutConfigured
    : Boolean(
        user?.payoutConfig?.isSetup || user?.payoutSetup
      );

  const items = [
    {
      id: 'email',
      title: 'Verify your email',
      description: 'Required before creator work can be published.',
      href: '/dashboard/settings',
      complete: isEmailVerified,
      icon: MailCheck,
    },
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add photo, bio, headline, and expertise tags.',
      href: '/dashboard/profile',
      complete: isProfileComplete,
      icon: User,
    },
    {
      id: 'payout',
      title: 'Configure payout account',
      description: 'Link bank account to receive course earnings.',
      href: '/dashboard/settings?tab=payout',
      complete: isPayoutConfigured,
      icon: CreditCard,
    },
  ];

  const completedCount = items.filter((i) => i.complete).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // Auto-hide when 100% complete
  if (percentage === 100) return null;

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E3E8F4] rounded-[20px] p-6 sm:p-8 shadow-sm space-y-6 font-jakarta">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-bold text-[#040B37]">
            {"Let's get you started"}
          </h2>
          <p className="text-[14px] font-medium text-[#6B7280] mt-0.5">
            Complete your instructor readiness items to publish courses and receive payouts.
          </p>
        </div>
      </div>

      {/* Progress Bar (ADPList Style) */}
      <div className="w-full bg-[#1C4ED1]/5 rounded-full h-11 p-1 flex items-center border border-[#1C4ED1]/10 overflow-hidden">
        <div className="w-full relative h-full bg-[#F4F6FB] rounded-full overflow-hidden flex items-center px-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#1C4ED1] via-[#2563EB] to-[#3B82F6] rounded-full"
          />
          <div className="relative z-10 flex items-center justify-between w-full text-[13px] font-bold text-[#040B37]">
            <span className={percentage > 15 ? 'text-white' : 'text-[#040B37]'}>
              {percentage}% complete
            </span>
            <span className="text-[12px] font-semibold text-[#6B7280]">
              {completedCount} of {totalCount} tasks
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Timeline / Steps */}
      <div className="space-y-4 pt-2">
        {items.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center justify-between p-4 rounded-[14px] border transition-all cursor-pointer group ${
                item.complete
                  ? 'border-emerald-200/60 bg-emerald-50/40 opacity-80'
                  : 'border-[#E3E8F4] bg-[#F8FAFC] hover:border-[#1C4ED1] hover:bg-white hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.complete ? 'bg-emerald-100 text-emerald-600' : 'bg-[#1C4ED1]/10 text-[#1C4ED1]'
                }`}>
                  {item.complete ? <CheckCircle2 size={20} /> : <IconComponent size={18} />}
                </div>

                <div className="min-w-0">
                  <h4 className={`text-[15px] font-bold ${item.complete ? 'text-[#040B37] line-through opacity-70' : 'text-[#040B37]'}`}>
                    {item.title}
                  </h4>
                  <p className="text-[13px] font-medium text-[#6B7280] truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              {!item.complete && (
                <div className="text-[#9CA3AF] group-hover:text-[#1C4ED1] group-hover:translate-x-1 transition-all shrink-0 pl-2">
                  <ArrowRight size={18} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
