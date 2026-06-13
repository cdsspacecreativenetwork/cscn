'use client';

import React from 'react';
interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange, userRole }) => {
  const tabs = [
    { id: 'Account', label: 'Account Settings' },
    ...(userRole === 'INSTRUCTOR' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
      ? [{ id: 'Payouts', label: 'Instructor Payouts' }]
      : []),
    { id: 'Integrations', label: 'Integrations' },
    { id: 'Notifications', label: 'Notifications' },
    { id: 'Appearance', label: 'Appearance' },
    { id: 'Language', label: 'Language' },
  ];

  return (
    <div className="w-full lg:w-[260px] bg-white border border-[#E3E8F4] rounded-[16px] p-6 lg:p-8 flex flex-col gap-2 shrink-0 h-fit">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-[14px] font-bold tracking-tight outline-none cursor-pointer text-left ${
              isActive 
                ? 'bg-[#1C4ED1]/5 text-[#1C4ED1]' 
                : 'text-[#4B5563] hover:bg-[#F4F6FB]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
