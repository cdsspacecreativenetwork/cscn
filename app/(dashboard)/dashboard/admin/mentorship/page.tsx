import { AdminMentorshipConsole } from "@/components/dashboard/admin/AdminMentorshipConsole";
import { CohortMentorAssignments } from "@/components/dashboard/admin/CohortMentorAssignments";
import { getAdminMentorshipConsole } from "@/data/admin-mentorship";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAdminCohortMentorship } from "@/lib/services/cohort-mentorship.service";

export const metadata = { title: "Mentorship | CSCN Admin" };

export default async function AdminMentorshipPage() {
  const session = await requireAnyAdminPermission(["canManageInstructors", "canVerifyInstructors", "canManageBilling"]);
  const [data, cohortMentorship] = await Promise.all([getAdminMentorshipConsole(), getAdminCohortMentorship()]);

  return (
    <div className="space-y-6 pb-20">
      <AdminMentorshipConsole
        data={JSON.parse(JSON.stringify(data))}
        canManageMentorship={hasAdminPermission(session.user, "canManageInstructors")}
      />
      <div className="mx-auto max-w-[1600px] px-4 md:px-8"><CohortMentorAssignments data={JSON.parse(JSON.stringify(cohortMentorship))} /></div>
    </div>
  );
}
