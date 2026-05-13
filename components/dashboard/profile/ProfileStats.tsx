'use client';

import React from 'react';

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex-1 bg-white border border-[#E3E8F4] rounded-[12px] p-4 flex flex-col items-center justify-center gap-1 transition-all hover:shadow-md hover:border-[#1C4ED1]/30 group">
    <span className="text-[18px] md:text-[20px] font-bold text-[#040B37] group-hover:text-[#1C4ED1] transition-colors font-jakarta">
      {value}
    </span>
    <span className="text-[12px] md:text-[14px] font-medium text-[#9CA3AF] tracking-tight uppercase">
      {label}
    </span>
  </div>
);

export const ProfileStats = () => {
  return (
    <div className="grid grid-cols-3 gap-4 md:gap-6 w-full max-w-[1200px]">
      <StatCard value="0" label="Courses" />
      <StatCard value="0" label="Certs" />
      <StatCard value="0" label="Hours" />
    </div>
  );
};
