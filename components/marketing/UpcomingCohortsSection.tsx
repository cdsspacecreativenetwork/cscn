import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CohortCard } from "@/components/cohorts/CohortCard";
import { listUpcomingCohorts } from "@/lib/services/cohorts.service";

export async function UpcomingCohortsSection() {
  const cohorts = await listUpcomingCohorts(3);
  if (cohorts.length === 0) return null;

  return (
    <section id="homepage-cohorts" className="scroll-mt-24 bg-[#F4F7FC] py-20 md:py-28" aria-labelledby="upcoming-cohorts-heading">
      <div className="mx-auto max-w-[83rem] px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Upcoming cohorts</p>
            <h2 id="upcoming-cohorts-heading" className="mt-4 max-w-[16ch] text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.04em] text-navy md:text-[3.5rem]">
              Learn with structure and people who notice your progress.
            </h2>
            <p className="mt-5 max-w-[62ch] text-lg leading-8 text-text-body">
              Cohorts add live instruction, weekly milestones, peer review, and a defined finish line to a CSCN program.
            </p>
          </div>
          <Link href="/cohorts" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
            See all cohorts <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {cohorts.map((cohort) => <CohortCard key={cohort.id} cohort={cohort} />)}
        </div>

        {cohorts.some((cohort) => cohort.title.startsWith("[Preview]")) && (
          <p className="mt-6 text-sm leading-6 text-[#657187]">
            Preview cohorts are local review fixtures. Dates, tuition, instructors, and curriculum require approval before any public launch.
          </p>
        )}
      </div>
    </section>
  );
}
