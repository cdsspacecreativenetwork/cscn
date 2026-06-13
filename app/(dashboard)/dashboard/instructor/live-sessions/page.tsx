import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LiveSessionsManager } from "@/components/dashboard/instructor/LiveSessionsManager";
import { getCalendarIntegrationStatus } from "@/data/integrations";
import { getInstructorLiveSessions } from "@/data/schedule";
import { db } from "@/lib/db";
import { shouldRedirectInstructorToOnboarding } from "@/lib/instructor-onboarding";
import { DEFAULT_SCHEDULE_TIME_ZONE } from "@/lib/schedule-time";

type SearchParams = Promise<{
  error?: string;
  created?: string;
  updated?: string;
  cancelled?: string;
  started?: string;
  ended?: string;
}>;

export default async function InstructorLiveSessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const role = session.user.role;
  if (role !== "INSTRUCTOR" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  if (role === "INSTRUCTOR" && await shouldRedirectInstructorToOnboarding(session.user.id)) {
    redirect("/dashboard/profile?setup=instructor");
  }

  const params = await searchParams;
  const [courses, sessions, profile, integrations] = await Promise.all([
    db.course.findMany({
      where: {
        OR: [
          { instructorId: session.user.id },
          { instructors: { some: { userId: session.user.id } } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    getInstructorLiveSessions(session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    }),
    getCalendarIntegrationStatus(session.user.id),
  ]);

  return (
    <LiveSessionsManager
      courses={courses}
      sessions={sessions}
      integrations={integrations}
      defaultTimezone={profile?.timezone ?? DEFAULT_SCHEDULE_TIME_ZONE}
      error={params.error}
      created={params.created === "1"}
      updated={params.updated === "1"}
      cancelled={params.cancelled === "1"}
      started={params.started === "1"}
      ended={params.ended === "1"}
    />
  );
}
