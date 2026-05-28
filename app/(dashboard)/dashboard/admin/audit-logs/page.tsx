import { AdminAuditLogsConsole } from "@/components/dashboard/admin/AdminAuditLogsConsole";
import { getAdminAuditLogs } from "@/data/audit-logs";
import { requireAdminPermission } from "@/lib/admin-guards";

export const metadata = { title: "Audit Logs | CSCN Admin" };

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; action?: string; entityType?: string }>;
}

export default async function AdminAuditLogsPage({ searchParams }: PageProps) {
  await requireAdminPermission("canViewAuditLogs");
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const query = params.q?.trim();
  const action = params.action ?? "all";
  const entityType = params.entityType ?? "all";
  const data = await getAdminAuditLogs({ page, query, action, entityType });

  return (
    <AdminAuditLogsConsole
      data={JSON.parse(JSON.stringify(data))}
      query={query}
      action={action}
      entityType={entityType}
    />
  );
}
