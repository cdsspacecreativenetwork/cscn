import React from 'react';
import { auth } from '@/auth';
import { getUserSecurityDetails } from '@/actions/settings';
import { SettingsTabsWrapper } from '@/components/dashboard/settings/SettingsTabsWrapper';
import { getCalendarIntegrationStatus } from '@/data/integrations';

type SearchParams = Promise<{
  tab?: string;
}>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [userData, session, params] = await Promise.all([
    getUserSecurityDetails(),
    auth(),
    searchParams,
  ]);
  const integrations = session?.user?.id
    ? await getCalendarIntegrationStatus(session.user.id)
    : {
        googleCalendar: {
          connected: false,
          email: null,
          status: null,
          connectedAt: null,
        },
      };

  return (
    <div className="p-6 md:p-10 space-y-8 md:space-y-10 max-w-[1600px] mx-auto font-jakarta pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-[24px] md:text-[32px] font-bold text-[#040B37] tracking-tight leading-tight">
            Settings
          </h1>
          <p className="text-[#9CA3AF] text-[14px] md:text-[16px] font-medium tracking-tight">
            Customize your credentials, payouts, notifications, and preferences
          </p>
        </div>
      </div>

      {/* Settings Layout Grid */}
      <SettingsTabsWrapper
        initialUserData={userData}
        initialIntegrations={integrations}
        initialActiveTab={params.tab || 'Account'}
      />
    </div>
  );
}
