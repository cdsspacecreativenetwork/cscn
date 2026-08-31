import Link from "next/link";
import { ArrowRight, GraduationCap, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getInstructorCohorts } from "@/lib/services/cohort-management.service";

export const metadata = { title: "Teaching cohorts | CSCN" };

export default async function InstructorCohortsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const cohorts = await getInstructorCohorts(session.user.id);
  return <main className="mx-auto max-w-[1480px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta"><header><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1C4ED1]">Instructor studio</p><h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#071535]">Teaching cohorts</h1><p className="mt-2 text-sm text-[#6F7C92]">Run classes, assignments, attendance, feedback, and peer learning for cohorts assigned to you.</p></header><section className="grid gap-4 lg:grid-cols-2">{cohorts.map(({ cohort, role }) => <Link key={cohort.id} href={`/dashboard/instructor/cohorts/${cohort.slug}`} className="group rounded-[20px] border border-[#DFE5F0] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#9FB8F5] hover:shadow-lg"><div className="flex items-start justify-between"><GraduationCap className="text-[#1C4ED1]"/><ArrowRight className="text-[#A3ADBC] transition group-hover:translate-x-1 group-hover:text-[#1C4ED1]" size={18}/></div><p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8390A5]">{role.toLowerCase().replaceAll("_", " ")} · {cohort.status.toLowerCase().replaceAll("_", " ")}</p><h2 className="mt-2 text-xl font-black text-[#071535]">{cohort.title}</h2><p className="mt-1 text-sm font-semibold text-[#64718A]">{cohort.program.title}</p><div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-[#526078]"><span className="flex items-center gap-1"><UsersRound size={14}/>{cohort._count.memberships} learners</span><span>{cohort._count.projects} assignments</span><span>{cohort._count.scheduleEvents} events</span></div></Link>)}{!cohorts.length ? <div className="rounded-[20px] border border-dashed border-[#C9D3E3] p-12 text-center text-sm font-semibold text-[#7B879D] lg:col-span-2">You have not been assigned to an active cohort.</div> : null}</section></main>;
}
