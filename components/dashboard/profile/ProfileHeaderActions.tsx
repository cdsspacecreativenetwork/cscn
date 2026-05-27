"use client";

import { useTransition } from "react";
import { ExternalLink, Send, ShieldCheck } from "lucide-react";
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
  const canSelfActivate = role === "SUPER_ADMIN";
  const isAdminRole = role === "ADMIN" || role === "SUPER_ADMIN";
  const showActivate = (role === "ADMIN" || role === "SUPER_ADMIN") && !instructorProfileEnabled;
  const viewDisabledReason = publicProfileUrl ? undefined : compactMissing(publicProfileMissingLabels);

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
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        rounded="[10px]"
        disabled={!publicProfileUrl}
        title={viewDisabledReason}
        rightIcon={<ExternalLink size={15} />}
        onClick={() => {
          if (publicProfileUrl) window.open(publicProfileUrl, "_blank", "noopener,noreferrer");
        }}
      >
        View public profile
      </Button>

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
        disabled={!canRequestVerification}
        title={submitDisabledReason}
        leftIcon={<Send size={15} />}
        onClick={() => {
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
