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
    <main className="cscn-marketing-page pb-24 pt-32">
      <section className="cscn-marketing-shell"><p className="cscn-marketing-eyebrow">CSCN learner evidence</p><div className="mt-4 grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end"><h1 className="cscn-marketing-display max-w-4xl">Work that passed the rubric.</h1><p className="cscn-marketing-copy text-base">Every project shown here is tied to a preserved submission version, an attributable review, learner publication consent, and a publicly verifiable CSCN credential.</p></div></section>
      <section className="cscn-marketing-shell mt-16">
        {submissions.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{submissions.map((item) => {
          const review = item.reviews[0];
          return <Link key={item.id} href={`/showcase/${item.showcaseSlug}`} className="cscn-marketing-card group flex min-h-[390px] flex-col overflow-hidden transition hover:-translate-y-1 hover:border-[#B8C8EA]"><div className="flex h-40 items-end bg-navy p-6 text-white"><p className="max-w-[16rem] text-2xl font-semibold leading-tight tracking-[-0.035em]">{item.project.cohort.program.title}</p></div><div className="flex flex-1 flex-col p-6"><div className="flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{item.project.title}</span>{review && <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{review.totalScore}/{review.maxScore}</span>}</div><h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-navy">{item.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-text-body">{item.summary}</p><div className="mt-auto flex items-center justify-between border-t border-stroke pt-5"><span className="inline-flex items-center gap-2 text-sm font-semibold text-text-body"><BadgeCheck size={17} className="text-primary" />{item.user.name ?? "CSCN learner"}</span><ArrowUpRight size={18} className="text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div></div></Link>;
        })}</div> : <div className="cscn-marketing-card border-dashed px-6 py-20 text-center"><h2 className="text-2xl font-semibold text-navy">No published projects yet</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-body">Approved learner work will appear only after rubric review and explicit publication consent. We do not display placeholder achievements.</p></div>}
      </section>
    </main>
  );
}
