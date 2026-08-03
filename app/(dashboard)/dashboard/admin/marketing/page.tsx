import { AdminMarketingConsole } from "@/components/dashboard/admin/AdminMarketingConsole";
import { getMarketingSettings, listAdminHomepageReviews } from "@/data/marketing";
import { requireAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Marketing | CSCN Admin" };

export default async function AdminMarketingPage() {
  await requireAdminPermission("canManageMarketing");
  const [settings, reviews] = await Promise.all([
    getMarketingSettings(),
    listAdminHomepageReviews(),
  ]);

  return <AdminMarketingConsole settings={settings} reviews={JSON.parse(JSON.stringify(reviews))} />;
}
