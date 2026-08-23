import Link from "next/link";
import { ArrowLeft, BadgeCheck, ExternalLink, Fingerprint } from "lucide-react";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export default async function ShowcaseDetailPage({ params }: Props) {
  const { slug } = await params;
  const submission = await db.projectSubmission.findFirst({
    where: { showcaseSlug: slug, status: "APPROVED", showcasePublishedAt: { not: null }, credential: { status: "ACTIVE" } },
    select: {
      title: true, summary: true, artifactUrl: true, repositoryUrl: true, demoUrl: true, coverImageUrl: true, currentVersion: true, showcasePublishedAt: true,
      user: { select: { name: true } },
      project: { select: { title: true, brief: true, cohort: { select: { title: true, program: { select: { title: true } } } } } },
      reviews: { where: { decision: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { overallNote: true, totalScore: true, maxScore: true, createdAt: true, scores: { include: { criterion: { select: { title: true, maxScore: true, position: true } } } } } },
      credential: { select: { verificationCode: true, issuedAt: true } },
    },
  });
  if (!submission || !submission.credential) notFound();
  const review = submission.reviews[0];
  const scores = review?.scores.toSorted((a, b) => a.criterion.position - b.criterion.position) ?? [];

  return <main className="min-h-screen bg-[#F7F9FD] pb-24 pt-28 font-jakarta"><div className="mx-auto max-w-[1180px] px-5 sm:px-8"><Link href="/showcase" className="inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]"><ArrowLeft size={16} />All projects</Link><section className="mt-8 overflow-hidden rounded-[26px] bg-[#040B37] p-7 text-white sm:p-12"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#8FB0FF]">{submission.project.cohort.program.title} · {submission.project.cohort.title}</p><h1 className="mt-5 max-w-4xl text-[clamp(38px,6vw,72px)] font-black leading-[0.98] tracking-[-0.055em]">{submission.title}</h1><div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[#C7D4F5]"><span className="inline-flex items-center gap-2"><BadgeCheck size={18} className="text-[#8FB0FF]" />{submission.user.name ?? "CSCN learner"}</span><span>Preserved submission v{submission.currentVersion}</span>{review && <span>{review.totalScore}/{review.maxScore} rubric score</span>}</div></section><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]"><article className="space-y-6 rounded-[22px] border border-[#E0E6F0] bg-white p-7 sm:p-9"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#77839A]">Case study</p><p className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-[#33415C]">{submission.summary}</p></div><div className="flex flex-wrap gap-3">{[["View artifact", submission.artifactUrl], ["Open repository", submission.repositoryUrl], ["View demo", submission.demoUrl]].map(([label, href]) => href && <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#D6DEEC] px-4 py-2.5 text-sm font-black text-[#1C4ED1]">{label}<ExternalLink size={14} /></a>)}</div>{review && <div className="border-t border-[#E7EBF2] pt-7"><h2 className="text-xl font-black text-[#040B37]">Reviewer assessment</h2><p className="mt-3 text-sm leading-7 text-[#526078]">{review.overallNote}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{scores.map((score) => <div key={score.criterion.title} className="rounded-xl bg-[#F7F9FD] p-4"><div className="flex justify-between gap-3"><p className="text-sm font-bold text-[#040B37]">{score.criterion.title}</p><span className="text-xs font-black text-[#1C4ED1]">{score.score}/{score.criterion.maxScore}</span></div>{score.note && <p className="mt-2 text-xs leading-5 text-[#667085]">{score.note}</p>}</div>)}</div></div>}</article><aside className="space-y-5"><div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-6"><Fingerprint size={24} className="text-emerald-700" /><h2 className="mt-4 font-black text-emerald-950">Credential verified</h2><p className="mt-2 text-sm leading-6 text-emerald-800">This approval is linked to a stable public record and evidence fingerprint.</p><Link href={`/credentials/${submission.credential.verificationCode}`} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-900">View credential <ExternalLink size={14} /></Link></div><div className="rounded-[22px] border border-[#E0E6F0] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">Project brief</p><h2 className="mt-3 font-black text-[#040B37]">{submission.project.title}</h2><p className="mt-3 text-sm leading-6 text-[#667085]">{submission.project.brief}</p></div></aside></div></div></main>;
}
