"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { reviewProjectSubmissionAction } from "@/actions/admin-project-reviews";

type Criterion = { id: string; title: string; description: string; maxScore: number };

export function ProjectReviewPanel({
  submissionId,
  criteria,
  canPublish,
}: {
  submissionId: string;
  criteria: Criterion[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [scores, setScores] = useState(() => criteria.map((item) => ({ criterionId: item.id, score: 0, note: "" })));
  const [overallNote, setOverallNote] = useState("");
  const [publishToShowcase, setPublishToShowcase] = useState(canPublish);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(decision: "APPROVED" | "CHANGES_REQUESTED") {
    setMessage(null);
    startTransition(async () => {
      const result = await reviewProjectSubmissionAction(submissionId, {
        decision,
        overallNote,
        scores,
        publishToShowcase: decision === "APPROVED" && publishToShowcase,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(decision === "APPROVED" ? "Approved and credential issued." : "Revision requested.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {criteria.map((criterion, index) => (
          <div key={criterion.id} className="rounded-xl border border-[#E3E8F4] p-4">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-black text-[#040B37]">{criterion.title}</p><p className="mt-1 text-xs leading-5 text-[#77839A]">{criterion.description}</p></div>
              <label className="shrink-0 text-xs font-bold text-[#526078]">
                <span className="sr-only">Score for {criterion.title}</span>
                <input type="number" min={0} max={criterion.maxScore} value={scores[index].score} onChange={(event) => setScores((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, score: Number(event.target.value) } : item))} className="h-10 w-16 rounded-lg border border-[#D8E0EF] px-2 text-center text-sm font-black outline-none focus:border-[#1C4ED1]" /> / {criterion.maxScore}
              </label>
            </div>
            <input value={scores[index].note} onChange={(event) => setScores((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))} placeholder="Criterion feedback (optional)" className="mt-3 h-10 w-full rounded-lg border border-[#D8E0EF] px-3 text-sm outline-none focus:border-[#1C4ED1]" />
          </div>
        ))}
      </div>
      <div><label htmlFor="overall-note" className="text-xs font-black uppercase tracking-[0.11em] text-[#77839A]">Overall feedback</label><textarea id="overall-note" value={overallNote} onChange={(event) => setOverallNote(event.target.value)} rows={6} maxLength={3000} placeholder="Explain the decision and give the learner specific next steps." className="mt-2 w-full rounded-xl border border-[#D8E0EF] p-4 text-sm leading-6 outline-none focus:border-[#1C4ED1]" /></div>
      <label className={`flex items-start gap-3 rounded-xl border p-4 ${canPublish ? "border-[#D8E0EF]" : "border-[#E7E9EF] bg-[#F8FAFC]"}`}><input type="checkbox" checked={publishToShowcase} disabled={!canPublish} onChange={(event) => setPublishToShowcase(event.target.checked)} className="mt-1 h-4 w-4 accent-[#1C4ED1]" /><span><span className="block text-sm font-bold text-[#040B37]">Publish approved work to the showcase</span><span className="mt-1 block text-xs leading-5 text-[#77839A]">{canPublish ? "The brief permits publication and the learner has consented." : "Unavailable because the brief or learner consent does not permit publication."}</span></span></label>
      <div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={pending} onClick={() => submit("CHANGES_REQUESTED")} className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#D8E0EF] px-4 py-3 text-sm font-black text-[#040B37] disabled:opacity-50"><RotateCcw size={16} />Request revision</button><button type="button" disabled={pending} onClick={() => submit("APPROVED")} className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#1C4ED1] px-4 py-3 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={16} />Approve & issue credential</button></div>
      {message && <p role="status" className="text-sm font-semibold text-[#526078]">{message}</p>}
    </div>
  );
}
