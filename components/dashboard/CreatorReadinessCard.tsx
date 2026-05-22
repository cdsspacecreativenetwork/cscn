'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Circle, UserRound } from 'lucide-react';
import type { CreatorReadiness } from '@/lib/trust-gates';

export default function CreatorReadinessCard({ readiness }: { readiness: CreatorReadiness }) {
  if (readiness.canSubmitForReview) return null;

  const completed = readiness.items.filter((item) => item.complete).length;

  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[12px] p-5 md:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-[8px] bg-[#EEF3FF] px-3 py-1 text-[12px] font-bold text-[#1C4ED1]">
            <UserRound size={14} />
            Creator Trust Setup
          </div>
          <h2 className="mt-3 text-[18px] md:text-[20px] font-bold text-[#040B37]">
            Complete your public creator profile
          </h2>
          <p className="mt-1 max-w-2xl text-[14px] font-medium leading-6 text-[#4B5563]">
            Creating or submitting creator content requires a verified email and a professional profile learners can trust.
          </p>
        </div>

        <div className="shrink-0 rounded-[8px] border border-[#1C4ED1]/15 bg-[#F8FAFF] px-3 py-2 text-[13px] font-bold text-[#1C4ED1]">
          {completed} of {readiness.items.length} complete
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {readiness.items.map((item) => {
          const Icon = item.complete ? CheckCircle2 : item.id === 'email' ? AlertTriangle : Circle;
          const content = (
            <div className={`h-full rounded-[8px] border p-3 transition-colors ${
              item.complete
                ? 'border-emerald-100 bg-emerald-50/60'
                : 'border-[#E3E8F4] bg-[#F8FAFF] hover:border-[#1C4ED1]/30'
            }`}>
              <div className="flex items-start gap-2">
                <Icon
                  size={17}
                  className={item.complete ? 'text-emerald-600' : item.id === 'email' ? 'text-amber-500' : 'text-[#1C4ED1]'}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#040B37]">{item.label}</p>
                  <p className="mt-1 text-[11px] font-medium leading-4 text-[#9CA3AF]">{item.description}</p>
                </div>
              </div>
            </div>
          );

          if (item.complete || !item.href) return <div key={item.id}>{content}</div>;
          return (
            <Link key={item.id} href={item.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
