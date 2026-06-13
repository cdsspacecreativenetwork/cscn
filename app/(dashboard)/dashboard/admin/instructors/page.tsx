import Image from "next/image";
import Link from "next/link";
import { Award, BadgeCheck, GraduationCap, UserCheck } from "lucide-react";

import { getAdminInstructors, getAdminInstructorStats } from "@/data/admin-instructors";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { generateTapbackAvatar } from "@/lib/avatar";
import { Pagination } from "@/components/dashboard/admin/Pagination";
import { InstructorVerificationActions } from "@/components/dashboard/admin/InstructorVerificationActions";
import { FeaturedInstructorStar } from "@/components/dashboard/admin/FeaturedInstructorStar";
import { InstructorMentorshipToggle } from "@/components/dashboard/admin/InstructorMentorshipToggle";
import { AdminDirectoryFilters } from "@/components/dashboard/admin/AdminDirectoryFilters";

export const metadata = { title: "Instructors | CSCN Admin" };

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; tab?: string }>;
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/dashboard/admin/instructors?${qs}` : "/dashboard/admin/instructors";
}

function statusClass(status: string) {
  if (status === "VERIFIED") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "bg-amber-50 text-amber-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  return "bg-[#F4F6FB] text-[#9CA3AF]";
}

export default async function AdminInstructorsPage({ searchParams }: PageProps) {
  const session = await requireAnyAdminPermission(["canManageInstructors", "canVerifyInstructors"]);
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = params.sort ?? "newest";
  const tab = params.tab ?? "all";
  const query = params.q?.trim();
  const canManageInstructors = hasAdminPermission(session.user, "canManageInstructors");
  const canVerifyInstructors = hasAdminPermission(session.user, "canVerifyInstructors");
  const canManageMarketing = hasAdminPermission(session.user, "canManageMarketing");

  const [{ instructors, total, totalPages }, stats] = await Promise.all([
    getAdminInstructors({ page, query, sort, tab }),
    getAdminInstructorStats(),
  ]);

  const statCards = [
    { label: "Instructor profiles", value: stats.total, icon: UserCheck },
    { label: "Pending verification", value: stats.pending, icon: BadgeCheck },
    { label: "Verified", value: stats.verified, icon: Award },
    { label: "Mentorship eligible", value: stats.mentorship, icon: GraduationCap },
  ];

  const tabs = [
    ["all", "All"],
    ["pending", "Pending"],
    ["verified", "Verified"],
    ["needs-completion", "Needs completion"],
    ["mentorship", "Mentorship"],
    ["featured", "Featured"],
    ["rejected", "Rejected"],
  ];

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div>
        <h1 className="text-[26px] font-black leading-tight tracking-[-0.04em] text-[#040B37]">Instructors</h1>
        <p className="mt-1 max-w-2xl text-[14px] font-medium text-[#9CA3AF]">
          Govern instructor readiness, verification, mentorship visibility, featured status, and teaching quality.
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
                <card.icon size={21} />
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Instructor Directory</h2>
                <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">{total.toLocaleString()} instructors match this view.</p>
              </div>

              <AdminDirectoryFilters
                basePath="/dashboard/admin/instructors"
                query={query}
                sort={sort}
                tab={tab}
                searchPlaceholder="Search name, email, headline"
                sortOptions={[
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                  { value: "name", label: "Name A-Z" },
                  { value: "featured", label: "Featured order" },
                ]}
              />
            </div>

            <div className="admin-horizontal-scrollbar flex w-fit max-w-full items-center gap-[4px] overflow-x-auto rounded-[12px] bg-[#E3E8F4] p-[4px]">
              {tabs.map(([value, label]) => (
                <Link
                  key={value}
                  href={buildQuery({ tab: value === "all" ? undefined : value, q: query, sort })}
                  className={`shrink-0 rounded-[8px] px-[16px] py-[10px] text-[14px] font-bold tracking-[-0.28px] transition-all ${
                    tab === value || (tab === "all" && value === "all")
                      ? "bg-[#1C4ED1] text-white shadow-[0px_4px_10px_rgba(28,78,209,0.18)]"
                      : "text-[#9CA3AF] hover:bg-white hover:text-[#040B37]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {instructors.length > 0 ? (
          <>
            <div className="admin-horizontal-scrollbar overflow-auto">
              <table className="w-full min-w-[1220px]">
                <thead className="bg-[#F8FAFF]">
                  <tr className="border-b border-[#E3E8F4]">
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Instructor</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Readiness</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Teaching</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Trust</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Mentorship</th>
                    <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Featured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F6FB]">
                  {instructors.map((instructor) => {
                    const avatar = instructor.image ?? generateTapbackAvatar(instructor.name ?? instructor.email ?? instructor.id);
                    return (
                      <tr key={instructor.id} className="transition hover:bg-[#F8FAFF]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px] border border-[#E3E8F4] bg-[#F4F6FB]">
                              <Image src={avatar} alt={instructor.name ?? "Instructor"} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="whitespace-nowrap text-[14px] font-black text-[#040B37]">{instructor.name ?? "No name yet"}</p>
                              <p className="whitespace-nowrap text-[12px] font-semibold text-[#9CA3AF]">{instructor.email}</p>
                              {instructor.headline && (
                                <p className="mt-0.5 whitespace-nowrap text-[12px] font-medium text-[#4B5563]">{instructor.headline}</p>
                              )}
                              {instructor.publicProfileUrl && (
                                <Link href={instructor.publicProfileUrl} target="_blank" className="mt-1 inline-block text-[12px] font-bold text-[#1C4ED1] hover:underline">
                                  View public profile
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className={`text-[13px] font-black ${instructor.profileComplete ? "text-emerald-700" : "text-amber-700"}`}>
                            {instructor.profileComplete ? "Complete" : `${instructor.missingLabels.length} missing`}
                          </p>
                          {!instructor.profileComplete && (
                            <p className="mt-1 max-w-[260px] whitespace-normal text-[12px] font-semibold leading-relaxed text-[#9CA3AF]">
                              {instructor.missingLabels.slice(0, 3).join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-black text-[#4B5563]">{instructor.publishedCourses} published courses</p>
                          <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                            {instructor.students} students | {instructor.averageRating ? instructor.averageRating.toFixed(1) : "New"} rating
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClass(instructor.verificationStatus)}`}>
                              {instructor.verificationStatus.replace("_", " ")}
                            </span>
                            {canVerifyInstructors && (
                              <InstructorVerificationActions
                                userId={instructor.id}
                                status={instructor.verificationStatus}
                                disabled={instructor.id === session.user.id}
                              />
                            )}
                          </div>
                          <p className={`mt-2 text-[11px] font-bold ${instructor.payoutReady ? "text-emerald-700" : "text-[#9CA3AF]"}`}>
                            {instructor.payoutReady ? "Payout ready" : "Payout incomplete"}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <InstructorMentorshipToggle
                              instructorId={instructor.id}
                              enabled={instructor.mentorshipEligible}
                              disabled={!canManageInstructors || instructor.verificationStatus !== "VERIFIED"}
                            />
                            <span className="text-[12px] font-bold text-[#4B5563]">
                              {instructor.mentorshipEligible
                                ? instructor.mentorshipEnabled
                                  ? "Open"
                                  : "Eligible"
                                : "Not eligible"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FeaturedInstructorStar
                              userId={instructor.id}
                              featured={instructor.featured}
                              disabled={!canManageMarketing || !instructor.featureEligible}
                            />
                            {instructor.featuredOrder && (
                              <span className="text-[12px] font-bold text-[#9CA3AF]">Slot {instructor.featuredOrder}</span>
                            )}
                            {!instructor.featureEligible && (
                              <span className="text-[12px] font-bold text-[#D1D5DB]">Not eligible</span>
                            )}
                          </div>
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
              baseUrl={buildQuery({ tab: tab === "all" ? undefined : tab, q: query, sort })}
            />
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-[15px] font-bold text-[#040B37]">No instructors found</p>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Try a different search or filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}
