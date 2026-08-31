import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, Megaphone, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CohortMentorshipSection } from "@/components/cohorts/CohortMentorshipSection";
import { getCohortLearningDashboard } from "@/lib/services/cohort-learning.service";

export const metadata = { title: "Cohort dashboard | CSCN" };

type Props = { params: Promise<{ slug: string }> };

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatDateTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: timezone, timeZoneName: "short" }).format(date);
}

export default async function CohortLearningPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const { slug } = await params;
  const data = await getCohortLearningDashboard(session.user.id, slug);
  if (!data) notFound();

  const { membership, courses, announcements, schedule, overallProgress, startsInFuture, mentorship } = data;
  const cohort = membership.cohort;
  const weeklySchedule = stringList(cohort.weeklySchedule);
  const graduationRules = stringList(cohort.graduationRules);

  return (
    <main className="mx-auto max-w-[1480px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <Link href="/dashboard/cohorts" className="inline-flex items-center gap-2 text-sm font-bold text-[#1C4ED1]"><ArrowLeft size={16} />All cohorts</Link>
      <header className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-end">
        <div><p className="text-xs font-semibold tracking-wide text-[#1C4ED1]">{cohort.program.school.name}</p><h1 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#040B37] sm:text-3xl">{cohort.program.title}</h1><p className="mt-2 text-base font-medium text-[#526078]">{cohort.title}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">{cohort.program.shortDescription}</p></div><div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><div className="flex items-center justify-between text-xs font-semibold text-[#667085]"><span>Program progress</span><span>{overallProgress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF1F7]"><div className="h-full rounded-full bg-[#1C4ED1]" style={{ width: `${overallProgress}%` }} /></div><p className="mt-3 text-xs leading-5 text-[#667085]">Progress reflects completed lessons across required program courses.</p></div>
      </header>

      {startsInFuture && <section className="flex items-start gap-3 rounded-[16px] border border-[#BDD0FF] bg-[#F2F6FF] p-5"><Clock3 className="mt-0.5 shrink-0 text-[#1C4ED1]" size={20} /><div><h2 className="font-black text-[#040B37]">Your place is confirmed</h2><p className="mt-1 text-sm leading-6 text-[#526078]">The cohort begins {cohort.startsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Course access is ready now for orientation; live links only appear when a session is active.</p></div></section>}

      <section className="grid gap-5 md:grid-cols-3"><div className="rounded-[16px] border border-[#E3E8F4] bg-white p-5"><CalendarDays className="text-[#1C4ED1]" size={20} /><p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#77839A]">Dates</p><p className="mt-2 text-sm font-bold leading-6 text-[#040B37]">{cohort.startsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {cohort.endsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div><div className="rounded-[16px] border border-[#E3E8F4] bg-white p-5"><Users className="text-[#1C4ED1]" size={20} /><p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#77839A]">Lead instructor</p><p className="mt-2 text-sm font-bold text-[#040B37]">{cohort.leadInstructor?.name ?? "To be announced"}</p></div><div className="rounded-[16px] border border-[#E3E8F4] bg-white p-5"><BookOpen className="text-[#1C4ED1]" size={20} /><p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#77839A]">Learning plan</p><p className="mt-2 text-sm font-bold text-[#040B37]">{courses.length} course{courses.length === 1 ? "" : "s"} · {cohort.program.estimatedDurationWeeks} weeks</p></div></section>

      <CohortMentorshipSection mentorship={mentorship} cohort={{ id: cohort.id, slug: cohort.slug, title: cohort.title, programTitle: cohort.program.title }} />

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-8"><div className="space-y-5"><div><h2 className="text-2xl font-black tracking-[-0.035em] text-[#040B37]">Program courses</h2><p className="mt-1 text-sm text-[#77839A]">Work through the required learning in sequence.</p></div>{courses.map((course) => (
          <article key={course.id} className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-sm font-black text-[#1C4ED1]">{course.position}</div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-[#040B37]">{course.title}</h3>{course.required && <span className="rounded-full bg-[#F4F6FB] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#667085]">Required</span>}</div><p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">{course.shortDesc ?? "Course details will appear as the teaching team publishes them."}</p></div></div><Link href={course.nextLessonId && course.enrolled ? `/courses/${course.slug}/watch/${course.nextLessonId}` : `/courses/${course.slug}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-black text-[#1C4ED1]">{course.progress > 0 ? "Continue" : "Start course"}<ArrowRight size={15} /></Link></div><div className="mt-5"><div className="flex items-center justify-between text-xs font-bold text-[#77839A]"><span>{course.completedLessons} of {course.lessonCount} lessons</span><span>{course.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EDF1F7]"><div className="h-full rounded-full bg-[#1C4ED1]" style={{ width: `${course.progress}%` }} /></div>{course.nextLessonTitle && <p className="mt-3 text-xs font-semibold text-[#526078]">Next: {course.nextLessonTitle}</p>}</div></article>
        ))}</div>
        <div className="space-y-5"><div><h2 className="text-2xl font-black tracking-[-0.035em] text-[#040B37]">Applied projects</h2><p className="mt-1 text-sm text-[#77839A]">Submit evidence, receive rubric feedback, and preserve every revision.</p></div>{cohort.projects.length ? cohort.projects.map((project) => { const submission = project.submissions[0]; return <Link key={project.id} href={`/dashboard/cohorts/${cohort.slug}/projects/${project.id}`} className="group block rounded-[18px] border border-[#E3E8F4] bg-white p-5 transition hover:border-[#1C4ED1]/40 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1C4ED1]"><ClipboardCheck size={19} /></div><div><h3 className="text-lg font-black text-[#040B37]">{project.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#667085]">{project.brief}</p></div></div><ArrowRight className="shrink-0 text-[#9CA3AF] transition group-hover:translate-x-1 group-hover:text-[#1C4ED1]" size={18} /></div><div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold text-[#667085]"><span className="rounded-full bg-[#F4F6FB] px-3 py-1.5 capitalize">{submission?.status.toLowerCase().replaceAll("_", " ") ?? "Not started"}</span><span>{project._count.rubricCriteria} rubric criteria</span>{project.dueAt && <span>Due {project.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}</div></Link>; }) : <div className="rounded-[18px] border border-dashed border-[#D5DDEA] bg-white p-8 text-sm text-[#77839A]">No applied project has been published for this cohort yet.</div>}</div></div>

        <aside className="space-y-5"><section className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><div className="flex items-center gap-2"><CalendarDays className="text-[#1C4ED1]" size={19} /><h2 className="font-black text-[#040B37]">Upcoming schedule</h2></div>{schedule.length ? <div className="mt-5 space-y-4">{schedule.map((event) => <div key={event.id} className="border-l-2 border-[#1C4ED1] pl-4"><p className="text-xs font-black uppercase tracking-[0.1em] text-[#77839A]">{event.type.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 text-sm font-bold text-[#040B37]">{event.title}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{formatDateTime(event.startsAt, event.timezone)}</p>{event.status === "LIVE" && event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-black text-[#1C4ED1]">Join live session</a>}</div>)}</div> : <p className="mt-4 text-sm leading-6 text-[#77839A]">No sessions have been scheduled yet. Published cohort events will appear here and in your main schedule.</p>}</section>
        <section className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><div className="flex items-center gap-2"><Megaphone className="text-[#1C4ED1]" size={19} /><h2 className="font-black text-[#040B37]">Announcements</h2></div>{announcements.length ? <div className="mt-5 space-y-4">{announcements.map((item) => <div key={item.id} className="rounded-xl bg-[#F8FAFF] p-4"><p className="text-sm font-black text-[#040B37]">{item.title}</p><p className="mt-2 text-xs leading-5 text-[#667085]">{item.body}</p>{item.linkUrl && <Link href={item.linkUrl} className="mt-2 inline-flex text-xs font-black text-[#1C4ED1]">Open update</Link>}</div>)}</div> : <p className="mt-4 text-sm leading-6 text-[#77839A]">No cohort announcements yet.</p>}</section>
        {weeklySchedule.length > 0 && <section className="rounded-[18px] border border-[#E3E8F4] bg-white p-5"><h2 className="font-black text-[#040B37]">Weekly rhythm</h2><ul className="mt-4 space-y-3">{weeklySchedule.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#526078]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></section>}
        {graduationRules.length > 0 && <section className="rounded-[18px] bg-[#040B37] p-5 text-white"><h2 className="font-black">Completion requirements</h2><ul className="mt-4 space-y-3">{graduationRules.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-[#C7D4F5]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8FB0FF]" />{item}</li>)}</ul></section>}</aside>
      </section>
    </main>
  );
}
