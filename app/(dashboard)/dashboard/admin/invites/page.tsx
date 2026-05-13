import { Link2, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { getAllInvites } from "@/data/invite";
import { RoleBadge } from "@/components/dashboard/admin/RoleBadge";
import { InviteForm } from "@/components/dashboard/admin/InviteForm";
import { InviteTableActions } from "@/components/dashboard/admin/InviteTableActions";

function getInviteStatus(invite: {
  usedAt: Date | null;
  expiresAt: Date;
}): "used" | "expired" | "active" {
  if (invite.usedAt) return "used";
  if (new Date() > invite.expiresAt) return "expired";
  return "active";
}

function StatusBadge({ status }: { status: "used" | "expired" | "active" }) {
  if (status === "used") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} />
        Used
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-red-50 text-red-500 border border-red-200">
        <XCircle size={11} />
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#F4F6FB] text-[#1C4ED1] border border-[#1C4ED1]/20">
      <Clock size={11} />
      Active
    </span>
  );
}

function formatExpiry(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour left";
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export default async function AdminInvitesPage() {
  const [session, invites] = await Promise.all([auth(), getAllInvites()]);
  const currentUserRole = (session?.user?.role as string) ?? "ADMIN";

  const active = invites.filter((i) => getInviteStatus(i) === "active").length;
  const used = invites.filter((i) => getInviteStatus(i) === "used").length;
  const expired = invites.filter((i) => getInviteStatus(i) === "expired").length;

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[24px] md:text-[32px] font-bold text-[#040B37] tracking-tight">
            Invite Links
          </h1>
          <p className="text-[14px] text-[#9CA3AF] font-medium">
            Generate and manage invite links for instructors and admins
          </p>
        </div>
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#E3E8F4] bg-white hover:bg-[#F4F6FB] text-[#040B37] rounded-[10px] text-[14px] font-semibold transition-all shrink-0"
        >
          ← Back to Users
        </Link>
      </div>

      {/* Generate Invite Card */}
      <div className="bg-white border border-[#E3E8F4] rounded-[12px] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1C4ED1]/10 flex items-center justify-center shrink-0">
            <Link2 size={18} className="text-[#1C4ED1]" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-[#040B37]">
              Generate Invite Link
            </h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Links expire after 48 hours. Optionally restrict to a specific email.
            </p>
          </div>
        </div>
        <InviteForm currentUserRole={currentUserRole} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active", value: active, color: "text-[#1C4ED1]" },
          { label: "Used", value: used, color: "text-emerald-600" },
          { label: "Expired", value: expired, color: "text-[#9CA3AF]" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#E3E8F4] rounded-[12px] p-5 text-center"
          >
            <p className={`text-[28px] font-bold leading-tight ${s.color}`}>
              {s.value}
            </p>
            <p className="text-[12px] text-[#9CA3AF] font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Invites Table */}
      <div className="bg-white border border-[#E3E8F4] rounded-[12px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E3E8F4] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#040B37]">
            All Invites
          </h2>
          <span className="text-[13px] text-[#9CA3AF] font-medium">
            {invites.length} total
          </span>
        </div>

        {invites.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[15px] text-[#9CA3AF] font-medium">
              No invites generated yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F4F6FB]">
                  <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden md:table-cell">
                    Email Restriction
                  </th>
                  <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden lg:table-cell">
                    Expiry
                  </th>
                  <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F6FB]">
                {invites.map((invite) => {
                  const status = getInviteStatus(invite);
                  return (
                    <tr
                      key={invite.id}
                      className="hover:bg-[#F4F6FB]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <RoleBadge role={invite.role} />
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-[13px] text-[#4B5563] font-mono">
                          {invite.email ?? (
                            <span className="text-[#9CA3AF] not-italic font-sans">
                              Any user
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-[13px] text-[#9CA3AF]">
                          {status === "used"
                            ? new Date(invite.usedAt!).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                              )
                            : formatExpiry(invite.expiresAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <InviteTableActions
                          id={invite.id}
                          token={invite.token}
                          isExpiredOrUsed={status !== "active"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
