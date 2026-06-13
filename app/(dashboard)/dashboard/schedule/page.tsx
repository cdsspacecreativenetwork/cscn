import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ScheduleClient } from "@/components/dashboard/schedule/ScheduleClient";
import { getCalendarIntegrationStatus } from "@/data/integrations";
import { getStudentScheduleEvents } from "@/data/schedule";

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [scheduleEvents, integrations] = await Promise.all([
    getStudentScheduleEvents(session.user.id),
    getCalendarIntegrationStatus(session.user.id),
  ]);

  return <ScheduleClient scheduleEvents={scheduleEvents} googleCalendarConnected={integrations.googleCalendar.connected} />;
}
