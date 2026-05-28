import { ShieldCheck, UserCog, UsersRound, Workflow } from "lucide-react";

import type { getAdminPermissionsOverview } from "@/data/admin-permissions";
import { AdminPermissionsDrawer } from "@/components/dashboard/admin/AdminPermissionsDrawer";
import { RoleBadge } from "@/components/dashboard/admin/RoleBadge";
import { UserRoleSelect } from "@/components/dashboard/admin/UserRoleSelect";

type PermissionsData = Awaited<ReturnType<typeof getAdminPermissionsOverview>>;

interface Props {
  data: PermissionsData;
  currentUserRole: string;
}

const PRESETS = [
  {
    name: "Course Reviewer",
    scope: "Courses",
    description: "Reviews submitted course content, leaves feedback, and requests changes before publish.",
    permissions: ["Review courses", "View analytics"],
  },
  {
    name: "Course Publisher",
    scope: "Courses",
    description: "Publishes already-reviewed courses and manages course operations, but should not review their own submissions.",
    permissions: ["Manage courses", "Publish courses"],
  },
  {
    name: "Instructor Manager",
    scope: "People",
    description: "Manages instructor profiles, verification readiness, mentorship visibility, and public trust signals.",
    permissions: ["Manage instructors", "Verify instructors"],
  },
  {
    name: "Finance Admin",
    scope: "Business",
    description: "Handles billing, refunds, payout requests, revenue snapshots, and payout operations.",
    permissions: ["Manage billing", "View audit logs"],
  },
  {
    name: "Marketing Operator",
    scope: "Growth",
    description: "Runs campaigns, paid placements, lead magnets, and promoted platform surfaces.",
    permissions: ["Manage marketing", "Manage announcements"],
  },
];

function getDisplayName(user: { name: string | null; email: string | null }) {
  return user.name ?? user.email ?? "Unnamed user";
}

export function AdminPermissionsConsole({ data, currentUserRole }: Props) {
  const totalAdmins = data.counts.ADMIN + data.counts.SUPER_ADMIN;
  const statCards = [
    { label: "Super admins", value: data.counts.SUPER_ADMIN, icon: ShieldCheck },
    { label: "Scoped admins", value: data.counts.ADMIN, icon: UserCog },
    { label: "Admin operators", value: totalAdmins, icon: UsersRound },
    { label: "Permission scopes", value: data.totalPermissionScopes, icon: Workflow },
  ];

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div className="flex flex-col gap-3">
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
          <ShieldCheck size={13} /> Phase 10
        </p>
        <div>
          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#040B37] md:text-[34px]">
            Permissions & Administration
          </h1>
          <p className="mt-1 max-w-4xl text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
            Control who can operate each part of the platform. Role upgrades happen here, but public instructor trust still goes through instructor verification.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-[clamp(16px,1.39vw,24px)] sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="flex min-h-[132px] flex-col gap-5 rounded-[12px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[clamp(13px,1vw,17px)] font-semibold leading-tight text-[#9CA3AF]">{card.label}</p>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F4F6FB] text-[#1C4ED1]">
                <card.icon size={20} />
              </div>
            </div>
            <p className="text-[clamp(20px,1.65vw,30px)] font-black leading-tight text-[#040B37]">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
          <div className="border-b border-[#E3E8F4] p-5">
            <h2 className="text-[18px] font-black text-[#040B37]">Permission presets</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
              Suggested operating roles. Use them as policy templates when assigning actual toggles.
            </p>
          </div>
          <div className="grid gap-3 p-5">
            {PRESETS.map((preset) => (
              <div key={preset.name} className="rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[14px] font-black text-[#040B37]">{preset.name}</h3>
                  <span className="rounded-full bg-[#1C4ED1]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
                    {preset.scope}
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-semibold leading-relaxed text-[#4B5563]">{preset.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preset.permissions.map((permission) => (
                    <span key={permission} className="rounded-full border border-[#E3E8F4] bg-white px-2.5 py-1 text-[11px] font-bold text-[#4B5563]">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
          <div className="border-b border-[#E3E8F4] p-5">
            <h2 className="text-[18px] font-black text-[#040B37]">Admin scope controls</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
              Super admins can tune each admin's scopes. Scoped admins can view the model but cannot grant themselves power.
            </p>
          </div>
          {data.admins.length > 0 ? (
            <div className="divide-y divide-[#F4F6FB]">
              {data.admins.map((admin) => (
                <div key={admin.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-black text-[#040B37]">{getDisplayName(admin)}</p>
                      <RoleBadge role={admin.role} />
                    </div>
                    <p className="mt-1 truncate text-[12px] font-semibold text-[#9CA3AF]">{admin.email}</p>
                    <p className="mt-2 text-[12px] font-bold text-[#4B5563]">
                      {admin.role === "SUPER_ADMIN"
                        ? "Implicit full platform access"
                        : `${admin.enabledPermissionCount}/${data.totalPermissionScopes} scopes enabled`}
                    </p>
                  </div>
                  {admin.role === "ADMIN" ? (
                    <AdminPermissionsDrawer userId={admin.id} userName={getDisplayName(admin)} permissions={admin.permissions} />
                  ) : (
                    <span className="rounded-full bg-purple-50 px-3 py-1.5 text-[11px] font-black text-purple-700">FULL ACCESS</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[13px] font-semibold text-[#9CA3AF]">No admin operators yet.</div>
          )}
        </div>
      </section>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5">
          <h2 className="text-[18px] font-black text-[#040B37]">Role administration</h2>
          <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
            Upgrade students to instructors, or grant admin roles where allowed. Instructor verification remains a separate trust workflow.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-left">
            <thead className="bg-[#F8FAFF] text-[11px] font-black uppercase tracking-[0.12em] text-[#9CA3AF]">
              <tr>
                <th className="px-5 py-4">Account</th>
                <th className="px-5 py-4">Current Role</th>
                <th className="px-5 py-4">Signals</th>
                <th className="px-5 py-4">Role Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F6FB]">
              {data.roleCandidates.map((user) => (
                <tr key={user.id} className="align-middle">
                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-[14px] font-black text-[#040B37]">{getDisplayName(user)}</p>
                    <p className="whitespace-nowrap text-[12px] font-semibold text-[#9CA3AF]">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-[12px] font-bold text-[#4B5563]">
                      {user._count.enrollments} enrolled courses · {user._count.taughtCourses} taught courses
                    </p>
                    <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-[#9CA3AF]">
                      Instructor profile: {user.instructorProfileEnabled ? user.instructorVerificationStatus ?? "enabled" : "not activated"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <UserRoleSelect userId={user.id} currentRole={user.role} currentUserRole={currentUserRole} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
