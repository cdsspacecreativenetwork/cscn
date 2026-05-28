import { AdminModulePlaceholder } from "@/components/dashboard/admin/AdminModulePlaceholder";
import { requireAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Marketing | CSCN Admin" };

export default async function AdminMarketingPage() {
  await requireAdminPermission("canManageMarketing");

  return (
    <AdminModulePlaceholder
      title="Marketing"
      phase="Phase 9"
      description="A growth and curation surface for homepage content, featured courses, featured instructors, campaigns, and promo strategy."
      bullets={[
        "Curate featured courses, featured instructors, mentorship visibility, and homepage sections.",
        "Create campaign surfaces, promo codes, and course collection rules.",
        "Separate editorial marketing decisions from course review and instructor verification.",
        "Show marketing controls only to marketing-approved admins and super admins.",
      ]}
    />
  );
}
