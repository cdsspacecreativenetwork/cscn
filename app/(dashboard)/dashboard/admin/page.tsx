import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";

import { getAdminDashboardData } from "@/data/admin-dashboard";
import { requireAdmin } from "@/lib/admin-guards";
import { hasAnyAdminPermission } from "@/lib/admin-permissions";

export const metadata = { title: "Command Center | CSCN Admin" };

const toneStyles = {
  blue: "bg-[#1C4ED1]/10 text-[#1C4ED1]",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-[#F4F6FB] text-[#4B5563]",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function AdminPage() {
  const session = await requireAdmin();
  const data = await getAdminDashboardData();
  const user = session.user;

  const visibleQueue = data.reviewQueue.filter((item) => hasAnyAdminPermission(user, item.permissions));
  const visibleSignals = data.platformSignals.filter((item) => hasAnyAdminPermission(user, item.permissions));
  const canSeeCourseQuality = hasAnyAdminPermission(user, ["canManageCourses", "canReviewCourses", "canPublishCourses"]);
  const visibleActivity = data.recentActivity.filter((item) => hasAnyAdminPermission(user, item.permissions));

  const statCards = [
    {
      label: "Users",
      value: data.summary.totalUsers,
      helper: `+${formatNumber(data.summary.newUsers30d)} in 30 days`,
      icon: Users,
      permissions: ["canManageUsers", "canManageLearners", "canManageInstructors"] as const,
    },
    {
      label: "Published courses",
      value: data.summary.publishedCourses,
      helper: `${formatNumber(data.summary.pendingCourseReviews)} awaiting review`,
      icon: Layers,
      permissions: ["canManageCourses", "canReviewCourses", "canPublishCourses"] as const,
    },
    {
      label: "Active enrollments",
      value: data.summary.activeEnrollments,
      helper: `${data.summary.completionRate}% completion rate`,
      icon: BarChart3,
      permissions: ["canManageLearners", "canViewAnalytics"] as const,
    },
  ].filter((item) => hasAnyAdminPermission(user, [...item.permissions]));

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <section className="flex flex-col gap-4 rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#1C4ED1] text-white shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-black leading-tight tracking-[-0.04em] text-[#040B37]">
                Command Center
              </h1>
              <span className="rounded-full bg-[#F4F6FB] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#4B5563]">
                {user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
              </span>
            </div>
            <p className="mt-1 text-[14px] font-medium text-[#9CA3AF]">
              Your operational queue, platform signals, and attention items based on your admin permissions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {hasAnyAdminPermission(user, ["canManageCourses", "canReviewCourses", "canPublishCourses"]) && (
            <Link
              href="/dashboard/admin/courses"
              className="inline-flex items-center justify-center rounded-[10px] bg-[#1C4ED1] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#163fa3]"
            >
              Course operations
            </Link>
          )}
          {hasAnyAdminPermission(user, ["canManageLearners", "canManageInstructors", "canManageUsers"]) && (
            <Link
              href="/dashboard/admin/users"
              className="inline-flex items-center justify-center rounded-[10px] border border-[#E3E8F4] bg-white px-4 py-2.5 text-[13px] font-bold text-[#040B37] transition hover:border-[#1C4ED1]/40"
            >
              Account directory
            </Link>
          )}
        </div>
      </section>

      {statCards.length > 0 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-[16px] border border-[#E3E8F4] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-bold text-[#9CA3AF]">{card.label}</p>
                  <p className="mt-3 text-[30px] font-black leading-none tracking-[-0.04em] text-[#040B37]">
                    {formatNumber(card.value)}
                  </p>
                  <p className="mt-2 text-[12px] font-semibold text-[#4B5563]">{card.helper}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#1C4ED1]/10 text-[#1C4ED1]">
                  <card.icon size={21} />
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Today&apos;s Control Queue</h2>
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
                Only the operational decisions you have permission to act on.
              </p>
            </div>
            <ClipboardCheck className="text-[#1C4ED1]" size={24} />
          </div>

          {visibleQueue.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleQueue.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-5 transition hover:-translate-y-0.5 hover:border-[#1C4ED1]/40 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${toneStyles[item.tone]}`}>
                      {item.label}
                    </span>
                    <ArrowRight size={16} className="text-[#9CA3AF] transition group-hover:translate-x-1 group-hover:text-[#1C4ED1]" />
                  </div>
                  <p className="mt-5 text-[34px] font-black leading-none text-[#040B37]">{formatNumber(item.value)}</p>
                  <p className="mt-2 text-[13px] font-semibold text-[#4B5563]">Open operational items</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] bg-[#F8FAFF] p-5 text-[14px] font-bold text-[#4B5563]">
              No assigned control-queue items for your current permissions.
            </div>
          )}
        </div>

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Platform Signals</h2>
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">A scoped health read for your area.</p>
            </div>
            <BarChart3 className="text-[#1C4ED1]" size={24} />
          </div>

          <div className="space-y-3">
            {visibleSignals.slice(0, 7).map((signal) => (
              <div key={signal.label} className="flex items-center justify-between rounded-[12px] bg-[#F8FAFF] px-4 py-3">
                <span className="text-[13px] font-bold text-[#4B5563]">{signal.label}</span>
                <span className="text-[16px] font-black text-[#040B37]">
                  {signal.label === "Completion rate" ? `${signal.value}%` : formatNumber(signal.value)}
                </span>
              </div>
            ))}
            {visibleSignals.length === 0 && (
              <div className="rounded-[14px] bg-[#F8FAFF] p-5 text-[14px] font-bold text-[#4B5563]">
                No platform signals are assigned to this admin yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {canSeeCourseQuality && (
          <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Course Quality Watchlist</h2>
                <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
                  Published, pending, or pricing-related courses with admin attention items.
                </p>
              </div>
              <AlertTriangle className="text-amber-600" size={24} />
            </div>

            {data.courseQualityIssues.length > 0 ? (
              <div className="divide-y divide-[#EEF2FA]">
                {data.courseQualityIssues.map((course) => (
                  <Link key={course.id} href={`/dashboard/admin/courses/${course.id}`} className="block py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-[14px] font-black text-[#040B37]">{course.title}</p>
                        <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{course.instructorName}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {course.issues.slice(0, 3).map((issue) => (
                            <span key={issue} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F4F6FB] px-2.5 py-1 text-[11px] font-black text-[#4B5563]">
                        {course.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[14px] bg-emerald-50 p-5 text-[14px] font-bold text-emerald-700">
                No course quality issues in your current scope.
              </div>
            )}
          </div>
        )}

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Recent Platform Activity</h2>
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Recent changes filtered to your permission scope.</p>
            </div>
          </div>

          {visibleActivity.length > 0 ? (
            <div className="divide-y divide-[#EEF2FA]">
              {visibleActivity.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[14px] font-black text-[#040B37]">{item.title}</p>
                    <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-[#9CA3AF]">{item.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="rounded-full bg-[#F4F6FB] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#4B5563]">
                      {item.badge}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{relativeTime(item.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] bg-[#F8FAFF] p-5 text-[14px] font-bold text-[#4B5563]">
              No recent activity in your current permission scope.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
