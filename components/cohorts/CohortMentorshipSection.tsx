import { UserRoundCheck } from "lucide-react";

import MentorCard from "@/components/ui/MentorCard";

type Mentorship = NonNullable<Awaited<ReturnType<typeof import("@/lib/services/cohort-mentorship.service").getCohortMentorshipForLearner>>>;

function formatDateTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: timezone, timeZoneName: "short" }).format(date);
}

export function CohortMentorshipSection({ mentorship, cohort }: { mentorship: Mentorship | null; cohort: { id: string; slug: string; title: string; programTitle: string } }) {
  return <section>
    <div className="flex items-start gap-3"><UserRoundCheck className="mt-1 text-[#1C4ED1]" size={23} /><div><h2 className="text-2xl font-black tracking-[-0.035em] text-[#040B37]">Cohort mentorship</h2><p className="mt-1 text-sm text-[#77839A]">Book an assigned mentor for project feedback, portfolio review, or cohort-specific guidance.</p></div></div>
    {mentorship?.mentors.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{mentorship.mentors.map((mentor) => <MentorCard key={mentor.assignmentId} {...mentor} bookingContext={{ cohortId: cohort.id, cohortTitle: `${cohort.programTitle} · ${cohort.title}`, returnTo: `/dashboard/cohorts/${cohort.slug}`, submissions: mentorship.submissions.map((submission) => ({ id: submission.id, title: submission.title, projectTitle: submission.project.title, status: submission.status })) }} />)}</div> : <div className="mt-5 rounded-[18px] border border-dashed border-[#D5DDEA] bg-white p-8 text-sm text-[#77839A]">No mentor has been assigned to this cohort yet. General mentorship remains available from the public mentorship directory.</div>}
    {mentorship?.upcomingBookings.length ? <div className="mt-5 rounded-[18px] border border-[#E3E8F4] bg-white p-5"><h3 className="font-black text-[#040B37]">Your cohort mentorship bookings</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{mentorship.upcomingBookings.map((booking) => <div key={booking.id} className="rounded-xl bg-[#F7F9FD] p-4"><p className="text-sm font-black text-[#040B37]">{booking.mentor.name ?? "CSCN mentor"}</p><p className="mt-1 text-xs text-[#667085]">{formatDateTime(booking.startsAt, booking.timezone)} · {booking.status.toLowerCase().replaceAll("_", " ")}</p>{booking.projectSubmission && <p className="mt-2 text-xs font-bold text-[#1C4ED1]">Project: {booking.projectSubmission.title}</p>}</div>)}</div></div> : null}
  </section>;
}
