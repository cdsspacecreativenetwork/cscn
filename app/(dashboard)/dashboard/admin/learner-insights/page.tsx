import { AdminLearnerInsightsConsole } from "@/components/dashboard/admin/AdminLearnerInsightsConsole";
import { getLearnerInsights } from "@/data/learner-insights";
import { requireAnyAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Learner Insights | CSCN Admin" };

export default async function AdminLearnerInsightsPage() {
  await requireAnyAdminPermission(["canManageLearners", "canManageMarketing", "canViewAnalytics"]);
  const insights = await getLearnerInsights();

  return <AdminLearnerInsightsConsole insights={JSON.parse(JSON.stringify(insights))} />;
}
