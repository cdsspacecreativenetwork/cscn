'use client';

import React from 'react';

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="min-h-[116px] flex-1 bg-white border border-[#E3E8F4] rounded-[18px] p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md hover:border-[#1C4ED1]/30 group md:min-h-[132px]">
    <span className="text-[28px] md:text-[34px] font-black leading-none text-[#040B37] group-hover:text-[#1C4ED1] transition-colors font-jakarta">
      {value}
    </span>
    <span className="text-center text-[11px] md:text-[13px] font-bold text-[#9CA3AF] tracking-tight uppercase">
      {label}
    </span>
  </div>
);

type ProfileStatItem = {
  value: string;
  label: string;
};

type ProfileStatsProps = {
  items: ProfileStatItem[];
};

export const ProfileStats = ({ items }: ProfileStatsProps) => {
  return (
    <div className="grid w-full max-w-[1200px] grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
      {items.map((item) => (
        <StatCard key={item.label} value={item.value} label={item.label} />
      ))}
    </div>
  );
};
