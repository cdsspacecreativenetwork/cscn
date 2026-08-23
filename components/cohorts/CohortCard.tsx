import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, UsersRound } from "lucide-react";

import { isCohortApplicationOpen } from "@/lib/cohort-application";

type CohortCardProps = {
  cohort: {
    slug: string;
    title: string;
    status: string;
    applicationOpenAt: Date;
    applicationCloseAt: Date;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    capacity: number;
    price: unknown;
    currency: string;
    scheduleSummary: string;
    program: {
      title: string;
      shortDescription: string;
      estimatedDurationWeeks: number;
      weeklyCommitmentHours: number | null;
      school: { name: string };
    };
  };
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

function formatPrice(amount: unknown, currency: string) {
  const value = Number(amount ?? 0);
  if (value === 0) return "No tuition";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CohortCard({ cohort }: CohortCardProps) {
  const applicationsOpen = isCohortApplicationOpen(cohort);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-[#DCE3F1] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(28,78,209,0.12)]">
      <div className="flex items-center justify-between border-b border-[#E7ECF5] px-6 py-4">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {cohort.program.school.name}
        </span>
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${applicationsOpen ? "bg-[#E8F7EF] text-[#176B41]" : "bg-[#EEF1F6] text-[#526078]"}`}>
          {applicationsOpen ? "Applications open" : "Applications closed"}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-7">
        <p className="mb-2 text-sm font-medium text-[#68758B]">{cohort.title}</p>
        <h3 className="max-w-[24ch] text-2xl font-semibold leading-tight tracking-[-0.03em] text-navy">
          {cohort.program.title}
        </h3>
        <p className="mt-4 text-[15px] leading-7 text-text-body">{cohort.program.shortDescription}</p>

        <dl className="mt-7 grid gap-3 text-sm text-[#4B5870]">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            <dt className="sr-only">Dates</dt>
            <dd>{dateFormatter.format(cohort.startsAt)} – {dateFormatter.format(cohort.endsAt)}</dd>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
            <dt className="sr-only">Commitment</dt>
            <dd>{cohort.program.estimatedDurationWeeks} weeks · {cohort.program.weeklyCommitmentHours ?? "Flexible"} hours/week</dd>
          </div>
          <div className="flex items-center gap-3">
            <UsersRound className="h-4 w-4 text-primary" aria-hidden="true" />
            <dt className="sr-only">Cohort size</dt>
            <dd>Up to {cohort.capacity} learners · Live online</dd>
          </div>
        </dl>

        <div className="mt-7 flex items-end justify-between gap-4 border-t border-[#E7ECF5] pt-5">
          <div>
            <p className="text-xs text-[#7A879C]">Tuition</p>
            <p className="mt-1 font-semibold text-navy">{formatPrice(cohort.price, cohort.currency)}</p>
          </div>
          <Link
            href={`/cohorts/${cohort.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            View cohort <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
