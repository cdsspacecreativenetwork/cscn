import { auth } from "@/auth";
import { getOrganizationDashboard } from "@/lib/services/organization.service";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Authentication required", { status: 401 });
  const { slug } = await params;
  const data = await getOrganizationDashboard(session.user.id, slug);
  if (!data?.canManage || !data.report) return new Response("Report unavailable", { status: 403 });

  const rows = [
    ["Organization", data.membership.organization.name],
    ["Generated at", new Date().toISOString()],
    ["Allocated learners", String(data.report.allocatedLearners)],
    ["Activated learners", String(data.report.activatedLearners)],
    ["Average completion", `${data.report.averageCompletion}%`],
    ["Completed plans", String(data.report.completedLearners)],
    ["Privacy scope", "Aggregate learning signals only; no private learner content"],
  ];
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}-aggregate-progress.csv"`, "Cache-Control": "private, no-store" } });
}
