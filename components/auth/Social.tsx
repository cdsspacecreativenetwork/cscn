"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

type SocialProps = {
  callbackUrl?: string;
};

export const Social = ({ callbackUrl: callbackUrlOverride }: SocialProps = {}) => {
  const searchParams = useSearchParams();
  const callbackUrl = callbackUrlOverride || searchParams.get("callbackUrl") || DEFAULT_LOGIN_REDIRECT;

  const onClick = (provider: "google" | "linkedin") => {
    signIn(provider, {
      callbackUrl,
    });
  };

  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10">
      {/* Google Auth Tile (Figma Spec Node #8732:4512) */}
      <button 
        type="button"
        onClick={() => onClick("google")}
        className="w-14 h-14 sm:w-16 sm:h-16 bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-all cursor-pointer shrink-0"
        aria-label="Sign in with Google"
      >
        <Image src="/assets/dashboard/flat-color-icons_google.svg" alt="Google" width={28} height={28} unoptimized />
      </button>

      {/* LinkedIn Auth Tile (Figma Spec Node #8732:4520) */}
      <button 
        type="button"
        onClick={() => onClick("linkedin")}
        className="w-14 h-14 sm:w-16 sm:h-16 bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-all cursor-pointer shrink-0"
        aria-label="Sign in with LinkedIn"
      >
        <div className="w-7 h-7 flex items-center justify-center bg-[#0A66C2] rounded-[4px] text-white font-bold text-[18px]">in</div>
      </button>
    </div>
  );
};
