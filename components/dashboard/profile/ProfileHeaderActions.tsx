"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Send, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import {
  activateInstructorProfileAction,
  submitInstructorVerificationAction,
} from "@/actions/instructor-verification";

type ProfileHeaderActionsProps = {
  role: string;
  instructorProfileEnabled: boolean;
  publicProfileUrl: string | null;
  publicProfileMissingLabels: string[];
  verificationStatus: string;
  canRequestVerification: boolean;
};

function compactMissing(labels: string[]) {
  if (labels.length === 0) return "Complete your public instructor profile first.";
  return `Complete: ${labels.join(", ")}.`;
}

export function ProfileHeaderActions({
  role,
  instructorProfileEnabled,
  publicProfileUrl,
  publicProfileMissingLabels,
  verificationStatus,
  canRequestVerification,
}: ProfileHeaderActionsProps) {
  const [isActivating, startActivateTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [activeHelper, setActiveHelper] = useState<"profile" | "verification" | null>(null);
  const canSelfActivate = role === "SUPER_ADMIN";
  const isAdminRole = role === "ADMIN" || role === "SUPER_ADMIN";
  const showActivate = (role === "ADMIN" || role === "SUPER_ADMIN") && !instructorProfileEnabled;
  const viewDisabledReason = publicProfileUrl ? undefined : compactMissing(publicProfileMissingLabels);

  useEffect(() => {
    if (!activeHelper) return;
    const timeout = window.setTimeout(() => setActiveHelper(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [activeHelper]);

  const submitDisabledReason =
    verificationStatus === "VERIFIED"
      ? "Your instructor profile is already verified."
      : verificationStatus === "PENDING"
        ? "Your profile is already pending admin verification."
        : canRequestVerification
          ? undefined
          : "Complete your public profile and verify your email first.";

  if (!instructorProfileEnabled && !isAdminRole) return null;

  return (
    <div
      className="relative flex flex-wrap items-center gap-2"
      onMouseLeave={() => {
        if (activeHelper) setActiveHelper(null);
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        rounded="[10px]"
        aria-disabled={!publicProfileUrl}
        className={!publicProfileUrl ? "opacity-60" : undefined}
        rightIcon={<ExternalLink size={15} />}
        onClick={() => {
          if (publicProfileUrl) {
            window.open(publicProfileUrl, "_blank", "noopener,noreferrer");
            return;
          }
          setActiveHelper("profile");
        }}
      >
        View public profile
      </Button>

      {activeHelper && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(360px,calc(100vw-48px))] rounded-[18px] border border-[#E3E8F4] bg-white p-4 text-left shadow-[0_18px_60px_rgba(4,11,55,0.18)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C4ED1]/10 text-[#1C4ED1]">
              <ShieldCheck size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-black text-[#040B37]">
                {activeHelper === "profile" ? "Public profile is not ready yet" : "Verification request is not ready yet"}
              </p>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#9CA3AF]">
                {activeHelper === "profile"
                  ? "Complete these items and your profile button will open publicly."
                  : submitDisabledReason ?? "Your profile can now be submitted for review."}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {activeHelper === "verification" && submitDisabledReason && publicProfileMissingLabels.length === 0 ? (
              <div className="flex items-center gap-2 text-[12px] font-bold text-[#4B5563]">
                <XCircle size={14} className="text-amber-500" />
                {submitDisabledReason}
              </div>
            ) : publicProfileMissingLabels.length > 0 ? (
              publicProfileMissingLabels.slice(0, 6).map((label) => (
                <div key={label} className="flex items-center gap-2 text-[12px] font-bold text-[#4B5563]">
                  <XCircle size={14} className="text-amber-500" />
                  {label}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-700">
                <CheckCircle2 size={14} />
                Profile requirements completed. Refresh if the button is still disabled.
              </div>
            )}
          </div>
        </div>
      )}

      {showActivate && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          rounded="[10px]"
          loading={isActivating}
          disabled={!canSelfActivate}
          title={canSelfActivate ? undefined : "Only super admins can self-activate an instructor profile."}
          leftIcon={<ShieldCheck size={15} />}
          onClick={() => {
            startActivateTransition(async () => {
              const result = await activateInstructorProfileAction();
              if ("error" in result) {
                toast.error(result.error);
                return;
              }
              toast.success(result.success);
            });
          }}
        >
          Activate instructor
        </Button>
      )}

      <Button
        type="button"
        variant="primary"
        size="sm"
        rounded="[10px]"
        loading={isSubmitting}
        disabled={isSubmitting}
        aria-disabled={!canRequestVerification}
        className={!canRequestVerification ? "opacity-60" : undefined}
        leftIcon={<Send size={15} />}
        onClick={() => {
          if (!canRequestVerification) {
            setActiveHelper("verification");
            return;
          }
          startSubmitTransition(async () => {
            const result = await submitInstructorVerificationAction();
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            toast.success(result.success);
          });
        }}
      >
        Submit verification
      </Button>
    </div>
  );
}
