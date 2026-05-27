"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  approveInstructorVerificationAction,
  rejectInstructorVerificationAction,
} from "@/actions/instructor-verification";

type InstructorVerificationActionsProps = {
  userId: string;
  status: string;
  disabled?: boolean;
};

export function InstructorVerificationActions({ userId, status, disabled }: InstructorVerificationActionsProps) {
  const [isPending, startTransition] = useTransition();

  if (status !== "PENDING") return null;

  const runAction = (action: "approve" | "reject") => {
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveInstructorVerificationAction(userId)
          : await rejectInstructorVerificationAction(userId);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={() => runAction("approve")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Approve instructor verification"
        title="Approve verification"
      >
        <Check size={15} />
      </button>
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={() => runAction("reject")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Reject instructor verification"
        title="Reject verification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
