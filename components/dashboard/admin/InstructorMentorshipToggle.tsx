"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { toggleInstructorMentorshipAction } from "@/actions/admin-instructors";

type InstructorMentorshipToggleProps = {
  instructorId: string;
  enabled: boolean;
  disabled?: boolean;
};

export function InstructorMentorshipToggle({ instructorId, enabled, disabled }: InstructorMentorshipToggleProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleInstructorMentorshipAction(instructorId, !enabled);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          toast.success("success" in result ? result.success : "Mentorship updated.");
        });
      }}
      className={`relative flex h-[28px] w-[50px] shrink-0 items-center rounded-full p-[3px] transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
        enabled ? "bg-[#1C4ED1]" : "bg-[#DFE1E7]"
      }`}
      aria-label={enabled ? "Remove mentorship eligibility" : "Approve mentorship eligibility"}
      title={enabled ? "Remove mentorship eligibility" : "Approve mentorship eligibility"}
    >
      <span
        className={`h-[22px] w-[22px] rounded-full bg-white shadow transition ${
          enabled ? "translate-x-[22px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
