'use client';

import React from 'react';
import Image from 'next/image';

interface PlanCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  isActive?: boolean;
  buttonText?: string;
  isCurrent?: boolean;
  onAction?: () => void;
  className?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  description,
  features,
  isActive,
  buttonText,
  isCurrent,
  onAction,
  className = ""
}) => {
  return (
    <div className={`flex flex-col bg-white border ${isCurrent ? 'border-[#1C4ED1] ring-1 ring-[#1C4ED1]' : 'border-[#E3E8F4]'} rounded-[16px] p-8 transition-all hover:shadow-md ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[20px] font-bold text-[#040B37] tracking-tight mb-1">{name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-[32px] font-bold text-[#040B37]">{price}</span>
            {period && <span className="text-[14px] font-medium text-[#9CA3AF]">{period}</span>}
          </div>
        </div>
        {isCurrent && (
          <span className="bg-[#1C4ED1]/5 text-[#1C4ED1] px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider">
            Current Plan
          </span>
        )}
      </div>

      <p className="text-[14px] font-medium text-[#9CA3AF] leading-relaxed mb-8">
        {description}
      </p>

      <div className="flex-1 space-y-4 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <Image 
                src="/assets/dashboard/checkmark-circle-01.svg" 
                alt="check" 
                width={20} 
                height={20} 
              />
            </div>
            <span className="text-[14px] font-medium text-[#4B5563] tracking-tight">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onAction}
        className={`w-full py-3.5 rounded-[10px] text-[15px] font-bold transition-all active:scale-[0.98] cursor-pointer ${
          isCurrent 
            ? 'bg-[#F4F6FB] text-[#9CA3AF] cursor-not-allowed' 
            : isActive 
              ? 'bg-[#1C4ED1] text-white shadow-md hover:bg-[#163BB1]' 
              : 'border border-[#E3E8F4] text-[#4B5563] hover:border-[#1C4ED1] hover:text-[#1C4ED1]'
        }`}
        disabled={isCurrent}
      >
        {buttonText || (isCurrent ? 'Current Plan' : 'Select Plan')}
      </button>
    </div>
  );
};
