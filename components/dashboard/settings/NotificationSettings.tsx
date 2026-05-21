'use client';

import React, { useState, useEffect } from 'react';
import { SettingsToggle } from './SettingsToggle';
import { updateNotificationPreferences } from '@/actions/settings';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface NotificationSettingsProps {
  initialPreferences?: any;
  onUpdate?: () => Promise<void>;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  initialPreferences,
  onUpdate
}) => {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    emailNotifications: true,
    pushNotifications: true,
    courseReminders: true,
    marketingEmails: false,
    weeklyDigest: true,
    ...initialPreferences
  });

  const [savingField, setSavingField] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialPreferences) {
      setPrefs((prev: Record<string, boolean>) => ({ ...prev, ...initialPreferences }));
    }
  }, [initialPreferences]);

  const handleToggle = async (key: string, nextValue: boolean) => {
    // Standard Browser Push Notification Permission request
    if (key === "pushNotifications" && nextValue) {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Permission denied. To receive browser notifications, please enable them manually in your browser's site settings.");
          return;
        }
      }
    }

    setSavingField(key);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updatedPrefs = { ...prefs, [key]: nextValue };
      setPrefs(updatedPrefs);

      const res = await updateNotificationPreferences(updatedPrefs);
      if (res.error) {
        setErrorMsg(res.error);
        // revert UI state
        setPrefs(prefs);
      } else {
        setSuccessMsg("Preferences saved successfully");
        if (onUpdate) await onUpdate();
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (err) {
      setErrorMsg("Failed to save changes. Please try again.");
      setPrefs(prefs);
    } finally {
      setSavingField(null);
    }
  };

  return (
    <div className="flex-1 bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm font-jakarta w-full">
      {/* Section Header */}
      <div className="border-b border-[#E3E8F4] px-6 py-5 md:px-8">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37]">
          Notification Settings
        </h3>
        <p className="text-[13px] text-gray-400 font-medium mt-1">
          Decide when and how you want to receive alerts from CSCN Academy.
        </p>
      </div>

      {/* Notification Options */}
      <div className="divide-y divide-[#E3E8F4]">
        {/* Email notifications toggle */}
        <div className="flex items-center justify-between gap-4 py-5 px-6 md:px-8 hover:bg-[#F8FAFB]/40 transition-colors">
          <div className="space-y-1">
            <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
              Email Notifications
            </h4>
            <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
              Receive billing receipt info, course reports, and security logs
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savingField === 'emailNotifications' && <Loader2 size={13} className="text-[#1C4ED1] animate-spin" />}
            <SettingsToggle 
              checked={prefs.emailNotifications} 
              onChange={(val) => handleToggle('emailNotifications', val)} 
            />
          </div>
        </div>

        {/* Push notifications toggle */}
        <div className="flex items-center justify-between gap-4 py-5 px-6 md:px-8 hover:bg-[#F8FAFB]/40 transition-colors">
          <div className="space-y-1">
            <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
              Push Notifications
            </h4>
            <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
              Receive browser banner push notifications when online
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savingField === 'pushNotifications' && <Loader2 size={13} className="text-[#1C4ED1] animate-spin" />}
            <SettingsToggle 
              checked={prefs.pushNotifications} 
              onChange={(val) => handleToggle('pushNotifications', val)} 
            />
          </div>
        </div>

        {/* Course Reminders toggle */}
        <div className="flex items-center justify-between gap-4 py-5 px-6 md:px-8 hover:bg-[#F8FAFB]/40 transition-colors">
          <div className="space-y-1">
            <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
              Course Reminders
            </h4>
            <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
              Alerts for upcoming session schedules, study goals, and streaks
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savingField === 'courseReminders' && <Loader2 size={13} className="text-[#1C4ED1] animate-spin" />}
            <SettingsToggle 
              checked={prefs.courseReminders} 
              onChange={(val) => handleToggle('courseReminders', val)} 
            />
          </div>
        </div>

        {/* Marketing Emails toggle */}
        <div className="flex items-center justify-between gap-4 py-5 px-6 md:px-8 hover:bg-[#F8FAFB]/40 transition-colors">
          <div className="space-y-1">
            <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
              Marketing Emails
            </h4>
            <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
              Promotions, course discounts, and updates on platform additions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savingField === 'marketingEmails' && <Loader2 size={13} className="text-[#1C4ED1] animate-spin" />}
            <SettingsToggle 
              checked={prefs.marketingEmails} 
              onChange={(val) => handleToggle('marketingEmails', val)} 
            />
          </div>
        </div>

        {/* Weekly Digest toggle */}
        <div className="flex items-center justify-between gap-4 py-5 px-6 md:px-8 hover:bg-[#F8FAFB]/40 transition-colors">
          <div className="space-y-1">
            <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
              Weekly Digest
            </h4>
            <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
              Receive a personalized summary of your learning progress every Monday
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savingField === 'weeklyDigest' && <Loader2 size={13} className="text-[#1C4ED1] animate-spin" />}
            <SettingsToggle 
              checked={prefs.weeklyDigest} 
              onChange={(val) => handleToggle('weeklyDigest', val)} 
            />
          </div>
        </div>
      </div>

      {/* Save indicators */}
      {(successMsg || errorMsg) && (
        <div className="p-4 border-t border-[#E3E8F4] bg-[#F8FAFB]/40 text-center animate-in fade-in duration-200">
          {successMsg && (
            <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle2 size={12} /> {successMsg}
            </p>
          )}
          {errorMsg && (
            <p className="text-[11px] font-bold text-rose-600 flex items-center justify-center gap-1">
              <AlertCircle size={12} /> {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
