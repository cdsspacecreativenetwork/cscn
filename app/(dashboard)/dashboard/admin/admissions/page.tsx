import Link from "next/link";
import { ClipboardCheck, ExternalLink, Search } from "lucide-react";

import { CohortApplicationReviewPanel } from "@/components/dashboard/admin/CohortApplicationReviewPanel";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { readApplicationAnswers } from "@/lib/cohort-application";
import { db } from "@/lib/db";

export const metadata = { title: "Cohort admissions | CSCN Admin" };

type Props = {
  searchParams: Promise<{ status?: string; cohort?: string; application?: string; query?: string }>;
};

const visibleStatuses = ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "WAITLISTED", "DECLINED"] as const;

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export default async function CohortAdmissionsPage({ searchParams }: Props) {
  await requireAnyAdminPermission(["canManageLearners", "canManageUsers"]);
  const params = await searchParams;
  const status = visibleStatuses.includes(params.status as (typeof visibleStatuses)[number]) ? params.status : undefined;

  const [cohorts, applications, counts] = await Promise.all([
    db.cohort.findMany({
      where: { applications: { some: { status: { in: [...visibleStatuses] } } } },
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, program: { select: { title: true } } },
    }),
    db.cohortApplication.findMany({
      where: {
        status: status ? status as (typeof visibleStatuses)[number] : { in: [...visibleStatuses] },
        cohortId: params.cohort || undefined,
        OR: params.query ? [
          { user: { name: { contains: params.query, mode: "insensitive" } } },
          { user: { email: { contains: params.query, mode: "insensitive" } } },
          { cohort: { title: { contains: params.query, mode: "insensitive" } } },
        ] : undefined,
      },
      orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
      take: 100,
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        reviewNote: true,
        offerExpiresAt: true,
        background: true,
        goals: true,
        prerequisites: true,
        portfolioUrl: true,
        answers: true,
        user: { select: { id: true, name: true, email: true, location: true } },
        reviewedBy: { select: { name: true, email: true } },
        cohort: { select: { id: true, title: true, slug: true, startsAt: true, price: true, currency: true, program: { select: { title: true } } } },
        purchaseOrder: { select: { status: true, paidAt: true } },
      },
    }),
    db.cohortApplication.groupBy({
      by: ["status"],
      where: { status: { in: [...visibleStatuses] } },
      _count: { status: true },
    }),
  ]);
  const selected = applications.find((item) => item.id === params.application) ?? applications[0] ?? null;
  const answers = selected ? readApplicationAnswers(selected.answers) : null;

  return (
    <main className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <section className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1C4ED1] text-white"><ClipboardCheck size={22} /></div>
          <div><h1 className="text-[26px] font-black tracking-[-0.04em] text-[#040B37]">Cohort admissions</h1><p className="mt-1 text-sm font-medium text-[#77839A]">Review submitted applications, record decisions, and monitor offer payment without exposing unnecessary learner data.</p></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {visibleStatuses.map((item) => <div key={item} className="rounded-xl bg-[#F8FAFF] p-3"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#77839A]">{formatStatus(item)}</p><p className="mt-1 text-2xl font-black text-[#040B37]">{counts.find((row) => row.status === item)?._count.status ?? 0}</p></div>)}
        </div>
      </section>

      <form className="grid gap-3 rounded-[16px] border border-[#E3E8F4] bg-white p-4 md:grid-cols-[1fr_220px_190px_auto]">
        <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" /><input name="query" defaultValue={params.query} placeholder="Search applicant or cohort" className="h-10 w-full rounded-[9px] border border-[#DCE3F0] pl-10 pr-3 text-sm outline-none focus:border-[#1C4ED1]" /></label>
        <select name="cohort" defaultValue={params.cohort ?? ""} className="h-10 rounded-[9px] border border-[#DCE3F0] px-3 text-sm"><option value="">All cohorts</option>{cohorts.map((item) => <option key={item.id} value={item.id}>{item.program.title} — {item.title}</option>)}</select>
        <select name="status" defaultValue={status ?? ""} className="h-10 rounded-[9px] border border-[#DCE3F0] px-3 text-sm"><option value="">All statuses</option>{visibleStatuses.map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}</select>
        <button className="h-10 rounded-[9px] bg-[#040B37] px-5 text-sm font-bold text-white">Apply filters</button>
      </form>

      <section className="grid min-h-[620px] gap-5 xl:grid-cols-[380px_1fr]">
        <div className="space-y-3 rounded-[18px] border border-[#E3E8F4] bg-white p-3">
          {applications.length ? applications.map((item) => (
            <Link key={item.id} href={{ pathname: "/dashboard/admin/admissions", query: { ...params, application: item.id } }} className={`block rounded-[14px] border p-4 transition ${selected?.id === item.id ? "border-[#1C4ED1] bg-[#F4F7FF]" : "border-[#E3E8F4] hover:border-[#1C4ED1]/40"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#040B37]">{item.user.name ?? "Unnamed applicant"}</p><p className="mt-1 text-xs text-[#77839A]">{item.user.email}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">{formatStatus(item.status)}</span></div>
              <p className="mt-4 text-sm font-semibold text-[#526078]">{item.cohort.program.title}</p><p className="mt-1 text-xs text-[#77839A]">Submitted {item.submittedAt?.toLocaleDateString("en-GB") ?? "—"}</p>
            </Link>
          )) : <p className="p-5 text-sm font-semibold text-[#77839A]">No applications match these filters.</p>}
        </div>

        {selected ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <article className="rounded-[18px] border border-[#E3E8F4] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#1C4ED1]">{selected.cohort.program.title}</p><h2 className="mt-2 text-2xl font-black text-[#040B37]">{selected.user.name ?? "Unnamed applicant"}</h2><p className="mt-1 text-sm text-[#77839A]">{selected.user.email}{selected.user.location ? ` · ${selected.user.location}` : ""}</p></div><Link href={`/cohorts/${selected.cohort.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]">View cohort <ExternalLink size={14} /></Link></div>
              <div className="mt-7 grid gap-5"><section><h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">Background</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#33415C]">{selected.background}</p></section><section><h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">Goals</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#33415C]">{selected.goals}</p></section><section><h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">Readiness</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#33415C]">{selected.prerequisites}</p></section></div>
              <dl className="mt-7 grid gap-3 rounded-2xl bg-[#F8FAFF] p-5 sm:grid-cols-2"><div><dt className="text-xs text-[#77839A]">Experience</dt><dd className="mt-1 text-sm font-bold text-[#040B37]">{answers?.experienceLevel.replaceAll("_", " ").toLowerCase()}</dd></div><div><dt className="text-xs text-[#77839A]">Weekly hours</dt><dd className="mt-1 text-sm font-bold text-[#040B37]">{answers?.weeklyHours}</dd></div><div><dt className="text-xs text-[#77839A]">Laptop</dt><dd className="mt-1 text-sm font-bold text-[#040B37]">{answers?.hasLaptop ? "Confirmed" : "Not confirmed"}</dd></div><div><dt className="text-xs text-[#77839A]">Reliable internet</dt><dd className="mt-1 text-sm font-bold text-[#040B37]">{answers?.hasReliableInternet ? "Confirmed" : "Not confirmed"}</dd></div></dl>
              {selected.portfolioUrl && <a href={selected.portfolioUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]">Open portfolio <ExternalLink size={14} /></a>}
            </article>
            <aside className="space-y-5"><div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><h3 className="font-black text-[#040B37]">Decision</h3><p className="mt-1 text-xs leading-5 text-[#77839A]">Paid acceptance creates a seven-day offer. Membership waits for verified payment.</p><div className="mt-5"><CohortApplicationReviewPanel applicationId={selected.id} currentStatus={selected.status} /></div></div><div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><h3 className="font-black text-[#040B37]">Offer & membership</h3><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#77839A]">Tuition</dt><dd className="font-bold text-[#040B37]">{new Intl.NumberFormat("en-NG", { style: "currency", currency: selected.cohort.currency, maximumFractionDigits: 0 }).format(Number(selected.cohort.price ?? 0))}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#77839A]">Payment</dt><dd className="font-bold capitalize text-[#040B37]">{selected.purchaseOrder?.status.toLowerCase() ?? "not started"}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#77839A]">Offer expires</dt><dd className="font-bold text-[#040B37]">{selected.offerExpiresAt?.toLocaleDateString("en-GB") ?? "—"}</dd></div></dl>{selected.reviewNote && <div className="mt-5 border-t border-[#E3E8F4] pt-4"><p className="text-xs font-black uppercase tracking-[0.1em] text-[#77839A]">Recorded note</p><p className="mt-2 text-sm leading-6 text-[#526078]">{selected.reviewNote}</p></div>}</div></aside>
          </div>
        ) : <div className="rounded-[18px] border border-dashed border-[#DCE3F0] bg-white p-10 text-center text-sm font-semibold text-[#77839A]">Choose an application to review.</div>}
      </section>
    </main>
  );
}
