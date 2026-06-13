"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  approveRefundRequestAction,
  markRefundProcessedAction,
  rejectRefundRequestAction,
} from "@/actions/billing";

type Props = {
  refundId: string;
  status: string;
};

export function RefundRequestActions({ refundId, status }: Props) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");

  const canApprove = status === "REQUESTED";
  const canReject = status === "REQUESTED" || status === "APPROVED";
  const canProcess = status === "APPROVED" || status === "PROCESSING";

  const run = (action: "approve" | "reject" | "processed") => {
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveRefundRequestAction(refundId)
          : action === "reject"
            ? await rejectRefundRequestAction(refundId, note)
            : await markRefundProcessedAction(refundId, reference);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        action === "approve"
          ? "Refund approved."
          : action === "reject"
            ? "Refund rejected."
            : "Refund marked processed."
      );
      setShowReject(false);
      setNote("");
      setReference("");
    });
  };

  return (
    <div className="mt-2 flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {canApprove && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("approve")}
            className="rounded-[8px] bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {canProcess && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("processed")}
            className="rounded-[8px] bg-[#1C4ED1] px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
          >
            Mark processed
          </button>
        )}
        {canReject && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowReject((value) => !value)}
            className="rounded-[8px] border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600 disabled:opacity-50"
          >
            Reject
          </button>
        )}
      </div>
      {canProcess && (
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Provider reference optional"
          className="h-9 w-full max-w-[220px] rounded-[8px] border border-[#D8E0EF] bg-white px-3 text-[11px] font-bold text-[#040B37] outline-none focus:border-[#1C4ED1]"
        />
      )}
      {showReject && (
        <div className="flex w-full max-w-[260px] flex-col gap-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional rejection note"
            className="min-h-[70px] rounded-[8px] border border-[#D8E0EF] bg-white px-3 py-2 text-[12px] font-semibold text-[#040B37] outline-none focus:border-[#1C4ED1]"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => run("reject")}
            className="rounded-[8px] bg-red-600 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
          >
            Confirm rejection
          </button>
        </div>
      )}
    </div>
  );
}
