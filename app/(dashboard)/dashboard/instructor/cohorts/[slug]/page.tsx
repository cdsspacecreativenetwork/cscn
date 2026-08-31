import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CohortOperationsConsole } from "@/components/cohorts/CohortOperationsConsole";
import { getCohortOperationsDashboard, canOperateCohort } from "@/lib/services/cohort-management.service";

export default async function InstructorCohortOperationsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!(await canOperateCohort(session.user.id, slug, false))) redirect("/dashboard/instructor/cohorts");
  const data = await getCohortOperationsDashboard(slug);
  if (!data) notFound();
  const message = query.error ? { kind: "error" as const, text: query.error } : query.success ? { kind: "success" as const, text: query.success } : null;
  return <CohortOperationsConsole data={data} adminMode={false} returnTo={`/dashboard/instructor/cohorts/${slug}`} message={message}/>;
}
