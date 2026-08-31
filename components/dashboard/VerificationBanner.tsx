"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { resendVerificationEmailAction } from "@/actions/mail";
import { toast } from "sonner";
import BoostApplicationModal from "@/components/dashboard/instructor/BoostApplicationModal";

export const VerificationBanner = () => {
  const { data: session, status } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);

  if (status !== "authenticated" || !session?.user) return null;

  const role = session.user.role;
  const isInstructor = role === "INSTRUCTOR" || role === "ADMIN" || role === "SUPER_ADMIN";
  const isEmailVerified = !!session.user.emailVerified;

  // Show instructor pending banner if role is INSTRUCTOR (or pending verification)
  const isPendingInstructor = isInstructor;

  // If user is verified and not an instructor pending approval, don't render banner
  if (isEmailVerified && !isPendingInstructor) return null;

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
    <>
      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={isPendingInstructor ? "bg-[#EEF3FF] border-b border-[#D4E2FF] overflow-hidden font-jakarta" : "bg-[#FFF4ED] border-b border-[#FFE4D1] overflow-hidden font-jakarta"}
        >
          <div className="max-w-[1600px] mx-auto px-[clamp(16px,2.78vw,48px)] py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={isPendingInstructor ? "w-8 h-8 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center shrink-0" : "w-8 h-8 rounded-full bg-[#FF7E21]/10 flex items-center justify-center shrink-0"}>
                  {isPendingInstructor ? (
                    <Rocket size={18} className="text-[#1C4ED1]" />
                  ) : (
                    <AlertCircle size={18} className="text-[#FF7E21]" />
                  )}
                </div>
                <div>
                  <p className={isPendingInstructor ? "text-[14px] font-bold text-[#040B37]" : "text-[14px] font-medium text-[#7A3E15]"}>
                    {isPendingInstructor
                      ? "Your instructor profile is pending approval."
                      : "Your email is not verified yet. Please verify to unlock certificates and full course features."}
                  </p>
                  {isPendingInstructor && (
                    <p className="text-[12px] font-medium text-[#4B5563] mt-0.5">
                      Fast-track review by adding your CV, demo video, or course pitch.
                    </p>
                  )}
                </div>
              </div>

              {isPendingInstructor ? (
                <button
                  onClick={() => setIsBoostModalOpen(true)}
                  className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-[8px] text-[13px] font-bold bg-[#1C4ED1] text-white hover:bg-[#163BB1] transition-all shadow-sm shrink-0 active:scale-[0.98]"
                >
                  <Rocket size={14} />
                  Boost Application
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {isPendingInstructor && (
        <BoostApplicationModal
          isOpen={isBoostModalOpen}
          onClose={() => setIsBoostModalOpen(false)}
        />
      )}
    </>
  );
};
