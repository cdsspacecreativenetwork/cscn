"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { LoginSchema } from "@/schemas";
import { login } from "@/actions/login";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Social } from "@/components/auth/Social";

const fieldGroupClass = "space-y-2";
const labelClass = "block text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]";
const inputClass = "w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#4B5563] placeholder:text-[#4B5563] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all disabled:bg-[#1C4ED1]/40 disabled:text-white disabled:placeholder:text-white/80 disabled:cursor-not-allowed";
const inputWithIconClass = `${inputClass} pr-14`;
const subtextClass = "text-[#4B5563] font-medium";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");

    startTransition(() => {
      login(values).then((data) => {
        if (data?.error) {
          setError(data.error);
        }
        if (data?.twoFactor) {
          setShowTwoFactor(true);
        }
      });
    });
  };

  return (
    <AuthLayout 
      title={showTwoFactor ? "Verify your identity" : "Welcome back"} 
      subtitle={showTwoFactor ? "Two-Factor Verification required" : "Continue where you left off"}
      sidebarTitle="Your Knowledge Awaits You."
      sidebarSubtitle="Pick up right where you left off. Your progress, your courses, your community all here."
    >
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 xl:space-y-10"
      >
        <div className="space-y-6">
          {!showTwoFactor ? (
            <>
              <div className={fieldGroupClass}>
                <label className={labelClass}>Email address</label>
                <input
                  {...form.register("email")}
                  disabled={isPending}
                  type="email"
                  placeholder="Enter your email"
                  className={inputClass}
                />
                {form.formState.errors.email && (
                  <p className="text-[12px] text-[#FF383C] font-medium ml-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className={fieldGroupClass}>
                <div className="flex justify-between items-center">
                  <label className={labelClass}>Password</label>
                </div>
                <div className="relative">
                  <input
                    {...form.register("password")}
                    disabled={isPending}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={inputWithIconClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-[12px] text-[#FF383C] font-medium ml-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-[#1C4ED1] font-medium text-[16px] xl:text-[18px] tracking-[-0.18px]">
                  Forgot password?
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className={fieldGroupClass}>
                <label className={labelClass}>Two-Factor Verification Code</label>
                <input
                  {...form.register("code")}
                  disabled={isPending}
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN"
                  className="w-full text-center tracking-widest text-[20px] font-black h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#4B5563] placeholder:text-[13px] placeholder:font-bold placeholder:tracking-normal placeholder:text-[#4B5563] focus:border-[#1C4ED1] outline-none transition-all disabled:bg-[#1C4ED1]/40 disabled:text-white disabled:placeholder:text-white/80 disabled:cursor-not-allowed font-mono"
                />
                {form.formState.errors.code && (
                  <p className="text-[12px] text-[#FF383C] font-medium ml-1">
                    {form.formState.errors.code.message}
                  </p>
                )}
                <p className="text-[12px] font-medium text-[#4B5563] mt-2 text-center">
                  Please enter the code generated by your authenticator app.
                </p>
              </div>

              <div className="flex justify-start">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowTwoFactor(false);
                    form.setValue("code", "");
                    setError("");
                  }}
                  className="text-[#1C4ED1] font-semibold text-[14px] xl:text-[16px] hover:underline"
                >
                  Back to standard login
                </button>
              </div>
            </>
          )}
        </div>

        <FormError message={error} />

        <div className="flex flex-col items-center gap-8 xl:gap-[40px]">
          <button 
            type="submit"
            disabled={isPending}
            className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden group disabled:cursor-not-allowed"
          >
            <div className="w-full h-full flex items-center justify-center rounded-full transition-all duration-300" style={{ backgroundImage: "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)", opacity: isPending ? 0.4 : 1 }}>
              <span className="text-white text-[16px] xl:text-[18px] font-medium tracking-[-0.18px] flex items-center gap-2">
                {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                {showTwoFactor ? "Verify Code" : "Sign In"}
              </span>
            </div>
          </button>

          {!showTwoFactor && (
            <>
              <div className="w-full flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-[#E3E8F4]" />
                <span className="text-[#9CA3AF] text-[16px] xl:text-[18px] font-medium tracking-[-0.36px]">Or</span>
                <div className="flex-1 h-[1px] bg-[#E3E8F4]" />
              </div>

              <Social />

              <div className="flex items-center gap-2 text-[16px] xl:text-[18px] tracking-[-0.18px]">
                <span className={subtextClass}>New to CSCN?</span>
                <Link href="/signup" className="text-[#1C4ED1] font-semibold">
                  Create a free account
                </Link>
              </div>
            </>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
