'use client';

import React, { useState } from 'react';
import { SettingsToggle } from './SettingsToggle';

const NotificationItem = ({ 
  title, 
  description, 
  initialValue 
}: { 
  title: string; 
  description: string; 
  initialValue: boolean;
}) => {
  const [enabled, setEnabled] = useState(initialValue);
  
  return (
    <div className="flex items-center justify-between gap-4 py-6 px-6 md:px-8 hover:bg-[#F4F6FB]/30 transition-colors">
      <div className="space-y-1">
        <h4 className="text-[16px] font-semibold text-[#4B5563] tracking-tight font-jakarta">
          {title}
        </h4>
        <p className="text-[12px] md:text-[14px] font-medium text-[#9CA3AF] tracking-tight">
          {description}
        </p>
      </div>
      <SettingsToggle checked={enabled} onChange={setEnabled} />
    </div>
  );
};

export const NotificationSettings = () => {
  return (
    <div className="flex-1 bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm">
      {/* Section Header */}
      <div className="bg-white px-6 py-5 md:px-8 rounded-t-[16px]">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight font-jakarta">
          Notification Preferences
        </h3>
      </div>

      {/* Notification Options */}
      <div className="flex flex-col">
        <NotificationItem 
          title="Email Notifications" 
          description="Receive updates via email" 
          initialValue={true} 
        />
        <NotificationItem 
          title="Push Notifications" 
          description="Browser push notifications" 
          initialValue={true} 
        />
        <NotificationItem 
          title="Course Reminders" 
          description="Deadlines and upcoming sessions" 
          initialValue={true} 
        />
        <NotificationItem 
          title="Marketing Emails" 
          description="Tips, offers, and new courses" 
          initialValue={false} 
        />
        <NotificationItem 
          title="Weekly Digest" 
          description="Your learning summary every Monday" 
          initialValue={true} 
        />
      </div>
    </div>
  );
};
