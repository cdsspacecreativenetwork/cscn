import { AdminPermissionsConsole } from "@/components/dashboard/admin/AdminPermissionsConsole";
import { getAdminPermissionsOverview } from "@/data/admin-permissions";
import { requireAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Permissions & Administration | CSCN Admin" };

export default async function AdminPermissionsPage() {
  const session = await requireAdminPermission("canManagePermissions");
  const data = await getAdminPermissionsOverview();

  return (
    <AdminPermissionsConsole
      data={JSON.parse(JSON.stringify(data))}
      currentUserRole={session.user.role ?? "ADMIN"}
    />
  );
}
