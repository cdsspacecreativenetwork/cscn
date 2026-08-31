'use client';

import React from 'react';

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="group flex min-h-[62px] flex-1 flex-col items-center justify-center gap-2 rounded-[18px] border border-stroke bg-card-bg p-4 transition-colors md:min-h-[68px]">
    <span className="text-xl font-bold leading-none text-navy transition-colors">
      {value}
    </span>
    <span className="text-center text-xs font-medium tracking-tight text-text-mute">
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
