"use client";

import Link from "next/link";
import { BarChart2, Download, GraduationCap, Sparkles, Target } from "lucide-react";
import Button from "@/components/ui/Button";

interface BreakdownItem {
  label: string;
  count: number;
}

interface Submission {
  id: string;
  name: string | null;
  email: string;
  onboardingCohort: string | null;
  interestAreas: string[];
  skillLevel: string;
  primaryGoal: string;
  learningStyle: string[];
  note: string | null;
  updatedAt: string | Date;
}

interface Insights {
  total: number;
  pioneerProfiles: number;
  topInterestAreas: BreakdownItem[];
  skillLevels: BreakdownItem[];
  primaryGoals: BreakdownItem[];
  learningStyles: BreakdownItem[];
  recentSubmissions: Submission[];
}

function BreakdownList({ title, items }: { title: string; items: BreakdownItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5">
      <h2 className="text-[17px] font-black text-[#040B37]">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? items.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-[#4B5563]">{item.label}</span>
              <span className="text-[12px] font-black text-[#1C4ED1]">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#F4F6FB]">
              <div className="h-full rounded-full bg-[#1C4ED1]" style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
            </div>
          </div>
        )) : (
          <p className="text-[13px] font-medium text-[#9CA3AF]">No data yet.</p>
        )}
      </div>
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminLearnerInsightsConsole({ insights }: { insights: Insights }) {
  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#040B37] md:text-[34px]">Learner Insights</h1>
          <p className="mt-1 max-w-2xl text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
            See what early learners want to study, their current level, and their preferred learning format.
          </p>
        </div>
        <Link
          href="/api/admin/learner-insights/export"
        >
          <Button
            type="submit"
            variant="primary"
            rounded="md"
            leftIcon={<Download size={18} />}
            className="w-full"
          >
            Export CSV
          </Button>
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Submitted profiles", value: insights.total, icon: GraduationCap },
          { label: "Pioneer profiles", value: insights.pioneerProfiles, icon: Sparkles },
          { label: "Top goals tracked", value: insights.primaryGoals.length, icon: Target },
        ].map((item) => (
          <div key={item.label} className="flex min-h-[132px] flex-col gap-6 rounded-[12px] border border-[#E3E8F4] bg-white p-6">
            <div className="flex items-start justify-between">
              <p className="text-[16px] font-semibold text-[#9CA3AF]">{item.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F4F6FB] text-[#1C4ED1]">
                <item.icon size={20} />
              </div>
            </div>
            <p className="text-[34px] font-black leading-none text-[#040B37]">{item.value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <BreakdownList title="Top interest areas" items={insights.topInterestAreas} />
        <BreakdownList title="Primary goals" items={insights.primaryGoals} />
        <BreakdownList title="Skill levels" items={insights.skillLevels} />
        <BreakdownList title="Learning styles" items={insights.learningStyles} />
      </section>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5 sm:p-6">
          <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Recent submissions</h2>
          <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Latest learner profiles submitted from the dashboard.</p>
        </div>
        {insights.recentSubmissions.length > 0 ? (
          <div className="admin-horizontal-scrollbar overflow-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="bg-[#F8FAFF]">
                <tr className="border-b border-[#E3E8F4]">
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Learner</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Interests</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Goal</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Style</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Note</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F6FB]">
                {insights.recentSubmissions.map((submission) => (
                  <tr key={submission.id} className="transition hover:bg-[#F8FAFF]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[14px] font-black text-[#040B37]">{submission.name ?? "No name yet"}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{submission.email}</p>
                      {submission.onboardingCohort && <p className="mt-1 text-[11px] font-black text-[#1C4ED1]">{submission.onboardingCohort}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[240px] text-[13px] font-bold text-[#4B5563]">{submission.interestAreas.join(", ")}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[13px] font-bold text-[#4B5563]">{submission.primaryGoal}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{submission.skillLevel}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[220px] text-[13px] font-bold text-[#4B5563]">{submission.learningStyle.join(", ")}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 max-w-[280px] text-[12px] font-medium text-[#9CA3AF]">{submission.note || "No note"}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[13px] font-bold text-[#4B5563]">{formatDate(submission.updatedAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center">
            <p className="text-[15px] font-bold text-[#040B37]">No learner profiles yet</p>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Students will appear here after they complete the dashboard interest form.</p>
          </div>
        )}
      </section>
    </div>
  );
}
