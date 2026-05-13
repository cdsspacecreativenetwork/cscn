'use client';

import React, { useState } from 'react';
import { SettingsSidebar } from '@/components/dashboard/settings/SettingsSidebar';
import { AccountSettings } from '@/components/dashboard/settings/AccountSettings';
import { NotificationSettings } from '@/components/dashboard/settings/NotificationSettings';
import { LanguageSettings } from '@/components/dashboard/settings/LanguageSettings';
import { AppearanceSettings } from '@/components/dashboard/settings/AppearanceSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Account');

  return (
    <div className="p-6 md:p-10 space-y-8 md:space-y-10 max-w-[1600px] mx-auto font-jakarta pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-[24px] md:text-[32px] font-bold text-[#040B37] tracking-tight leading-tight">
            Settings
          </h1>
          <p className="text-[#9CA3AF] text-[15px] md:text-[16px] font-medium tracking-tight">
            Customize your account and experience
          </p>
        </div>
        
        <button className="bg-[#1C4ED1] hover:bg-[#163BB1] text-white px-8 py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer">
          Save Changes
        </button>
      </div>

      {/* Settings Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Section switcher */}
        <div className="flex-1 w-full">
          {activeTab === 'Account' && <AccountSettings />}
          {activeTab === 'Notifications' && <NotificationSettings />}
          {activeTab === 'Language' && <LanguageSettings />}
          {activeTab === 'Appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  );
}
