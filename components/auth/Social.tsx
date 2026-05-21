"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const Social = () => {
  const onClick = (provider: "google" | "apple" | "linkedin") => {
    signIn(provider, {
      callbackUrl: DEFAULT_LOGIN_REDIRECT,
    });
  };

  return (
    <div className="flex gap-6 xl:gap-[40px]">
      <button 
        type="button"
        onClick={() => onClick("google")}
        className="w-[56px] h-[56px] xl:w-[64px] xl:h-[64px] bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
      >
        <Image src="/assets/dashboard/flat-color-icons_google.svg" alt="Google" width={28} height={28} unoptimized />
      </button>
      <button 
        type="button"
        onClick={() => onClick("linkedin")}
        className="w-[56px] h-[56px] xl:w-[64px] xl:h-[64px] bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
      >
        <div className="w-7 h-7 flex items-center justify-center bg-[#0A66C2] rounded-[4px] text-white font-bold text-[18px]">in</div>
      </button>
      <button 
        type="button"
        onClick={() => onClick("apple")}
        className="w-[56px] h-[56px] xl:w-[64px] xl:h-[64px] bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
      >
        <Image src="/assets/dashboard/mdi_apple.svg" alt="Apple" width={28} height={28} unoptimized />
      </button>
    </div>
  );
};
