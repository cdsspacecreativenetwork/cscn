'use client';

import React, { useState } from 'react';
import { SettingsToggle } from './SettingsToggle';

const SettingItem = ({ 
  title, 
  description, 
  actionLabel, 
  isDanger = false, 
  type = 'button' 
}: { 
  title: string; 
  description: string; 
  actionLabel?: string; 
  isDanger?: boolean;
  type?: 'button' | 'toggle';
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 px-6 md:px-8 border-b border-[#E3E8F4] last:border-0 hover:bg-[#F4F6FB]/30 transition-colors">
    <div className="space-y-1">
      <h4 className={`text-[16px] font-semibold tracking-tight ${isDanger ? 'text-[#FF383C]' : 'text-[#4B5563]'}`}>
        {title}
      </h4>
      <p className="text-[12px] md:text-[14px] font-medium text-[#9CA3AF] tracking-tight">
        {description}
      </p>
    </div>
    
    {type === 'toggle' ? (
      <SettingsToggle checked={true} onChange={() => {}} />
    ) : (
      <button className={`px-5 py-2 rounded-[8px] text-[12px] md:text-[14px] font-bold border transition-all ${
        isDanger 
          ? 'bg-[#FF383C]/5 border-[#FF383C] text-[#FF383C] hover:bg-[#FF383C] hover:text-white' 
          : 'bg-white border-[#E3E8F4] text-[#4B5563] hover:border-[#1C4ED1] hover:text-[#1C4ED1]'
      }`}>
        {actionLabel}
      </button>
    )}
  </div>
);

export const AccountSettings = () => {
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);

  return (
    <div className="flex-1 bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm">
      {/* Section Header */}
      <div className="bg-white border-b border-[#E3E8F4] px-6 py-5 md:px-8 rounded-t-[16px]">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight font-jakarta">
          Account Settings
        </h3>
      </div>

      {/* Settings Items */}
      <div className="flex flex-col">
        <SettingItem 
          title="Change Password" 
          description="Update your account password" 
          actionLabel="Change" 
        />
        <div className="flex items-center justify-between gap-4 py-6 px-6 md:px-8 border-b border-[#E3E8F4] hover:bg-[#F4F6FB]/30 transition-colors">
          <div className="space-y-1">
            <h4 className="text-[16px] font-semibold text-[#4B5563] tracking-tight">
              Two-Factor Authentication
            </h4>
            <p className="text-[12px] md:text-[14px] font-medium text-[#9CA3AF] tracking-tight">
              Add an extra layer of security
            </p>
          </div>
          <SettingsToggle 
            checked={isTwoFactorEnabled} 
            onChange={setIsTwoFactorEnabled} 
          />
        </div>
        <SettingItem 
          title="Active Sessions" 
          description="Manage devices with active sessions" 
          actionLabel="View" 
        />
        <SettingItem 
          title="Delete Account" 
          description="Permanently delete your account and data" 
          actionLabel="Delete" 
          isDanger={true}
        />
      </div>
    </div>
  );
};
