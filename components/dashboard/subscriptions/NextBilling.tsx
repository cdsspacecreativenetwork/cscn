'use client';

import React from 'react';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';

export const NextBilling = () => {
  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[16px] overflow-hidden shadow-sm flex flex-col h-full">
      <div className="bg-white border-b border-[#E3E8F4] px-6 py-5 md:px-8">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight">
          Next Billing
        </h3>
      </div>
      
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#1C4ED1]/5 flex items-center justify-center text-[#1C4ED1]">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#9CA3AF]">Billing Date</p>
              <p className="text-[18px] font-bold text-[#040B37]">May 1, 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#1C4ED1]/5 flex items-center justify-center text-[#1C4ED1]">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#9CA3AF]">Amount Due</p>
              <p className="text-[18px] font-bold text-[#1C4ED1]">$29.00</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-[#F4F6FB] rounded-[12px] flex gap-3">
          <AlertCircle size={20} className="text-[#9CA3AF] flex-shrink-0" />
          <p className="text-[13px] font-medium text-[#9CA3AF] leading-relaxed">
            Auto-renewal is enabled. Your payment method will be charged on the billing date. Cancel anytime before then.
          </p>
        </div>

        <button className="mt-6 w-full text-[#FF383C] text-[14px] font-bold hover:bg-[#FF383C]/5 py-2.5 rounded-[10px] transition-all cursor-pointer">
          Cancel Subscription
        </button>
      </div>
    </div>
  );
};
