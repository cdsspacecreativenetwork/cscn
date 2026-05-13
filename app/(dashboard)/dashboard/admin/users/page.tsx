import Image from "next/image";
import Link from "next/link";
import { Users, GraduationCap, ShieldCheck, UserCheck, Crown } from "lucide-react";

import { auth } from "@/auth";
import { getAllUsers, getUserStats } from "@/data/user";
import { RoleBadge } from "@/components/dashboard/admin/RoleBadge";
import { UserRoleSelect } from "@/components/dashboard/admin/UserRoleSelect";
import { AdminPermissionsDrawer } from "@/components/dashboard/admin/AdminPermissionsDrawer";
import { Pagination } from "@/components/dashboard/admin/Pagination";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [session, { users, total, totalPages }, stats] = await Promise.all([
    auth(),
    getAllUsers(page),
    getUserStats(),
  ]);

  const currentUserRole = (session?.user?.role as string) ?? "ADMIN";
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[24px] md:text-[32px] font-bold text-[#040B37] tracking-tight">
            User Management
          </h1>
          <p className="text-[14px] text-[#9CA3AF] font-medium">
            View and manage roles for all registered accounts
          </p>
        </div>
        <Link
          href="/dashboard/admin/invites"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C4ED1] hover:bg-[#163BB1] text-white rounded-[10px] text-[14px] font-semibold transition-all shrink-0"
        >
          Invite Users
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-[#1C4ED1] bg-[#1C4ED1]/10" },
          { label: "Students", value: stats.students, icon: GraduationCap, color: "text-[#9CA3AF] bg-[#F4F6FB]" },
          { label: "Instructors", value: stats.instructors, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
          { label: "Admins", value: stats.admins, icon: ShieldCheck, color: "text-[#1C4ED1] bg-[#1C4ED1]/10" },
          { label: "Super Admins", value: stats.superAdmins, icon: Crown, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#E3E8F4] rounded-[12px] p-5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-[24px] font-bold text-[#040B37] leading-tight">{s.value}</p>
              <p className="text-[12px] text-[#9CA3AF] font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E3E8F4] rounded-[12px] flex flex-col" style={{ minHeight: "calc(100vh - 380px)" }}>
        {/* Table toolbar */}
        <div className="px-6 py-4 border-b border-[#E3E8F4] flex items-center justify-between shrink-0">
          <h2 className="text-[16px] font-semibold text-[#040B37]">All Accounts</h2>
          <span className="text-[13px] text-[#9CA3AF] font-medium">{total} total</span>
        </div>

        {users.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-[15px] text-[#9CA3AF] font-medium">No users yet.</p>
          </div>
        ) : (
          <>
            {/* Scrollable table body */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-[#F4F6FB]">
                    <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Role</th>
                    {isSuperAdmin && (
                      <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Permissions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F6FB]">
                  {(users as any[]).map((user) => {
                    const avatarSrc =
                      user.image ??
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name ?? "User")}&backgroundColor=1c4ed1&textColor=ffffff&fontSize=38&fontWeight=600`;
                    const isAdmin = (user.role as string) === "ADMIN";

                    return (
                      <tr key={user.id} className="hover:bg-[#F4F6FB]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#E3E8F4] shrink-0">
                              <Image
                                src={avatarSrc}
                                alt={user.name ?? "User"}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-[#040B37]">{user.name ?? "—"}</p>
                              <p className="text-[12px] text-[#9CA3AF] md:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-[14px] text-[#4B5563]">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-[13px] text-[#9CA3AF]">
                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <UserRoleSelect
                            userId={user.id}
                            currentRole={user.role}
                            currentUserRole={currentUserRole}
                          />
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4">
                            {isAdmin ? (
                              <AdminPermissionsDrawer
                                userId={user.id}
                                userName={user.name ?? user.email}
                                permissions={{
                                  canManageUsers: user.canManageUsers ?? false,
                                  canManageCourses: user.canManageCourses ?? false,
                                  canManageBilling: user.canManageBilling ?? false,
                                  canViewAnalytics: user.canViewAnalytics ?? false,
                                }}
                              />
                            ) : (
                              <span className="text-[13px] text-[#D1D5DB]">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              baseUrl="/dashboard/admin/users"
            />
          </>
        )}
      </div>
    </div>
  );
}
