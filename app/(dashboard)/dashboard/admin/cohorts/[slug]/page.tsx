import { notFound } from "next/navigation";

import { CohortOperationsConsole } from "@/components/cohorts/CohortOperationsConsole";
import { requireAdminPermission } from "@/lib/admin-guards";
import { getCohortOperationsDashboard } from "@/lib/services/cohort-management.service";

export default async function AdminCohortOperationsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdminPermission("canManageCohorts");
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const data = await getCohortOperationsDashboard(slug);
  if (!data) notFound();
  const message = query.error ? { kind: "error" as const, text: query.error } : query.success ? { kind: "success" as const, text: query.success } : null;
  return <CohortOperationsConsole data={data} adminMode returnTo={`/dashboard/admin/cohorts/${slug}`} message={message}/>;
}
