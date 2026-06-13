import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminScheduleConsole } from "@/components/dashboard/admin/AdminScheduleConsole";
import { getAdminScheduleOverview } from "@/data/admin-schedule";
import { hasAnyAdminPermission } from "@/lib/admin-permissions";

function numberParam(value: string | string[] | undefined) {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminPlatformEventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const canManageEvents = hasAnyAdminPermission(session.user, [
    "canManageCourses",
    "canManageInstructors",
    "canManageSettings",
  ]);

  if (!canManageEvents) redirect("/dashboard/admin");

  const params = searchParams ? await searchParams : {};
  const overview = await getAdminScheduleOverview({
    attentionPage: numberParam(params.attentionPage),
    eventsPage: numberParam(params.eventsPage),
  });

  return (
    <AdminScheduleConsole
      overview={overview}
      error={typeof params.error === "string" ? params.error : undefined}
      cancelled={params.cancelled === "1"}
      completed={params.completed === "1"}
      reviewed={params.reviewed === "1"}
      refund={params.refund === "1"}
    />
  );
}
