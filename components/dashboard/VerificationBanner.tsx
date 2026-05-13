"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { resendVerificationEmailAction } from "@/actions/mail";

export const VerificationBanner = () => {
  const { data: session, status } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[#FFF4ED] border-b border-[#FFE4D1] overflow-hidden"
        >
          <div className="max-w-[1600px] mx-auto px-[clamp(16px,2.78vw,48px)] py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF7E21]/10 flex items-center justify-center shrink-0">
                  <AlertCircle size={18} className="text-[#FF7E21]" />
                </div>
                <p className="text-[14px] font-medium text-[#7A3E15]">
                  Your email is not verified yet. Please verify to unlock certificates and full course features.
                </p>
              </div>

              <button
                disabled={isResending || isSent || cooldown > 0}
                onClick={handleResend}
                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold transition-all shrink-0
                  ${isSent 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : "bg-[#FF7E21] text-white hover:bg-[#E66D1A] shadow-sm"}
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {isResending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Resending...
                  </>
                ) : isSent ? (
                  <>
                    <CheckCircle2 size={16} />
                    Link Sent!
                  </>
                ) : cooldown > 0 ? (
                  <>
                    Resend in {cooldown}s
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Resend Verification Link
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
