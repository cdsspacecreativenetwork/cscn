'use client';

import React, { useState } from 'react';
import { SettingsSidebar } from './SettingsSidebar';
import { AccountSettings } from './AccountSettings';
import { InstructorPayoutSettings } from './InstructorPayoutSettings';
import { NotificationSettings } from './NotificationSettings';
import { LanguageSettings } from './LanguageSettings';
import { AppearanceSettings } from './AppearanceSettings';

interface SettingsTabsWrapperProps {
  initialUserData: any;
}

export const SettingsTabsWrapper: React.FC<SettingsTabsWrapperProps> = ({ initialUserData }) => {
  const [activeTab, setActiveTab] = useState('Account');
  const [userData, setUserData] = useState<any>(initialUserData);

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
        onTabChange={setActiveTab} 
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
        
        {activeTab === 'Payouts' && userData && (
          <InstructorPayoutSettings 
            initialMethod={userData.payoutMethod || 'BANK'}
            initialDetails={userData.payoutDetails || {}}
            onSaveSuccess={fetchUserData}
          />
        )}

        {activeTab === 'Notifications' && userData && (
          <NotificationSettings 
            initialPreferences={userData.notifications}
            onUpdate={fetchUserData}
          />
        )}

        {activeTab === 'Language' && <LanguageSettings />}
        {activeTab === 'Appearance' && <AppearanceSettings />}
      </div>
    </div>
  );
};
