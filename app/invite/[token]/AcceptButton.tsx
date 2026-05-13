"use client";

import { useTransition } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { claimInvite } from "@/actions/invite";

export function AcceptButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      await claimInvite(token);
    });
  };

  return (
    <button
      onClick={handleAccept}
      disabled={isPending}
      className="w-full h-[52px] flex items-center justify-center gap-2 bg-[#1C4ED1] hover:bg-[#163BB1] text-white rounded-[12px] text-[15px] font-semibold transition-all disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <CheckCircle size={18} />
      )}
      {isPending ? "Accepting…" : "Accept Invite"}
    </button>
  );
}
