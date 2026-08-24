import Link from "next/link";
import { ClipboardCheck, ExternalLink, Search } from "lucide-react";

import { ProjectReviewPanel } from "@/components/dashboard/admin/ProjectReviewPanel";
import { requireAnyAdminPermission } from "@/lib/admin-guards";
import { db } from "@/lib/db";

export const metadata = { title: "Project reviews | CSCN Admin" };
type Props = { searchParams: Promise<{ query?: string; submission?: string }> };

export default async function ProjectReviewsPage({ searchParams }: Props) {
  await requireAnyAdminPermission(["canManageLearners", "canManageUsers"]);
  const params = await searchParams;
  const submissions = await db.projectSubmission.findMany({
    where: {
      status: "SUBMITTED",
      OR: params.query ? [
        { title: { contains: params.query, mode: "insensitive" } },
        { user: { name: { contains: params.query, mode: "insensitive" } } },
        { user: { email: { contains: params.query, mode: "insensitive" } } },
        { project: { title: { contains: params.query, mode: "insensitive" } } },
      ] : undefined,
    },
    orderBy: [{ submittedAt: "asc" }, { updatedAt: "asc" }],
    take: 100,
    select: {
      id: true, title: true, summary: true, status: true, currentVersion: true, submittedAt: true, artifactUrl: true, repositoryUrl: true, demoUrl: true, showcaseConsent: true,
      user: { select: { name: true, email: true } },
      versions: { orderBy: { version: "desc" }, select: { id: true, version: true, submittedAt: true } },
      project: { select: { title: true, showcaseEligible: true, cohort: { select: { title: true, slug: true, program: { select: { title: true } } } }, rubricCriteria: { orderBy: { position: "asc" }, select: { id: true, title: true, description: true, maxScore: true } } } },
    },
  });
  const selected = submissions.find((item) => item.id === params.submission) ?? submissions[0] ?? null;

  return (
    <main className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <section className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 sm:p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1C4ED1] text-white"><ClipboardCheck size={22} /></div><div><h1 className="text-[26px] font-black tracking-[-0.04em] text-[#040B37]">Applied project reviews</h1><p className="mt-1 text-sm font-medium text-[#77839A]">Score preserved submission versions, request focused revisions, and issue verifiable credentials only after approval.</p></div></div><div className="mt-6 inline-flex rounded-xl bg-[#F8FAFF] px-4 py-3"><span className="text-xs font-black uppercase tracking-[0.1em] text-[#77839A]">Awaiting review</span><span className="ml-4 text-xl font-black text-[#040B37]">{submissions.length}</span></div></section>
      <form className="flex gap-3 rounded-[16px] border border-[#E3E8F4] bg-white p-4"><label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" /><input name="query" defaultValue={params.query} placeholder="Search learner, project, or brief" className="h-10 w-full rounded-[9px] border border-[#DCE3F0] pl-10 pr-3 text-sm outline-none focus:border-[#1C4ED1]" /></label><button className="h-10 rounded-[9px] bg-[#040B37] px-5 text-sm font-bold text-white">Search</button></form>
      <section className="grid min-h-[620px] gap-5 xl:grid-cols-[380px_1fr]">
        <div className="space-y-3 rounded-[18px] border border-[#E3E8F4] bg-white p-3">{submissions.length ? submissions.map((item) => <Link key={item.id} href={{ pathname: "/dashboard/admin/project-reviews", query: { ...params, submission: item.id } }} className={`block rounded-[14px] border p-4 transition ${selected?.id === item.id ? "border-[#1C4ED1] bg-[#F4F7FF]" : "border-[#E3E8F4] hover:border-[#1C4ED1]/40"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#040B37]">{item.user.name ?? "Unnamed learner"}</p><p className="mt-1 text-xs text-[#77839A]">{item.user.email}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">v{item.currentVersion}</span></div><p className="mt-4 text-sm font-semibold text-[#526078]">{item.project.title}</p><p className="mt-1 text-xs text-[#77839A]">Submitted {item.submittedAt?.toLocaleDateString("en-GB") ?? "—"}</p></Link>) : <p className="p-5 text-sm font-semibold text-[#77839A]">No project submissions are waiting for review.</p>}</div>
        {selected ? <div className="grid gap-5 lg:grid-cols-[1fr_390px]"><article className="rounded-[18px] border border-[#E3E8F4] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#1C4ED1]">{selected.project.cohort.program.title}</p><h2 className="mt-2 text-2xl font-black text-[#040B37]">{selected.title}</h2><p className="mt-1 text-sm text-[#77839A]">{selected.user.name ?? "Unnamed learner"} · version {selected.currentVersion}</p></div><Link href={`/dashboard/cohorts/${selected.project.cohort.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]">Open cohort <ExternalLink size={14} /></Link></div><section className="mt-7"><h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">Case-study summary</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#33415C]">{selected.summary}</p></section><div className="mt-6 flex flex-wrap gap-4">{[["Artifact", selected.artifactUrl], ["Repository", selected.repositoryUrl], ["Demo", selected.demoUrl]].map(([label, href]) => href && <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-[#1C4ED1]">{label} <ExternalLink size={14} /></a>)}</div><div className="mt-7 border-t border-[#E3E8F4] pt-5"><h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">Preserved versions</h3><div className="mt-3 flex flex-wrap gap-2">{selected.versions.map((version) => <span key={version.id} className="rounded-full bg-[#F4F6FB] px-3 py-1.5 text-xs font-bold text-[#526078]">Version {version.version} · {version.submittedAt.toLocaleDateString("en-GB")}</span>)}</div></div></article><aside className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><h3 className="font-black text-[#040B37]">Rubric decision</h3><p className="mt-1 text-xs leading-5 text-[#77839A]">All criteria require a score. Approval creates a credential bound to this exact version and review.</p><div className="mt-5"><ProjectReviewPanel submissionId={selected.id} criteria={selected.project.rubricCriteria} canPublish={selected.showcaseConsent && selected.project.showcaseEligible} /></div></aside></div> : <div className="rounded-[18px] border border-dashed border-[#DCE3F0] bg-white p-10 text-center text-sm font-semibold text-[#77839A]">Choose a submission to review.</div>}
      </section>
    </main>
  );
}
