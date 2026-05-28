import { AdminBillingConsole } from "@/components/dashboard/admin/AdminBillingConsole";
import { getAdminBillingOverview } from "@/data/admin-billing";
import { requireAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Billing | CSCN Admin" };

export default async function AdminBillingPage() {
  const session = await requireAdminPermission("canManageBilling");
  const data = await getAdminBillingOverview(session.user.id);

  return <AdminBillingConsole data={JSON.parse(JSON.stringify(data))} />;
}
