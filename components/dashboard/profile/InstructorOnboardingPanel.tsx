"use client";

import Link from "next/link";
import { useTransition } from "react";
import { AlertTriangle, CheckCircle2, Circle, ExternalLink, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import { submitInstructorVerificationAction } from "@/actions/instructor-verification";
import type { CreatorReadiness } from "@/lib/trust-gates";

type InstructorOnboardingPanelProps = {
  readiness: CreatorReadiness;
  canRequestVerification: boolean;
  verificationStatus: string;
  publicProfileStatus: string;
  publicProfileUrl: string | null;
};

const statusStyles: Record<string, string> = {
  VERIFIED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700",
  NOT_STARTED: "bg-[#F4F6FB] text-[#667085]",
};

export function InstructorOnboardingPanel({
  readiness,
  canRequestVerification,
  verificationStatus,
  publicProfileStatus,
  publicProfileUrl,
}: InstructorOnboardingPanelProps) {
  const [isPending, startTransition] = useTransition();
  const completed = readiness.items.filter((item) => item.complete).length;
  const isComplete = readiness.isProfileComplete;
  const progress = Math.round((completed / readiness.items.length) * 100);

  const requestVerification = () => {
    startTransition(async () => {
      const result = await submitInstructorVerificationAction();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
    });
  };

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#D7E3FF] bg-[#F8FAFF] shadow-sm">
      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_340px] lg:items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#1C4ED1] shadow-sm">
            <ShieldCheck size={14} />
            Instructor profile
          </div>
          <div className="space-y-2">
            <h2 className="text-[22px] font-bold tracking-tight text-[#040B37] md:text-[28px]">
              {isComplete ? "Your public instructor profile is live" : "Complete your instructor profile"}
            </h2>
            <p className="max-w-3xl text-[14px] font-medium leading-6 text-[#4B5563] md:text-[15px]">
              A complete profile can be viewed publicly. Admin verification is separate and adds the verified trust badge used for featured instructors and mentorship curation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {publicProfileUrl && (
              <Link href={publicProfileUrl} target="_blank" rel="noreferrer">
                <Button type="button" variant="primary" rounded="[10px]" rightIcon={<ExternalLink size={16} />}>
                  View public profile
                </Button>
              </Link>
            )}

            {canRequestVerification && (
              <Button
                type="button"
                variant="outline"
                rounded="[10px]"
                loading={isPending}
                leftIcon={<Send size={16} />}
                onClick={requestVerification}
              >
                Submit for verification
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">Readiness</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[verificationStatus] ?? statusStyles.NOT_STARTED}`}>
              {verificationStatus.replace("_", " ")}
            </span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-[36px] font-black leading-none text-[#040B37]">{completed}</span>
            <span className="pb-1 text-[15px] font-bold text-[#9CA3AF]">of {readiness.items.length} complete</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEF3FF]">
            <div className="h-full rounded-full bg-[#1C4ED1] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-4 text-[13px] font-semibold text-[#4B5563]">
            Public profile: <span className="text-[#040B37]">{publicProfileStatus}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-t border-[#D7E3FF] bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
        {readiness.items.map((item) => {
          const Icon = item.complete ? CheckCircle2 : item.id === "email" ? AlertTriangle : Circle;
          return (
            <Link
              key={item.id}
              href={item.href ?? "/dashboard/profile"}
              className={`rounded-[16px] border p-4 transition-colors ${
                item.complete
                  ? "border-emerald-100 bg-emerald-50/70"
                  : "border-[#E3E8F4] bg-white hover:border-[#1C4ED1]/40 hover:bg-[#F8FAFF]"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  size={18}
                  className={item.complete ? "text-emerald-600" : item.id === "email" ? "text-amber-500" : "text-[#1C4ED1]"}
                />
                <div>
                  <p className="text-[13px] font-bold text-[#040B37]">{item.label}</p>
                  <p className="mt-1 text-[12px] font-medium leading-5 text-[#6B7280]">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
