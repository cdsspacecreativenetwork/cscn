"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { resendVerificationEmailAction } from "@/actions/mail";
import { toast } from "sonner";

export const VerificationBanner = () => {
  const { data: session, status } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Only show if authenticated and NOT verified
  const isVerified = !!session?.user?.emailVerified;
  const showBanner = status === "authenticated" && !isVerified;

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setIsResending(true);
    try {
      const result = await resendVerificationEmailAction();
      if (result.success) {
        setIsSent(true);
        setCooldown(60); // 60s cooldown
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimeout(() => setIsSent(false), 5000);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="overflow-hidden border-b border-[#FFE4D1] bg-[#FFF4ED] motion-reduce:transition-none"
        >
          <div className="mx-auto max-w-[1600px] px-[clamp(16px,2.78vw,48px)] py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FF7E21]/10">
                  <AlertCircle size={18} className="text-[#FF7E21]" />
                </div>
                <p className="text-xs font-medium leading-5 text-[#7A3E15] sm:text-sm">
                  Your email is not verified yet. Please verify to unlock certificates and full course features.
                </p>
              </div>

              <button
                disabled={isResending || isSent || cooldown > 0}
                onClick={handleResend}
                className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm
                  ${isSent 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : "bg-[#FF7E21] text-white hover:bg-[#E66D1A] shadow-sm"}
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {isResending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="hidden sm:inline">Resending...</span>
                  </>
                ) : isSent ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span className="hidden sm:inline">Link Sent!</span>
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <span className="hidden sm:inline">Resend in </span>{cooldown}s
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span className="hidden sm:inline">Resend Verification Link</span>
                    <span className="sm:hidden">Resend</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
