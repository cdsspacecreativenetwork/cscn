'use client';

import React from 'react';
import Image from 'next/image';

export const ActivePlanCard = () => {
  const features = [
    "Unlimited course access",
    "Live sessions & workshops",
    "Downloadable certificates",
    "Priority support",
    "Offline downloads"
  ];

  return (
    <div className="bg-white border-2 border-[#1C4ED1] rounded-[16px] px-6 py-8 md:px-8 flex flex-col gap-10">
      
      <div className="flex flex-col gap-6">
        {/* Header Row: Title & Price */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-[18px] md:text-[20px] font-bold text-[#040B37] tracking-tight">Pro</h2>
            <div className="flex items-center gap-1">
              <span className="text-[18px] md:text-[20px] font-bold text-[#040B37]">$29</span>
              <span className="text-[12px] font-bold text-[#9CA3AF]">/month</span>
            </div>
          </div>
          <p className="text-[14px] font-semibold text-[#9CA3AF] leading-relaxed">
            Full access to all courses, live sessions, certificates, and priority support.
          </p>
        </div>

        {/* Features Column */}
        <div className="flex flex-col gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                <Image 
                  src="/assets/dashboard/checkmark-circle-01.svg" 
                  alt="check" 
                  width={14} 
                  height={14} 
                />
              </div>
              <span className="text-[14px] font-semibold text-[#4B5563]">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex flex-row items-center gap-4">
        <button className="px-4 py-2.5 border border-[#1C4ED1] text-[#1C4ED1] text-[13px] md:text-[14px] font-bold rounded-[8px] hover:bg-[#1C4ED1]/5 transition-all w-fit">
          Downgrade Plan
        </button>
        <button className="px-4 py-2.5 bg-[#1C4ED1] text-white text-[13px] md:text-[14px] font-bold rounded-[8px] hover:bg-[#163BB1] transition-all shadow-sm w-fit">
          Upgrade to Team
        </button>
      </div>

    </div>
  );
};
