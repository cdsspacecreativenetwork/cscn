'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SettingsSidebar } from './SettingsSidebar';
import { AccountSettings } from './AccountSettings';
import { InstructorPayoutSettings } from './InstructorPayoutSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { NotificationSettings } from './NotificationSettings';
import { LanguageSettings } from './LanguageSettings';
import { AppearanceSettings } from './AppearanceSettings';
import type { CalendarIntegrationStatus } from '@/data/integrations';

interface SettingsTabsWrapperProps {
  initialUserData: any;
  initialIntegrations: CalendarIntegrationStatus;
  initialActiveTab?: string;
}

export function normalizeSettingsTab(tabParam?: string): string {
  if (!tabParam) return 'Account';
  const lower = tabParam.toLowerCase().trim();
  if (lower === 'payout' || lower === 'payouts') return 'Payouts';
  if (lower === 'account') return 'Account';
  if (lower === 'integration' || lower === 'integrations') return 'Integrations';
  if (lower === 'notification' || lower === 'notifications') return 'Notifications';
  if (lower === 'appearance') return 'Appearance';
  if (lower === 'language') return 'Language';
  return 'Account';
}

export const SettingsTabsWrapper: React.FC<SettingsTabsWrapperProps> = ({
  initialUserData,
  initialIntegrations,
  initialActiveTab = 'Account',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTabParam = searchParams.get('tab');

  const normalizedInitial = normalizeSettingsTab(currentTabParam || initialActiveTab);
  const [activeTab, setActiveTab] = useState(normalizedInitial);
  const [userData, setUserData] = useState<any>(initialUserData);

  useEffect(() => {
    if (currentTabParam) {
      const normalized = normalizeSettingsTab(currentTabParam);
      setActiveTab(normalized);
    }
  }, [currentTabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const queryTab = tab.toLowerCase();
    router.push(`/dashboard/settings?tab=${queryTab}`, { scroll: false });
  };

  const fetchUserData = async () => {
    const { getUserSecurityDetails } = await import('@/actions/settings');
    const data = await getUserSecurityDetails();
    if (data) {
      setUserData(data);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* Navigation Sidebar */}
      <SettingsSidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        userRole={userData?.role}
      />

      {/* Content Section switcher */}
      <div className="flex-1 w-full">
        {activeTab === 'Account' && (
          <AccountSettings 
            initialData={userData} 
            onUpdate={fetchUserData}
          />
        )}
        
        {activeTab === 'Payouts' && (
          <InstructorPayoutSettings 
            initialMethod={userData?.payoutMethod || ''}
            initialDetails={userData?.payoutDetails || {}}
            onSaveSuccess={fetchUserData}
          />
        )}

        {activeTab === 'Notifications' && (
          <NotificationSettings 
            initialPreferences={userData?.notifications}
            onUpdate={fetchUserData}
          />
        )}

        {activeTab === 'Integrations' && (
          <IntegrationsSettings integrations={initialIntegrations} />
        )}

        {activeTab === 'Language' && <LanguageSettings />}
        {activeTab === 'Appearance' && <AppearanceSettings />}
      </div>
    </div>
  );
};
