import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Globe2, UsersRound } from "lucide-react";

import { auth } from "@/auth";
import { isCohortApplicationOpen } from "@/lib/cohort-application";
import { getPublicCohort, getUserCohortApplication } from "@/lib/services/cohorts.service";

type Props = { params: Promise<{ slug: string }> };

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatPrice(amount: unknown, currency: string) {
  const value = Number(amount ?? 0);
  if (value === 0) return "No tuition";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cohort = await getPublicCohort((await params).slug);
  if (!cohort) return { title: "Cohort not found | CSCN" };
  return {
    title: `${cohort.program.title} – ${cohort.title} | CSCN`,
    description: cohort.program.shortDescription,
  };
}

export default async function CohortDetailPage({ params }: Props) {
  const { slug } = await params;
  const [cohort, session] = await Promise.all([getPublicCohort(slug), auth()]);
  if (!cohort) notFound();

  const application = session?.user?.id
    ? await getUserCohortApplication(cohort.id, session.user.id)
    : null;
  const applicationOpen = isCohortApplicationOpen(cohort);
  const outcomes = strings(cohort.program.outcomes);
  const requirements = strings(cohort.program.requirements);
  const skills = strings(cohort.program.skills);
  const graduationRules = strings(cohort.graduationRules);
  const weeklySchedule = strings(cohort.weeklySchedule);
  const applyPath = `/cohorts/${cohort.slug}/apply`;
  const applyHref = session?.user?.id ? applyPath : `/signin?callbackUrl=${encodeURIComponent(applyPath)}`;
  const ctaLabel = application
    ? application.status === "DRAFT" ? "Resume application" : "View application status"
    : "Apply to join";

  return (
    <main className="min-h-screen bg-background pt-[70px] lg:pt-[76px]">
      <section className="bg-[#07133D] px-4 pb-20 pt-10 text-white md:pb-28 md:pt-14">
        <div className="mx-auto max-w-[83rem]">
          <Link href="/cohorts" className="inline-flex items-center gap-2 text-sm font-medium text-[#B8C6EC] transition hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All cohorts
          </Link>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                <span className="rounded-md bg-white/10 px-3 py-1.5 text-[#C8D5FA]">{cohort.program.school.name}</span>
                <span className="text-[#9DB6FF]">{cohort.title}</span>
              </div>
              <h1 className="mt-6 max-w-[18ch] text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.045em] md:text-[4.5rem]">{cohort.program.title}</h1>
              <p className="mt-6 max-w-[64ch] text-lg leading-8 text-[#D2DAF1]">{cohort.program.description}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                {applicationOpen || application ? (
                  <Link href={applyHref} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-navy transition hover:bg-[#EAF0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07133D] active:scale-[0.98]">
                    {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="inline-flex rounded-full bg-white/10 px-6 py-3.5 font-semibold text-[#B8C6EC]">Applications closed</span>
                )}
                <Link href="#curriculum" className="inline-flex items-center rounded-full border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">View curriculum</Link>
              </div>
            </div>

            <aside className="rounded-[1.75rem] bg-white p-6 text-navy shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Cohort facts</p>
              <dl className="mt-6 grid gap-5 text-sm">
                <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-primary" /><div><dt className="text-[#77839A]">Dates</dt><dd className="mt-1 font-semibold">{dateFormatter.format(cohort.startsAt)} – {dateFormatter.format(cohort.endsAt)}</dd></div></div>
                <div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 text-primary" /><div><dt className="text-[#77839A]">Weekly commitment</dt><dd className="mt-1 font-semibold">{cohort.program.weeklyCommitmentHours ?? "Flexible"} hours for {cohort.program.estimatedDurationWeeks} weeks</dd></div></div>
                <div className="flex gap-3"><Globe2 className="mt-0.5 h-4 w-4 text-primary" /><div><dt className="text-[#77839A]">Delivery</dt><dd className="mt-1 font-semibold">Live online · {cohort.timezone}</dd></div></div>
                <div className="flex gap-3"><UsersRound className="mt-0.5 h-4 w-4 text-primary" /><div><dt className="text-[#77839A]">Cohort size</dt><dd className="mt-1 font-semibold">Up to {cohort.capacity} learners</dd></div></div>
              </dl>
              <div className="mt-6 border-t border-[#E4E9F2] pt-5">
                <p className="text-sm text-[#77839A]">Applications close</p>
                <p className="mt-1 font-semibold">{dateFormatter.format(cohort.applicationCloseAt)}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {cohort.title.startsWith("[Preview]") && (
        <div className="border-b border-[#DCE3F0] bg-[#F5F8FD] px-4 py-4 text-center text-sm leading-6 text-[#526078]">
          Preview fixture: this cohort is for local product review. Its dates, pricing, instructor assignment, and curriculum are not a public offer.
        </div>
      )}

      <section className="px-4 py-20 md:py-28">
        <div className="mx-auto grid max-w-[83rem] gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">What you will be able to do</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-navy">Finish with evidence, not just attendance.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {outcomes.map((outcome, index) => (
              <div key={outcome} className="rounded-2xl bg-[#F4F7FC] p-6">
                <span className="font-mono text-xs font-semibold text-primary">OUTCOME 0{index + 1}</span>
                <p className="mt-4 text-lg font-semibold leading-7 text-navy">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F4F7FC] px-4 py-20 md:py-28">
        <div className="mx-auto grid max-w-[83rem] gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Weekly rhythm</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-navy">A schedule you can plan around.</h2>
            <p className="mt-5 text-lg leading-8 text-text-body">{cohort.scheduleSummary}</p>
            <ul className="mt-7 grid gap-3">
              {weeklySchedule.map((item) => <li key={item} className="flex items-center gap-3 text-[#46546B]"><Check className="h-4 w-4 text-primary" />{item}</li>)}
            </ul>
          </div>
          <div className="rounded-[1.75rem] bg-white p-7 ring-1 ring-[#DCE3F0] md:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Lead instructor</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8EEFF] text-lg font-semibold text-primary">{cohort.leadInstructor?.name?.slice(0, 1) ?? "C"}</div>
              <div><h3 className="text-xl font-semibold text-navy">{cohort.leadInstructor?.name ?? "Instructor to be confirmed"}</h3><p className="mt-1 text-sm text-text-body">{cohort.leadInstructor?.profile?.headline ?? "Cohort facilitator"}</p></div>
            </div>
            <p className="mt-6 text-sm leading-7 text-text-body">Live teaching is supported by feedback rooms and peer pods. Mentor assignments, where offered, are confirmed before orientation.</p>
          </div>
        </div>
      </section>

      <section id="curriculum" className="scroll-mt-24 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-[83rem]">
          <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Curriculum</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-navy md:text-5xl">The learning units inside this program.</h2></div>
          <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-[#DCE3F0]">
            {cohort.program.courses.map(({ course, required }, index) => (
              <div key={course.id} className="grid gap-4 border-b border-[#E6EBF3] bg-white p-6 last:border-b-0 md:grid-cols-[4rem_1fr_auto] md:items-center md:p-8">
                <span className="font-mono text-sm text-primary">0{index + 1}</span>
                <div><h3 className="text-xl font-semibold text-navy">{course.title}</h3><p className="mt-2 text-sm leading-6 text-text-body">{course.shortDesc}</p></div>
                <span className="text-sm font-medium text-[#68758B]">{required ? "Required" : "Optional"}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-md bg-[#EEF3FF] px-3 py-2 text-sm font-medium text-primary">{skill}</span>)}</div>
        </div>
      </section>

      <section className="bg-[#07133D] px-4 py-20 text-white md:py-28">
        <div className="mx-auto grid max-w-[83rem] gap-12 lg:grid-cols-2 lg:gap-20">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9DB6FF]">Admissions criteria</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Check the fit before you apply.</h2><ul className="mt-7 grid gap-4">{requirements.map((item) => <li key={item} className="flex gap-3 text-[#D2DAF1]"><Check className="mt-1 h-4 w-4 shrink-0 text-[#9DB6FF]" />{item}</li>)}</ul></div>
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9DB6FF]">Graduation</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Completion is based on demonstrated work.</h2><ul className="mt-7 grid gap-4">{graduationRules.map((item) => <li key={item} className="flex gap-3 text-[#D2DAF1]"><Check className="mt-1 h-4 w-4 shrink-0 text-[#9DB6FF]" />{item}</li>)}</ul></div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-28">
        <div className="mx-auto grid max-w-[83rem] gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Application process</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-navy">From application to orientation.</h2>
            <ol className="mt-9 grid gap-0 border-l border-[#C9D5EA]">
              {["Start and save your application", "Submit your background, goals, and readiness", "Admissions reviews the complete application", "Receive an accepted, waitlisted, or declined decision", "Accepted applicants complete any required payment", "Membership is confirmed before orientation"].map((step, index) => (
                <li key={step} className="relative pb-7 pl-8 last:pb-0"><span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-semibold text-white">{index + 1}</span><p className="font-semibold text-navy">{step}</p></li>
              ))}
            </ol>
          </div>
          <aside className="h-fit rounded-[1.75rem] bg-[#F4F7FC] p-7 md:p-9">
            <p className="text-sm text-[#6D7990]">Tuition</p><p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-navy">{formatPrice(cohort.price, cohort.currency)}</p>
            <p className="mt-5 text-sm leading-7 text-text-body">Payment is requested only after an accepted decision. Applying does not create a charge or guarantee admission.</p>
            <div className="mt-6 border-t border-[#DCE3F0] pt-6"><h3 className="font-semibold text-navy">Scholarships</h3><p className="mt-2 text-sm leading-6 text-text-body">No scholarship is attached to this preview cohort. Approved funding options will appear here with exact eligibility and deadlines.</p></div>
            {(applicationOpen || application) && <Link href={applyHref} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-white transition hover:bg-[#153FAE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]">{ctaLabel}<ArrowRight className="h-4 w-4" /></Link>}
          </aside>
        </div>
      </section>
    </main>
  );
}
