"use client";

import { GoogleCalendarIntegrationCard } from "@/components/dashboard/integrations/GoogleCalendarIntegrationCard";
import type { CalendarIntegrationStatus } from "@/data/integrations";

export function IntegrationsSettings({
  integrations,
}: {
  integrations: CalendarIntegrationStatus;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-[#E3E8F4] bg-white px-6 py-5 shadow-sm md:px-8">
        <h3 className="text-[16px] font-bold text-[#040B37] md:text-[18px]">Integrations</h3>
        <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#9CA3AF]">
          Connect external tools CSCN can use for scheduling, meetings, availability, and future workflow automation.
        </p>
      </div>

      <GoogleCalendarIntegrationCard
        status={integrations.googleCalendar}
        returnTo="/dashboard/settings?tab=Integrations"
      />
    </div>
  );
}
