"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, PauseCircle, PlayCircle, UsersRound } from "lucide-react";

import { assignCohortMentorAction, setCohortMentorAssignmentStatusAction } from "@/actions/admin-cohort-mentors";

type Data = {
  cohorts: Array<{ id: string; title: string; slug: string; startsAt: string | Date; program: { title: string } }>;
  mentors: Array<{ id: string; name: string | null; email: string; headline: string | null; mentorshipTopics: unknown; mentorAvailabilities: Array<{ id: string }> }>;
  assignments: Array<{ id: string; status: "ACTIVE" | "PAUSED"; role: string; focusAreas: unknown; assignedAt: string | Date; cohort: { id: string; title: string; slug: string; program: { title: string } }; mentor: { id: string; name: string | null; email: string; headline: string | null } }>;
};

export function CohortMentorAssignments({ data }: { data: Data }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function assign(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await assignCohortMentorAction(formData);
      setMessage(result.success ? "Cohort mentor assigned." : result.error);
      if (result.success) router.refresh();
    });
  }

  function toggle(id: string, status: "ACTIVE" | "PAUSED") {
    startTransition(async () => {
      await setCohortMentorAssignmentStatusAction(id, status);
      router.refresh();
    });
  }

  return <section className="rounded-[22px] border border-[#D8E0EF] bg-white p-5 shadow-sm sm:p-7">
    <div className="flex items-start gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1C4ED1]"><UsersRound size={21} /></div><div><h2 className="text-[22px] font-black tracking-[-0.04em] text-[#040B37]">Cohort mentor assignments</h2><p className="mt-1 text-[13px] font-semibold leading-6 text-[#77839A]">Assign an approved mentor to a specific cohort. Only active assignments appear in the learner workspace and can receive contextual bookings.</p></div></div>
    <form action={assign} className="mt-6 grid gap-3 rounded-[16px] bg-[#F7F9FD] p-4 lg:grid-cols-[1fr_1fr_180px_1.2fr_auto]">
      <select name="cohortId" required className="h-11 rounded-xl border border-[#D8E0EF] bg-white px-3 text-sm"><option value="">Choose cohort</option>{data.cohorts.map((item) => <option key={item.id} value={item.id}>{item.program.title} — {item.title}</option>)}</select>
      <select name="mentorId" required className="h-11 rounded-xl border border-[#D8E0EF] bg-white px-3 text-sm"><option value="">Choose approved mentor</option>{data.mentors.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.email} · {item.mentorAvailabilities.length} windows</option>)}</select>
      <input name="role" defaultValue="Cohort mentor" maxLength={80} className="h-11 rounded-xl border border-[#D8E0EF] bg-white px-3 text-sm" aria-label="Mentor role" />
      <input name="focusAreas" required placeholder="Portfolio reviews, project feedback" className="h-11 rounded-xl border border-[#D8E0EF] bg-white px-3 text-sm" aria-label="Focus areas" />
      <button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1C4ED1] px-5 text-sm font-black text-white disabled:opacity-50"><Link2 size={15} />Assign</button>
    </form>
    {message && <p role="status" className="mt-3 text-sm font-semibold text-[#526078]">{message}</p>}
    <div className="mt-6 grid gap-3">{data.assignments.length ? data.assignments.map((item) => {
      const focusAreas = Array.isArray(item.focusAreas) ? item.focusAreas.filter((area): area is string => typeof area === "string") : [];
      return <article key={item.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E3E8F4] p-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-black text-[#040B37]">{item.mentor.name ?? item.mentor.email}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${item.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.status.toLowerCase()}</span></div><p className="mt-1 text-sm font-semibold text-[#526078]">{item.cohort.program.title} · {item.cohort.title}</p><p className="mt-2 text-xs text-[#77839A]">{item.role} · {focusAreas.join(" · ")}</p></div><button type="button" disabled={pending} onClick={() => toggle(item.id, item.status === "ACTIVE" ? "PAUSED" : "ACTIVE")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8E0EF] px-4 py-2.5 text-xs font-black text-[#040B37]">{item.status === "ACTIVE" ? <PauseCircle size={15} /> : <PlayCircle size={15} />}{item.status === "ACTIVE" ? "Pause assignment" : "Resume assignment"}</button></article>;
    }) : <div className="rounded-[16px] border border-dashed border-[#D8E0EF] p-8 text-center text-sm font-semibold text-[#77839A]">No cohort mentor assignments yet.</div>}</div>
  </section>;
}
