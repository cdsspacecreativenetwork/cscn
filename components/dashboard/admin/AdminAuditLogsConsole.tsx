import Link from "next/link";
import { Activity, Clock3, Database, ShieldCheck, UserRound } from "lucide-react";

import type { getAdminAuditLogs } from "@/data/audit-logs";
import { Pagination } from "@/components/dashboard/admin/Pagination";
import { AdminAuditLogFilters } from "@/components/dashboard/admin/AdminAuditLogFilters";

type AuditData = Awaited<ReturnType<typeof getAdminAuditLogs>>;

interface Props {
  data: AuditData;
  query?: string;
  action?: string;
  entityType?: string;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `/dashboard/admin/audit-logs?${qs}` : "/dashboard/admin/audit-logs";
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAction(action: string) {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" / ");
}

function metadataPreview(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "No metadata";
  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, 4);
  if (entries.length === 0) return "No metadata";
  return entries.map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`).join(" | ");
}

export function AdminAuditLogsConsole({ data, query, action = "all", entityType = "all" }: Props) {
  const statCards = [
    { label: "Matching events", value: data.total, icon: Activity },
    { label: "Action types", value: data.actionOptions.length, icon: ShieldCheck },
    { label: "Entity types", value: data.entityOptions.length, icon: Database },
  ];

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
          <ShieldCheck size={13} /> Supervision
        </p>
        <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#040B37] md:text-[34px]">Audit Logs</h1>
        <p className="mt-1 max-w-2xl text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
          A read-only accountability trail for sensitive admin actions across users, courses, pricing, instructors, and announcements.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="flex min-h-[132px] flex-col gap-6 rounded-[12px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[16px] font-semibold text-[#9CA3AF]">{card.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F4F6FB] text-[#1C4ED1]">
                <card.icon size={20} />
              </div>
            </div>
            <p className="text-[34px] font-black leading-none text-[#040B37]">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5 sm:p-6">
          <AdminAuditLogFilters
            query={query}
            action={action}
            entityType={entityType}
            actionOptions={data.actionOptions.map((option) => ({ value: option.value, label: option.label }))}
            entityOptions={data.entityOptions.map((option) => ({ value: option.value, label: option.label }))}
          />
        </div>

        {data.logs.length > 0 ? (
          <>
            <div className="admin-horizontal-scrollbar overflow-auto">
              <table className="w-full min-w-[1160px]">
                <thead className="bg-[#F8FAFF]">
                  <tr className="border-b border-[#E3E8F4]">
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Actor</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Action</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Entity</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Metadata</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F6FB]">
                  {data.logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-[#F8FAFF]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1C4ED1]/10 text-[#1C4ED1]">
                            <UserRound size={17} />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-[#040B37]">{log.actorName ?? "System"}</p>
                            <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{log.actorEmail ?? "No actor email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="rounded-full bg-[#1C4ED1]/5 px-3 py-1 text-[12px] font-black capitalize text-[#1C4ED1]">
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-[13px] font-black text-[#4B5563]">{log.entityType}</p>
                        <p className="mt-1 max-w-[260px] truncate text-[11px] font-semibold text-[#9CA3AF]">{log.entityName ?? log.entityId ?? "No target"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="max-w-[420px] truncate text-[12px] font-semibold text-[#9CA3AF]">{metadataPreview(log.metadata)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-[12px] font-bold text-[#4B5563]">
                          <Clock3 size={14} className="text-[#1C4ED1]" /> {formatDate(log.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              baseUrl={buildQuery({ q: query, action, entityType })}
            />
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-[15px] font-bold text-[#040B37]">No audit events found</p>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Sensitive admin actions will appear here once they happen.</p>
            <Link href="/dashboard/admin" className="mt-4 inline-block text-[13px] font-bold text-[#1C4ED1] hover:underline">
              Back to command center
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
