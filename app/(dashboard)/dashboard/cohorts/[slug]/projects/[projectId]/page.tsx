import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, ExternalLink, History, LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ProjectSubmissionForm } from "@/components/cohorts/ProjectSubmissionForm";
import { canEditProjectSubmission } from "@/lib/project-submission";
import { db } from "@/lib/db";

type Props = { params: Promise<{ slug: string; projectId: string }> };
export const metadata = { title: "Applied project | CSCN" };

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function CohortProjectPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const { slug, projectId } = await params;
  const project = await db.cohortProject.findFirst({
    where: { id: projectId, status: "PUBLISHED", cohort: { slug, memberships: { some: { userId: session.user.id, role: "LEARNER", status: { in: ["ACTIVE", "COMPLETED"] } } } } },
    select: {
      id: true, title: true, brief: true, deliverables: true, dueAt: true, showcaseEligible: true, credentialTitle: true,
      cohort: { select: { title: true, program: { select: { title: true } } } },
      rubricCriteria: { orderBy: { position: "asc" }, select: { id: true, title: true, description: true, maxScore: true } },
      submissions: {
        where: { userId: session.user.id }, take: 1,
        select: {
          id: true, status: true, title: true, summary: true, artifactUrl: true, repositoryUrl: true, demoUrl: true, coverImageUrl: true, showcaseConsent: true, currentVersion: true, submittedAt: true,
          versions: { orderBy: { version: "desc" }, select: { id: true, version: true, submittedAt: true } },
          reviews: { orderBy: { createdAt: "desc" }, take: 1, select: { decision: true, overallNote: true, totalScore: true, maxScore: true, createdAt: true, scores: { include: { criterion: { select: { title: true, maxScore: true } } }, orderBy: { criterion: { position: "asc" } } } } },
          credential: { select: { verificationCode: true, title: true, status: true, issuedAt: true } },
        },
      },
    },
  });
  if (!project) notFound();
  const submission = project.submissions[0];
  const latestReview = submission?.reviews[0];
  const editable = canEditProjectSubmission(submission?.status);
  const deliverables = list(project.deliverables);
  const initialData = {
    title: submission?.title ?? "",
    summary: submission?.summary ?? "",
    artifactUrl: submission?.artifactUrl ?? "",
    repositoryUrl: submission?.repositoryUrl ?? "",
    demoUrl: submission?.demoUrl ?? "",
    coverImageUrl: submission?.coverImageUrl ?? "",
    showcaseConsent: submission?.showcaseConsent ?? false,
  };

  return (
    <main className="mx-auto max-w-[1380px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <Link href={`/dashboard/cohorts/${slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]"><ArrowLeft size={16} />Back to cohort</Link>
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-5"><div className="rounded-[20px] bg-[#040B37] p-6 text-white sm:p-8"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#8FB0FF]">{project.cohort.program.title}</p><h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">{project.title}</h1><p className="mt-5 text-sm leading-7 text-[#C7D4F5]">{project.brief}</p>{project.dueAt && <p className="mt-5 text-xs font-bold text-[#8FB0FF]">Due {project.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>}</div>
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><h2 className="font-black text-[#040B37]">Deliverables</h2><ul className="mt-4 space-y-3">{deliverables.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#526078]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></div>
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><h2 className="font-black text-[#040B37]">Rubric</h2><div className="mt-4 space-y-4">{project.rubricCriteria.map((item) => <div key={item.id}><div className="flex justify-between gap-3"><p className="text-sm font-bold text-[#040B37]">{item.title}</p><span className="text-xs font-black text-[#1C4ED1]">/{item.maxScore}</span></div><p className="mt-1 text-xs leading-5 text-[#667085]">{item.description}</p></div>)}</div></div></aside>
        <div className="space-y-5"><section className="rounded-[20px] border border-[#E3E8F4] bg-white p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black text-[#040B37]">Your submission</h2><p className="mt-1 text-sm text-[#77839A]">{submission ? `Version ${submission.currentVersion} · ${submission.status.toLowerCase().replaceAll("_", " ")}` : "No draft yet"}</p></div>{submission && <span className="rounded-full bg-[#F4F6FB] px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#526078]">{submission.status.replaceAll("_", " ")}</span>}</div><div className="mt-6">{editable ? <ProjectSubmissionForm projectId={project.id} initialData={initialData} /> : <div className="rounded-2xl bg-[#F8FAFF] p-6"><LockKeyhole className="text-[#1C4ED1]" size={22} /><h3 className="mt-4 font-black text-[#040B37]">Submission locked</h3><p className="mt-2 text-sm leading-6 text-[#667085]">Submitted work remains immutable while it is under review. If changes are requested, this form unlocks and your next submission becomes a new preserved version.</p><div className="mt-5 flex flex-wrap gap-3">{submission?.artifactUrl && <a href={submission.artifactUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]">View artifact <ExternalLink size={14} /></a>}{submission?.demoUrl && <a href={submission.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]">Open demo <ExternalLink size={14} /></a>}</div></div>}</div></section>
        {latestReview && <section className="rounded-[20px] border border-[#E3E8F4] bg-white p-6 sm:p-8"><div className="flex items-center gap-3"><Award className="text-[#1C4ED1]" size={22} /><div><h2 className="font-black text-[#040B37]">Latest rubric review</h2><p className="text-xs text-[#77839A]">{latestReview.totalScore}/{latestReview.maxScore} points · {latestReview.decision.toLowerCase().replaceAll("_", " ")}</p></div></div><p className="mt-5 text-sm leading-7 text-[#526078]">{latestReview.overallNote}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{latestReview.scores.map((score) => <div key={score.criterion.title} className="rounded-xl bg-[#F8FAFF] p-4"><div className="flex justify-between"><p className="text-sm font-bold text-[#040B37]">{score.criterion.title}</p><span className="text-xs font-black text-[#1C4ED1]">{score.score}/{score.criterion.maxScore}</span></div>{score.note && <p className="mt-2 text-xs leading-5 text-[#667085]">{score.note}</p>}</div>)}</div></section>}
        {submission?.versions.length ? <section className="rounded-[20px] border border-[#E3E8F4] bg-white p-6"><div className="flex items-center gap-2"><History className="text-[#1C4ED1]" size={19} /><h2 className="font-black text-[#040B37]">Version history</h2></div><div className="mt-4 space-y-3">{submission.versions.map((version) => <div key={version.id} className="flex justify-between rounded-xl bg-[#F8FAFF] p-4 text-sm"><span className="font-bold text-[#040B37]">Version {version.version}</span><span className="text-[#77839A]">{version.submittedAt.toLocaleDateString("en-GB")}</span></div>)}</div></section> : null}
        {submission?.credential && <section className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-6"><h2 className="font-black text-emerald-900">Credential issued</h2><p className="mt-2 text-sm text-emerald-800">{submission.credential.title}</p><Link href={`/credentials/${submission.credential.verificationCode}`} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-800">Verify credential <ExternalLink size={14} /></Link></section>}</div>
      </section>
    </main>
  );
}
