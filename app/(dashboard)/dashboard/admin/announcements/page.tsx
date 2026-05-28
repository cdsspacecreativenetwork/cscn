import { AdminAnnouncementsConsole } from "@/components/dashboard/admin/AdminAnnouncementsConsole";
import { getAdminAnnouncements } from "@/data/announcements";
import { requireAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Announcements | CSCN Admin" };

export default async function AdminAnnouncementsPage() {
  await requireAdminPermission("canManageAnnouncements");
  const announcements = await getAdminAnnouncements();

  return <AdminAnnouncementsConsole announcements={JSON.parse(JSON.stringify(announcements))} />;
}
