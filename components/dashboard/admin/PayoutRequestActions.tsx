"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle, Banknote } from "lucide-react";
import { toast } from "sonner";

import {
  approvePayoutRequestAction,
  markPayoutPaidAction,
  rejectPayoutRequestAction,
} from "@/actions/billing";

interface Props {
  requestId: string;
  status: string;
}

export function PayoutRequestActions({ requestId, status }: Props) {
  const [pending, startTransition] = useTransition();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  const run = (action: "approve" | "reject" | "paid") => {
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approvePayoutRequestAction(requestId)
          : action === "reject"
            ? await rejectPayoutRequestAction(requestId, note)
            : await markPayoutPaidAction(requestId);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(action === "paid" ? "Payout marked paid." : action === "approve" ? "Payout approved." : "Payout rejected.");
      setNote("");
      setNoteOpen(false);
    });
  };

  if (status === "PAID" || status === "REJECTED" || status === "CANCELLED") return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "REQUESTED" && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run("approve")}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Approve
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setNoteOpen((value) => !value)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-red-200 bg-red-50 px-3 text-[11px] font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle size={13} /> Reject
            </button>
          </>
        )}
        {status === "APPROVED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("paid")}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#1C4ED1]/20 bg-[#1C4ED1]/5 px-3 text-[11px] font-black text-[#1C4ED1] transition hover:bg-[#1C4ED1]/10 disabled:opacity-50"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Banknote size={13} />} Mark paid
          </button>
        )}
      </div>
      {noteOpen && (
        <div className="rounded-[10px] border border-[#E3E8F4] bg-[#F8FAFF] p-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Optional rejection note"
            className="w-full resize-none rounded-[8px] border border-[#E3E8F4] bg-white px-3 py-2 text-[12px] font-semibold text-[#040B37] outline-none focus:border-[#1C4ED1]"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setNoteOpen(false)} className="text-[11px] font-bold text-[#9CA3AF]">Cancel</button>
            <button type="button" disabled={pending} onClick={() => run("reject")} className="rounded-[8px] bg-red-600 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50">
              Reject payout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
