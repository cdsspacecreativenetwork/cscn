import Image from "next/image";
import Link from "next/link";
import { Award, BookOpenCheck, Clock3, Flame, GraduationCap, Users } from "lucide-react";

import { getAdminLearners, getAdminLearnerStats } from "@/data/admin-learners";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { generateTapbackAvatar } from "@/lib/avatar";
import { Pagination } from "@/components/dashboard/admin/Pagination";
import { AdminDirectoryFilters } from "@/components/dashboard/admin/AdminDirectoryFilters";

export const metadata = { title: "Students | CSCN Admin" };

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; status?: string }>;
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/dashboard/admin/students?${qs}` : "/dashboard/admin/students";
}

function formatDate(date?: Date | null) {
  if (!date) return "No activity yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function AdminStudentsPage({ searchParams }: PageProps) {
  const session = await requireAnyAdminPermission(["canManageLearners", "canManageUsers"]);
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = params.sort ?? "newest";
  const status = params.status ?? "all";
  const query = params.q?.trim();
  const canViewAnalytics = hasAdminPermission(session.user, "canViewAnalytics");

  const [{ learners: students, total, totalPages }, stats] = await Promise.all([
    getAdminLearners({ page, query, sort, status }),
    getAdminLearnerStats(),
  ]);

  const statCards = [
    { label: "Total students", value: stats.totalLearners, icon: Users },
    { label: "Enrolled students", value: stats.enrolledLearners, icon: GraduationCap },
    { label: "Active enrollments", value: stats.activeEnrollments, icon: BookOpenCheck },
    { label: "Certificate-ready", value: stats.certificateReady, icon: Award },
  ];
  const tabs = [
    { value: "all", label: "All students" },
    { value: "active", label: "Active enrollments" },
    { value: "completed", label: "Completed courses" },
    { value: "not-started", label: "Not enrolled" },
  ];

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div>
        <h1 className="text-[26px] font-black leading-tight tracking-[-0.04em] text-[#040B37]">Students</h1>
        <p className="mt-1 max-w-2xl text-[14px] font-medium text-[#9CA3AF]">
          Monitor learning activity, enrollments, completion progress, certificates, and student momentum.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-[clamp(16px,1.39vw,24px)] sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex min-h-[140px] flex-col items-start gap-[clamp(16px,1.62vw,28px)] rounded-[12px] border border-[#E3E8F4] bg-white p-[clamp(12px,1.39vw,24px)] shadow-[0px_0px_1px_rgba(23,26,31,0.08),0px_0px_0.5px_rgba(23,26,31,0.05)]"
          >
            <div className="flex w-full items-start justify-between gap-2">
              <p className="flex-1 text-[clamp(13px,1.04vw,18px)] font-medium leading-tight text-[#9CA3AF]">{card.label}</p>
              <div className="flex h-[clamp(32px,2.31vw,40px)] w-[clamp(32px,2.31vw,40px)] shrink-0 items-center justify-center rounded-[10px] bg-[#F4F6FB] text-[#1C4ED1]">
                <card.icon size={20} />
              </div>
            </div>
            <p className="mt-auto text-[clamp(24px,1.85vw,32px)] font-bold leading-none text-[#040B37]">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Student Directory</h2>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">{total.toLocaleString()} students match this view.</p>
          </div>
          <div className="mb-4 admin-horizontal-scrollbar flex w-fit max-w-full items-center gap-[4px] overflow-x-auto rounded-[12px] bg-[#E3E8F4] p-[4px]">
            {tabs.map((item) => {
              const isActive = status === item.value;
              return (
                <Link
                  key={item.value}
                  href={buildQuery({ status: item.value === "all" ? undefined : item.value, q: query, sort })}
                  className={`shrink-0 rounded-[8px] px-[16px] py-[10px] text-[14px] font-bold tracking-[-0.28px] transition-all ${
                    isActive
                      ? "bg-[#1C4ED1] text-white shadow-[0px_4px_10px_rgba(28,78,209,0.18)]"
                      : "text-[#9CA3AF] hover:bg-white hover:text-[#040B37]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <AdminDirectoryFilters
            basePath="/dashboard/admin/students"
            query={query}
            sort={sort}
            status={status}
            searchPlaceholder="Search name, email, headline"
            sortOptions={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "name", label: "Name A-Z" },
              { value: "last-active", label: "Last active" },
            ]}
          />
        </div>

        {students.length > 0 ? (
          <>
            <div className="admin-horizontal-scrollbar overflow-auto">
              <table className="w-full min-w-[1120px]">
                <thead className="bg-[#F8FAFF]">
                  <tr className="border-b border-[#E3E8F4]">
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Student</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Learning</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Progress</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Momentum</th>
                    {canViewAnalytics && (
                      <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Analytics</th>
                    )}
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F6FB]">
                  {students.map((student) => {
                    const avatar = student.image ?? generateTapbackAvatar(student.name ?? student.email ?? student.id);
                    return (
                      <tr key={student.id} className="transition hover:bg-[#F8FAFF]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px] border border-[#E3E8F4] bg-[#F4F6FB]">
                              <Image src={avatar} alt={student.name ?? "Student"} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="whitespace-nowrap text-[14px] font-black text-[#040B37]">{student.name ?? "No name yet"}</p>
                              <p className="whitespace-nowrap text-[12px] font-semibold text-[#9CA3AF]">{student.email}</p>
                              {student.headline && (
                                <p className="mt-0.5 whitespace-nowrap text-[12px] font-medium text-[#4B5563]">{student.headline}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-black text-[#4B5563]">{student.enrollments} enrolled courses</p>
                          <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                            {student.activeEnrollments} active | {student.completedEnrollments} completed
                          </p>
                          {student.recentCourse && (
                            <Link href={`/courses/${student.recentCourse.slug}`} className="mt-1 block text-[12px] font-bold text-[#1C4ED1] hover:underline">
                              {student.recentCourse.title}
                            </Link>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-[180px]">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[12px] font-bold text-[#4B5563]">{student.progressPercent}% complete</span>
                              <span className="text-[11px] font-bold text-[#9CA3AF]">{student.certificateReady} cert-ready</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#F4F6FB]">
                              <div className="h-full rounded-full bg-[#1C4ED1]" style={{ width: `${student.progressPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#4B5563]">
                              <Flame size={15} className="text-[#1C4ED1]" /> {student.currentStreak}d
                            </span>
                            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#4B5563]">
                              <Award size={15} className="text-[#1C4ED1]" /> {student.achievements}
                            </span>
                          </div>
                        </td>
                        {canViewAnalytics && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#4B5563]">
                              <Clock3 size={15} className="text-[#1C4ED1]" /> {student.hoursWatched}h watched
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-bold text-[#4B5563]">{formatDate(student.lastActivity)}</p>
                          <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">Joined {formatDate(student.createdAt)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              baseUrl={buildQuery({ q: query, sort, status: status === "all" ? undefined : status })}
            />
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-[15px] font-bold text-[#040B37]">No students found</p>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Try a different search or filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}
