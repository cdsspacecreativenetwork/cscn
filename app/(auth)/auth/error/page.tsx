"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";

const errorMessages: Record<string, { title: string; description: string }> = {
  OAuthAccountNotLinked: {
    title: "Account already exists",
    description:
      "An account with this email is already registered using a different sign-in method. Please sign in using your original method.",
  },
  OAuthCallbackError: {
    title: "Sign-in failed",
    description:
      "There was a problem completing sign-in with your provider. Please try again.",
  },
  AccessDenied: {
    title: "Access denied",
    description:
      "You do not have permission to sign in. Please contact support if you believe this is a mistake.",
  },
  Configuration: {
    title: "Server error",
    description:
      "There is a configuration issue on our end. Please try again later or contact support.",
  },
};

const defaultError = {
  title: "Something went wrong",
  description: "An unexpected error occurred during sign-in. Please try again.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "";
  const { title, description } = errorMessages[errorCode] ?? defaultError;

  return (
    <AuthLayout
      title={title}
      subtitle="Authentication error"
      sidebarTitle="Secure, trusted access."
      sidebarSubtitle="Your learning journey is protected. We take account security seriously."
    >
      <div className="space-y-8">
        <div className="flex items-start gap-4 p-5 rounded-[16px] bg-[#FFF4F4] border border-[#FFD5D5]">
          <AlertTriangle className="text-[#FF383C] mt-0.5 shrink-0" size={22} />
          <p className="text-[15px] text-[#4B5563] leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/signin"
            className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden flex items-center justify-center"
          >
            <div
              className="w-full h-full flex items-center justify-center rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)",
              }}
            >
              <span className="text-white text-[16px] xl:text-[18px] font-medium tracking-[-0.18px]">
                Back to Sign In
              </span>
            </div>
          </Link>

          <Link
            href="/signup"
            className="w-full h-[56px] flex items-center justify-center rounded-full border border-[#E3E8F4] bg-[#F4F6FB] text-[#4B5563] text-[16px] xl:text-[18px] font-medium tracking-[-0.18px] hover:border-[#1C4ED1] hover:text-[#1C4ED1] transition-all"
          >
            Create a new account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
