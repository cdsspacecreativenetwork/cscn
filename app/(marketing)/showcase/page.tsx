import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";

import { db } from "@/lib/db";

export const metadata = { title: "Learner showcase | CSCN", description: "Approved project work completed by CSCN cohort learners." };

export default async function ShowcasePage() {
  const submissions = await db.projectSubmission.findMany({
    where: { status: "APPROVED", showcasePublishedAt: { not: null }, showcaseSlug: { not: null }, credential: { status: "ACTIVE" } },
    orderBy: { showcasePublishedAt: "desc" },
    select: {
      id: true, showcaseSlug: true, title: true, summary: true, coverImageUrl: true, artifactUrl: true, showcasePublishedAt: true,
      user: { select: { name: true, image: true } },
      project: { select: { title: true, cohort: { select: { title: true, program: { select: { title: true } } } } } },
      reviews: { where: { decision: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { totalScore: true, maxScore: true } },
      credential: { select: { verificationCode: true } },
    },
  });

  return (
    <main className="min-h-screen bg-[#F7F9FD] pb-24 pt-32 font-jakarta">
      <section className="mx-auto max-w-[1380px] px-5 sm:px-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#1C4ED1]">CSCN learner evidence</p><div className="mt-4 grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end"><h1 className="max-w-4xl text-[clamp(42px,6vw,84px)] font-black leading-[0.96] tracking-[-0.06em] text-[#040B37]">Work that passed the rubric.</h1><p className="text-base leading-7 text-[#5E6B84]">Every project shown here is tied to a preserved submission version, an attributable review, learner publication consent, and a publicly verifiable CSCN credential.</p></div></section>
      <section className="mx-auto mt-16 max-w-[1380px] px-5 sm:px-8">
        {submissions.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{submissions.map((item) => {
          const review = item.reviews[0];
          return <Link key={item.id} href={`/showcase/${item.showcaseSlug}`} className="group flex min-h-[390px] flex-col overflow-hidden rounded-[22px] border border-[#E0E6F0] bg-white transition hover:-translate-y-1 hover:border-[#B8C8EA] hover:shadow-[0_20px_50px_rgba(4,11,55,0.08)]"><div className="flex h-40 items-end bg-[#071343] p-6 text-white"><p className="max-w-[16rem] text-2xl font-black leading-tight tracking-[-0.04em]">{item.project.cohort.program.title}</p></div><div className="flex flex-1 flex-col p-6"><div className="flex items-center justify-between gap-4"><span className="text-xs font-black uppercase tracking-[0.12em] text-[#1C4ED1]">{item.project.title}</span>{review && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{review.totalScore}/{review.maxScore}</span>}</div><h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#040B37]">{item.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-[#667085]">{item.summary}</p><div className="mt-auto flex items-center justify-between border-t border-[#E8ECF3] pt-5"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#526078]"><BadgeCheck size={17} className="text-[#1C4ED1]" />{item.user.name ?? "CSCN learner"}</span><ArrowUpRight size={18} className="text-[#1C4ED1] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div></div></Link>;
        })}</div> : <div className="rounded-[22px] border border-dashed border-[#CBD5E5] bg-white px-6 py-20 text-center"><h2 className="text-2xl font-black text-[#040B37]">No published projects yet</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667085]">Approved learner work will appear only after rubric review and explicit publication consent. We do not display placeholder achievements.</p></div>}
      </section>
    </main>
  );
}
