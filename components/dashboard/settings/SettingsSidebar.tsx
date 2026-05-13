'use client';

import React from 'react';
import { User, Bell, Palette, Globe } from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'Account', label: 'Account' },
    { id: 'Notifications', label: 'Notifications' },
    { id: 'Appearance', label: 'Appearance' },
    { id: 'Language', label: 'Language' },
  ];

  return (
    <div className="w-full lg:w-[248px] bg-white border border-[#E3E8F4] rounded-[16px] p-6 lg:p-10 flex flex-col gap-2 shrink-0 h-fit">
      {tabs.map((tab) => {
        
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-[14px] font-medium tracking-tight outline-none cursor-pointer ${
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
