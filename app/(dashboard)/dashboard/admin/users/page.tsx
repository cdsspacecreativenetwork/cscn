import Image from "next/image";
import Link from "next/link";
import { Crown, GraduationCap, ShieldCheck, UserCheck, Users } from "lucide-react";

import { auth } from "@/auth";
import { getFeaturedInstructorAdminData } from "@/data/featured-instructors";
import { getAllUsers, getUserStats } from "@/data/user";
import { requireAdminPermission } from "@/lib/admin-guards";
import { UserRoleSelect } from "@/components/dashboard/admin/UserRoleSelect";
import { AdminPermissionsDrawer } from "@/components/dashboard/admin/AdminPermissionsDrawer";
import { Pagination } from "@/components/dashboard/admin/Pagination";
import { FeaturedInstructorStar } from "@/components/dashboard/admin/FeaturedInstructorStar";
import { FeaturedInstructorPicker } from "@/components/dashboard/admin/FeaturedInstructorPicker";
import { AdminUsersToolbar } from "@/components/dashboard/admin/AdminUsersToolbar";
import { InstructorVerificationActions } from "@/components/dashboard/admin/InstructorVerificationActions";

interface PageProps {
  searchParams: Promise<{ page?: string; tab?: string; q?: string; sort?: string }>;
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/dashboard/admin/users?${qs}` : "/dashboard/admin/users";
}

function instructorStats(user: any) {
  const courses = user.taughtCourses ?? [];
  const totalStudents = courses.reduce((sum: number, course: any) => sum + course._count.enrollments, 0);
  const ratings = courses.flatMap((course: any) => course.ratings.map((rating: any) => rating.rating));
  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length).toFixed(1)
    : "New";
  return { courses: courses.length, totalStudents, averageRating };
}

function verificationBadge(user: any) {
  if (!user.instructorProfileEnabled) return null;
  const status = user.instructorVerificationStatus as string;
  const styles: Record<string, string> = {
    VERIFIED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    REJECTED: "bg-red-50 text-red-700",
    NOT_STARTED: "bg-[#F4F6FB] text-[#9CA3AF]",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status] ?? styles.NOT_STARTED}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminPermission("canManageUsers");

  const { page: pageParam, tab: tabParam, q, sort: sortParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const tab = tabParam ?? "all";
  const sort = sortParam ?? (tab === "featured" ? "featured" : "newest");

  const [session, { users, total, totalPages }, stats, featuredData] = await Promise.all([
    auth(),
    getAllUsers({ page, tab, query: q, sort }),
    getUserStats(),
    getFeaturedInstructorAdminData(),
  ]);

  const currentUserRole = (session?.user?.role as string) ?? "ADMIN";
  const currentUserId = session?.user?.id;
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-[clamp(16px,2.78vw,48px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[24px] font-bold tracking-tight text-[#040B37] md:text-[32px]">
            User Management
          </h1>
          <p className="text-[14px] font-medium text-[#9CA3AF]">
            Search, analyze, verify, and curate platform users from one place.
          </p>
        </div>
        <Link
          href="/dashboard/admin/invites"
          className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-[#1C4ED1] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#163BB1]"
        >
          Invite Users
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-[#1C4ED1] bg-[#1C4ED1]/10" },
          { label: "Students", value: stats.students, icon: GraduationCap, color: "text-[#9CA3AF] bg-[#F4F6FB]" },
          { label: "Instructors", value: stats.instructors, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
          { label: "Admins", value: stats.admins, icon: ShieldCheck, color: "text-[#1C4ED1] bg-[#1C4ED1]/10" },
          { label: "Super Admins", value: stats.superAdmins, icon: Crown, color: "text-purple-600 bg-purple-50" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-[14px] border border-[#E3E8F4] bg-white p-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-[24px] font-bold leading-tight text-[#040B37]">{item.value}</p>
              <p className="text-[12px] font-medium text-[#9CA3AF]">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <AdminUsersToolbar total={total} tab={tab} query={q} sort={sort} />

      {tab === "featured" ? (
        <FeaturedInstructorPicker slots={featuredData.slots} suggestions={featuredData.suggestions} />
      ) : (
        <div className="rounded-[16px] border border-[#E3E8F4] bg-white shadow-sm mb-32">
          {users.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px] font-bold text-[#040B37]">No users found</p>
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Try a different search or filter.</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-[#F8FAFF]">
                    <tr className="border-b border-[#E3E8F4]">
                      <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">User</th>
                      <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Role</th>
                      <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Instructor stats</th>
                      <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Student stats</th>
                      <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Verification</th>
                      <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Featured</th>
                      {isSuperAdmin && (
                        <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Permissions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F6FB]">
                    {(users as any[]).map((user) => {
                      const stats = instructorStats(user);
                      const avatarSrc =
                        user.image ??
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name ?? "User")}&backgroundColor=1c4ed1&textColor=ffffff&fontSize=38&fontWeight=600`;
                      const isInstructor = user.instructorProfileEnabled;
                      const isAdmin = user.role === "ADMIN";
                      const isSelf = user.id === currentUserId;

