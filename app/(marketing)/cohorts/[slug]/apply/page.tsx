import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";

import { auth } from "@/auth";
import { CohortApplicationForm } from "@/components/cohorts/CohortApplicationForm";
import { emptyCohortApplication, isCohortApplicationOpen, readApplicationAnswers } from "@/lib/cohort-application";
import { getPublicCohort, getUserCohortApplication } from "@/lib/services/cohorts.service";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Cohort application | CSCN",
  description: "Start, resume, submit, or review your CSCN cohort application.",
  robots: { index: false, follow: false },
};

const statusCopy: Record<string, { title: string; body: string }> = {
  SUBMITTED: { title: "Application submitted", body: "Your application is in the admissions queue. You will see any status change here." },
  UNDER_REVIEW: { title: "Application under review", body: "Admissions is reviewing your background, goals, and readiness for this cohort." },
  ACCEPTED: { title: "Application accepted", body: "Your offer and any required payment steps will appear here after they are configured." },
  WAITLISTED: { title: "Application waitlisted", body: "You remain under consideration if a place becomes available for this cohort." },
  DECLINED: { title: "Application not selected", body: "This decision applies only to this cohort. You may apply to a future cohort when applications open." },
  WITHDRAWN: { title: "Application withdrawn", body: "This application is no longer active." },
};

export default async function CohortApplyPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(`/cohorts/${slug}/apply`)}`);

  const cohort = await getPublicCohort(slug);
  if (!cohort) notFound();
  const application = await getUserCohortApplication(cohort.id, session.user.id);

  if (application && application.status !== "DRAFT") {
    const copy = statusCopy[application.status] ?? statusCopy.SUBMITTED;
    return (
      <main className="min-h-screen bg-[#F4F7FC] px-4 pb-24 pt-32">
        <div className="mx-auto max-w-3xl">
          <Link href={`/cohorts/${cohort.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Back to cohort</Link>
          <section className="mt-8 rounded-[2rem] bg-white p-7 ring-1 ring-[#DCE3F0] shadow-[0_24px_70px_rgba(7,19,61,0.08)] md:p-11">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4F5EC] text-[#237451]"><CheckCircle2 className="h-7 w-7" /></div>
            <p className="mt-7 text-sm font-semibold text-primary">{cohort.title}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-navy">{copy.title}</h1>
            <p className="mt-5 text-lg leading-8 text-text-body">{copy.body}</p>
            <dl className="mt-8 grid gap-4 rounded-2xl bg-[#F5F7FB] p-6 sm:grid-cols-2">
              <div><dt className="text-xs text-[#77839A]">Program</dt><dd className="mt-1 font-semibold text-navy">{cohort.program.title}</dd></div>
              <div><dt className="text-xs text-[#77839A]">Status</dt><dd className="mt-1 font-semibold capitalize text-navy">{application.status.replaceAll("_", " ").toLowerCase()}</dd></div>
              <div><dt className="text-xs text-[#77839A]">Submitted</dt><dd className="mt-1 font-semibold text-navy">{application.submittedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) ?? "Not recorded"}</dd></div>
              <div><dt className="text-xs text-[#77839A]">Reference</dt><dd className="mt-1 font-mono text-sm font-semibold text-navy">{application.id.slice(-10).toUpperCase()}</dd></div>
            </dl>
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-[#D9E3F3] p-4 text-sm leading-6 text-[#526078]"><Clock3 className="mt-1 h-4 w-4 shrink-0 text-primary" /><p>No decision timeline is promised for this preview fixture. Production cohorts will publish their expected review window before opening.</p></div>
          </section>
        </div>
      </main>
    );
  }

  if (!isCohortApplicationOpen(cohort)) {
    return (
      <main className="min-h-screen bg-[#F4F7FC] px-4 pb-24 pt-32"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center ring-1 ring-[#DCE3F0]"><h1 className="text-3xl font-semibold text-navy">Applications are closed.</h1><p className="mt-4 text-text-body">This application can no longer be started or changed.</p><Link href={`/cohorts/${cohort.slug}`} className="mt-7 inline-flex font-semibold text-primary">Return to cohort details</Link></div></main>
    );
  }

  const answers = application ? readApplicationAnswers(application.answers) : readApplicationAnswers(null);
  const initialData = application ? {
    background: application.background,
    goals: application.goals,
    prerequisites: application.prerequisites,
    portfolioUrl: application.portfolioUrl ?? "",
    ...answers,
  } : emptyCohortApplication;

  return (
    <main className="min-h-screen bg-[#F4F7FC] px-4 pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-5xl">
        <Link href={`/cohorts/${cohort.slug}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Back to cohort</Link>
        <CohortApplicationForm
          cohortSlug={cohort.slug}
          cohortTitle={cohort.title}
          programTitle={cohort.program.title}
          applicant={{ name: session.user.name ?? "CSCN applicant", email: session.user.email ?? "" }}
          initialData={initialData}
        />
      </div>
    </main>
  );
}
