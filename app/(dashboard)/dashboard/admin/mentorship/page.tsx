import { AdminMentorshipConsole } from "@/components/dashboard/admin/AdminMentorshipConsole";
import { getAdminMentorshipConsole } from "@/data/admin-mentorship";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { hasAdminPermission } from "@/lib/admin-permissions";

export const metadata = { title: "Mentorship | CSCN Admin" };

export default async function AdminMentorshipPage() {
  const session = await requireAnyAdminPermission(["canManageInstructors", "canVerifyInstructors", "canManageBilling"]);
  const data = await getAdminMentorshipConsole();

  return (
    <AdminMentorshipConsole
      data={JSON.parse(JSON.stringify(data))}
      canManageMentorship={hasAdminPermission(session.user, "canManageInstructors")}
    />
  );
}
