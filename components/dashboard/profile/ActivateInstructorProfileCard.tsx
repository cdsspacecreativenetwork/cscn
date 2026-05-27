"use client";

import { useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import { activateInstructorProfileAction } from "@/actions/instructor-verification";

export function ActivateInstructorProfileCard() {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-5 rounded-[24px] border border-[#D7E3FF] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EEF4FF] text-[#1C4ED1]">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-[#040B37]">Activate instructor profile</h2>
          <p className="mt-2 max-w-2xl text-[14px] font-medium leading-6 text-[#667085]">
            Admins can create courses without becoming instructors. Activate this only when you want your own public instructor profile and creator checklist.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        rounded="[10px]"
        loading={isPending}
        className="shrink-0"
        onClick={() => {
          startTransition(async () => {
            const result = await activateInstructorProfileAction();
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            toast.success(result.success);
          });
        }}
      >
        Activate profile
      </Button>
    </section>
  );
}
