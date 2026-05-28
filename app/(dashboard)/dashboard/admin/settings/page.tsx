import { AdminModulePlaceholder } from "@/components/dashboard/admin/AdminModulePlaceholder";
import { requireAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Platform Settings | CSCN Admin" };

export default async function AdminSettingsPage() {
  await requireAdminPermission("canManageSettings");

  return (
    <AdminModulePlaceholder
      title="Platform Settings"
      phase="Phase 12"
      description="A platform-level settings area, separate from personal profile and account settings."
      bullets={[
        "Manage categories, course taxonomy, certificate rules, and platform defaults.",
        "Centralize email, payment, branding, and feature-flag settings over time.",
        "Keep personal settings under Account/Profile, not mixed with platform settings.",
        "Restrict high-risk platform settings to super admin or approved settings permissions.",
      ]}
    />
  );
}
