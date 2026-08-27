import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getLearnerCohorts } from "@/lib/services/cohort-learning.service";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "My cohorts | CSCN" };

function phase(startsAt: Date, endsAt: Date) {
  const now = new Date();
  if (now < startsAt) return "Starts soon";
  if (now > endsAt) return "Completed";
  return "In progress";
}

export default async function LearnerCohortsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberships = await getLearnerCohorts(session.user.id);

  return (
    <main className="mx-auto max-w-[1480px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <Card className="rounded-[20px] px-6 sm:px-8 [--card-spacing:24px] sm:[--card-spacing:32px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1C4ED1] text-white"><GraduationCap size={24} /></div>
        <h1 className="mt-5 text-[clamp(28px,3vw,42px)] font-black tracking-[-0.045em] text-[#040B37]">My cohorts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">Your structured programs, live schedule, announcements, and course progress in one place.</p>
      </Card>

      {memberships.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {memberships.map(({ cohort, status }) => (
            <Link key={cohort.id} href={`/dashboard/cohorts/${cohort.slug}`} className="group block h-full">
              <Card className="h-full rounded-[18px] px-6 sm:px-7 [--card-spacing:24px] sm:[--card-spacing:28px] transition hover:-translate-y-0.5 hover:border-[#1C4ED1]/40">
              <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-[#EAF1FF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">{phase(cohort.startsAt, cohort.endsAt)}</span><ArrowRight className="text-[#9CA3AF] transition group-hover:translate-x-1 group-hover:text-[#1C4ED1]" size={18} /></div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">{cohort.program.school.name}</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#040B37]">{cohort.program.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#667085]">{cohort.program.shortDescription}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#F8FAFF] p-4 text-sm"><div><p className="text-xs text-[#77839A]">Cohort</p><p className="mt-1 font-bold text-[#040B37]">{cohort.title}</p></div><div><p className="text-xs text-[#77839A]">Courses</p><p className="mt-1 font-bold text-[#040B37]">{cohort.program._count.courses}</p></div><div className="col-span-2 flex items-center gap-2 text-[#526078]"><CalendarDays size={15} className="text-[#1C4ED1]" />{cohort.startsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {cohort.endsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div></div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[#77839A]">Membership: {status.toLowerCase()}</p>
              </Card>
            </Link>
          ))}
        </section>
      ) : (
        <section className="rounded-[20px] border border-dashed border-[#C9D3E5] bg-white p-10 text-center sm:p-16"><h2 className="text-2xl font-black text-[#040B37]">No active cohort membership yet</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667085]">Accepted paid offers appear here only after verified payment. You can browse open cohorts or check an existing application.</p><Link href="/cohorts" className="mt-7 inline-flex rounded-[10px] bg-[#1C4ED1] px-5 py-3 text-sm font-bold text-white">Explore cohorts</Link></section>
      )}
    </main>
  );
}
