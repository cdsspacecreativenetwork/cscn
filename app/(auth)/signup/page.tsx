"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { RegisterSchema } from "@/schemas";
import { register } from "@/actions/register";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { Social } from "@/components/auth/Social";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const [agreed, setAgreed] = useState(false);

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    if (!agreed) return;
    setError("");
    setSuccess("");

    startTransition(() => {
      register(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };

  return (
    <AuthLayout 
      title="Start learning today" 
      subtitle="Create your free CSCN account"
      sidebarTitle="Learn without limits."
      sidebarSubtitle="Join thousands of professionals mastering in-demand skills through structured, expert-led learning paths."
    >
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 xl:space-y-10"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6">
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">First name</label>
              <input
                {...form.register("firstName")}
                disabled={isPending}
                type="text"
                placeholder="First name"
                className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
              />
              {form.formState.errors.firstName && (
                <p className="text-[12px] text-[#FF383C] font-medium ml-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Last name</label>
              <input
                {...form.register("lastName")}
                disabled={isPending}
                type="text"
                placeholder="Last name"
                className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
              />
              {form.formState.errors.lastName && (
                <p className="text-[12px] text-[#FF383C] font-medium ml-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Email address</label>
            <input
              {...form.register("email")}
              disabled={isPending}
              type="email"
              placeholder="Enter your email"
              className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
            />
            {form.formState.errors.email && (
              <p className="text-[12px] text-[#FF383C] font-medium ml-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Password</label>
              <div className="relative">
                <input
                  {...form.register("password")}
                  disabled={isPending}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full h-[56px] xl:h-[64px] px-4 pr-14 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
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
            
            {/* Password Strength Indicator (Visual only for now) */}
            <div className="flex gap-[5px]">
              <div className={`flex-1 h-[8px] rounded-[100px] transition-all ${form.watch("password")?.length >= 4 ? 'bg-[#1C4ED1]' : 'bg-[#F4F6FB]'}`} />
              <div className={`flex-1 h-[8px] rounded-[100px] transition-all ${form.watch("password")?.length >= 8 ? 'bg-[#1C4ED1]' : 'bg-[#F4F6FB]'}`} />
              <div className={`flex-1 h-[8px] rounded-[100px] transition-all ${form.watch("password")?.length >= 10 ? 'bg-[#1C4ED1]' : 'bg-[#F4F6FB]'}`} />
              <div className={`flex-1 h-[8px] rounded-[100px] transition-all ${form.watch("password")?.length >= 12 ? 'bg-[#1C4ED1]' : 'bg-[#F4F6FB]'}`} />
            </div>
          </div>
        </div>

        <FormError message={error} />
        <FormSuccess message={success} />

        <div className="flex items-start gap-[8px]">
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-[#E3E8F4] text-[#1C4ED1] focus:ring-[#1C4ED1] cursor-pointer shrink-0"
          />
          <label htmlFor="terms" className="text-[14px] xl:text-[16px] leading-normal text-[#9CA3AF] font-medium tracking-[-0.16px] cursor-pointer">
            I agree to CSCN's <Link href="/terms" className="text-[#1C4ED1] underline underline-offset-4">Terms of Service</Link> and <Link href="/privacy" className="text-[#1C4ED1] underline underline-offset-4">Privacy Policy</Link>.
          </label>
        </div>

        <div className="flex flex-col items-center gap-8 xl:gap-[40px]">
          <button 
            type="submit"
            disabled={isPending || !agreed}
            className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-full h-full flex items-center justify-center rounded-full transition-all duration-300" style={{ backgroundImage: !agreed ? "none" : "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)" }}>
              <span className={`text-[16px] xl:text-[18px] font-medium tracking-[-0.18px] flex items-center gap-2 ${!agreed ? "text-[#9CA3AF]" : "text-white"}`}>
                {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                Create account
              </span>
            </div>
          </button>

          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-[#E3E8F4]" />
            <span className="text-[#9CA3AF] text-[16px] xl:text-[18px] font-medium tracking-[-0.36px]">Or</span>
            <div className="flex-1 h-[1px] bg-[#E3E8F4]" />
          </div>

          <Social />

          <div className="flex items-center gap-2 text-[16px] xl:text-[18px] tracking-[-0.18px]">
            <span className="text-[#4B5563] font-medium">Already have an account?</span>
            <Link href="/signin" className="text-[#1C4ED1] font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
