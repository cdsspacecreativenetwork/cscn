import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, CheckCircle2 } from "lucide-react";

import { CohortCard } from "@/components/cohorts/CohortCard";
import { listUpcomingCohorts } from "@/lib/services/cohorts.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Online Cohorts & Bootcamps | CSCN",
  description: "Join live CSCN cohorts for structured learning, expert instruction, peer accountability, practical projects, mentorship, and career support.",
};

const applicationSteps = [
  ["Choose a cohort", "Review the schedule, weekly commitment, prerequisites, tuition, and application deadline."],
  ["Tell us about yourself", "Create an account, confirm your profile, and share your background and goals."],
  ["Show your readiness", "Explain how you meet the prerequisites and confirm you can take part in live and project work."],
  ["Submit for review", "Review your answers, submit once, and track the decision from your application page."],
];

export default async function CohortsPage() {
  const cohorts = await listUpcomingCohorts();

  return (
    <main className="min-h-screen bg-background pt-[70px] lg:pt-[76px]">
      <section className="relative overflow-hidden bg-[#07133D] px-4 pb-24 pt-20 text-white md:pb-32 md:pt-28">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_15%_20%,#356AF8_0,transparent_35%),radial-gradient(circle_at_85%_80%,#1C4ED1_0,transparent_30%)]" />
        <div className="relative mx-auto max-w-[83rem]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#AFC3FF]">CSCN live cohorts</p>
          <h1 className="mt-5 max-w-[15ch] text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.045em] md:text-[4.75rem]">
            Learn with a schedule, a team, and people who know your name.
          </h1>
          <p className="mt-7 max-w-[62ch] text-lg leading-8 text-[#D5DDF5] md:text-xl">
            Join instructor-led programs with live classes, weekly milestones, practical projects, peer groups, feedback, and a clear graduation goal.
          </p>
          <Link href="#upcoming" className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-navy transition hover:bg-[#EAF0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07133D] active:scale-[0.98]">
            Browse upcoming cohorts <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section id="upcoming" className="scroll-mt-24 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-[83rem]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Upcoming</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-navy md:text-5xl">Find the run that fits your calendar.</h2>
            <p className="mt-5 text-lg leading-8 text-text-body">Every card shows the planned dates, workload, cohort size, and tuition before you start an application.</p>
          </div>

          {cohorts.length > 0 ? (
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {cohorts.map((cohort) => <CohortCard key={cohort.id} cohort={cohort} />)}
            </div>
          ) : (
            <div className="mt-12 rounded-[2rem] bg-[#F4F7FC] px-6 py-14 text-center">
              <h3 className="text-2xl font-semibold text-navy">No cohort applications are open right now.</h3>
              <p className="mx-auto mt-3 max-w-xl text-text-body">You can still learn through self-paced courses while the next live schedule is being prepared.</p>
              <Link href="/courses" className="mt-6 inline-flex font-semibold text-primary">Browse courses</Link>
            </div>
          )}

          {cohorts.some((cohort) => cohort.title.startsWith("[Preview]")) && (
            <aside className="mt-8 rounded-xl border border-[#D9E2F4] bg-[#F7F9FD] px-5 py-4 text-sm leading-6 text-[#59677E]">
              These are preview fixtures for reviewing CSCN’s cohort experience. They are not active production admissions offers, and no payment will be collected from them.
            </aside>
          )}
        </div>
      </section>

      <section className="bg-[#F4F7FC] px-4 py-20 md:py-28" aria-labelledby="how-to-apply-heading">
        <div className="mx-auto max-w-[83rem]">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Admissions</p>
              <h2 id="how-to-apply-heading" className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-navy md:text-5xl">A clear application, without guesswork.</h2>
              <p className="mt-5 max-w-[55ch] text-lg leading-8 text-text-body">Save a draft as you go. We ask only for information needed to understand your readiness and fit for the schedule.</p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-[1.75rem] bg-[#DDE5F2] ring-1 ring-[#DDE5F2] sm:grid-cols-2">
              {applicationSteps.map(([title, copy], index) => (
                <li key={title} className="bg-white p-7">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-primary">0{index + 1}</span>
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-navy">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-text-body">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
