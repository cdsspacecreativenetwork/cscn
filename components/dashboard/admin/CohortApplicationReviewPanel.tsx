"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { reviewCohortApplicationAction } from "@/actions/admin-cohort-applications";
import type { ReviewDecision } from "@/lib/cohort-admission-decisions";

const decisions: Array<{ value: ReviewDecision; label: string; tone: string }> = [
  { value: "UNDER_REVIEW", label: "Start review", tone: "border-blue-200 text-blue-700 hover:bg-blue-50" },
  { value: "ACCEPTED", label: "Accept", tone: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
  { value: "WAITLISTED", label: "Waitlist", tone: "border-amber-200 text-amber-700 hover:bg-amber-50" },
  { value: "DECLINED", label: "Decline", tone: "border-red-200 text-red-700 hover:bg-red-50" },
];

export function CohortApplicationReviewPanel({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isTerminal = currentStatus === "ACCEPTED" || currentStatus === "DECLINED";

  function submit() {
    if (!decision) return;
    setMessage(null);
    startTransition(async () => {
      const result = await reviewCohortApplicationAction(applicationId, decision, note);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(result.membershipCreated ? "Accepted and learner membership activated." : `Application moved to ${result.status.toLowerCase().replaceAll("_", " ")}.`);
      setDecision(null);
      setNote("");
      router.refresh();
    });
  }

  if (isTerminal) {
    return <div className="rounded-xl bg-[#F4F6FB] p-4 text-sm font-semibold text-[#526078]">This is a terminal decision. Changes require a separate admissions override workflow.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {decisions.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setDecision(item.value)}
            disabled={pending || (currentStatus === "UNDER_REVIEW" && item.value === "UNDER_REVIEW")}
            className={`rounded-[10px] border px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${decision === item.value ? "ring-2 ring-[#1C4ED1]/30" : ""} ${item.tone}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="review-note" className="text-xs font-black uppercase tracking-[0.12em] text-[#77839A]">Internal review note</label>
        <textarea
          id="review-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Record evidence for this decision. Required for waitlist and decline."
          className="mt-2 w-full rounded-xl border border-[#DCE3F0] bg-white px-4 py-3 text-sm leading-6 text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
        />
      </div>
      <button
        type="button"
        disabled={!decision || pending}
        onClick={submit}
        className="w-full rounded-[10px] bg-[#040B37] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#101b52] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Saving decision…" : decision ? `Confirm ${decision.toLowerCase().replaceAll("_", " ")}` : "Choose a decision"}
      </button>
      {message && <p className="text-sm font-semibold text-[#526078]" role="status">{message}</p>}
    </div>
  );
}