                      return (
                        <tr key={user.id} className="transition hover:bg-[#F8FAFF]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[12px] border border-[#E3E8F4] bg-[#F4F6FB]">
                                <Image src={avatarSrc} alt={user.name ?? "User"} fill className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="whitespace-nowrap text-[14px] font-bold text-[#040B37]">{user.name ?? "No name yet"}</p>
                                <p className="whitespace-nowrap text-[12px] font-medium text-[#9CA3AF]">{user.email}</p>
                                {user.headline && <p className="mt-0.5 whitespace-nowrap text-[12px] font-medium text-[#4B5563]">{user.headline}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <UserRoleSelect
                              userId={user.id}
                              currentRole={user.role}
                              currentUserRole={currentUserRole}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="whitespace-nowrap text-[13px] font-semibold text-[#4B5563]">
                              {stats.courses} published courses <span className="text-[#9CA3AF]">| {stats.totalStudents} students | {stats.averageRating} rating</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="whitespace-nowrap text-[13px] font-semibold text-[#4B5563]">{user._count?.enrollments ?? 0} enrolled courses</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                              {verificationBadge(user)}
                              <InstructorVerificationActions
                                userId={user.id}
                                status={user.instructorVerificationStatus}
                                disabled={isSelf}
                              />
                              {isInstructor && user.mentorshipEnabled && (
                                <span className="rounded-full bg-[#1C4ED1]/10 px-2.5 py-1 text-[11px] font-bold text-[#1C4ED1]">
                                  Mentorship
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FeaturedInstructorStar
                                userId={user.id}
                                featured={!!user.instructorFeatured}
                                disabled={!isInstructor}
                              />
                              {user.instructorFeaturedOrder && (
                                <span className="text-[12px] font-bold text-[#9CA3AF]">Slot {user.instructorFeaturedOrder}</span>
                              )}
                            </div>
                          </td>
                          {isSuperAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isAdmin ? (
                                <AdminPermissionsDrawer
                                  userId={user.id}
                                  userName={user.name ?? user.email}
                                  permissions={{
                                    canManageUsers: user.canManageUsers ?? false,
                                    canManageCourses: user.canManageCourses ?? false,
                                    canReviewCourses: user.canReviewCourses ?? false,
                                    canPublishCourses: user.canPublishCourses ?? false,
                                    canManageLearners: user.canManageLearners ?? false,
                                    canManageInstructors: user.canManageInstructors ?? false,
                                    canVerifyInstructors: user.canVerifyInstructors ?? false,
                                    canManageInvites: user.canManageInvites ?? false,
                                    canManageAnnouncements: user.canManageAnnouncements ?? false,
                                    canManageBilling: user.canManageBilling ?? false,
                                    canManageMarketing: user.canManageMarketing ?? false,
                                    canManagePermissions: user.canManagePermissions ?? false,
                                    canViewAuditLogs: user.canViewAuditLogs ?? false,
                                    canManageSettings: user.canManageSettings ?? false,
                                    canViewAnalytics: user.canViewAnalytics ?? false,
                                  }}
                                />
                              ) : (
                                <span className="text-[13px] text-[#D1D5DB]">No admin access</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                baseUrl={buildQuery({ tab: tab === "all" ? undefined : tab, q, sort })}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
