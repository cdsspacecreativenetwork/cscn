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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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

  const passwordValue = form.watch("password") || "";
  const criteria = [
    { label: "Uppercase letter", met: /[A-Z]/.test(passwordValue) },
    { label: "Lowercase letter", met: /[a-z]/.test(passwordValue) },
    { label: "Number", met: /\d/.test(passwordValue) },
    { label: "Special character (e.g. !?<>@#$%)", met: /[!@#$%^&*(),.?":{}|<>_~`+\-=\[\]\\';/ ]/.test(passwordValue) },
    { label: "8 characters or more", met: passwordValue.length >= 8 },
  ];
  const isPasswordSecure = criteria.every(c => c.met);

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    if (!agreed) return;
    if (!isPasswordSecure) {
      setError("Please ensure your password meets all security criteria.");
      return;
    }
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
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
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
            
            {/* Accordion reveal password strength checklist */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isPasswordFocused || passwordValue.length > 0 ? 'max-h-[220px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-2.5 p-4 bg-[#F8FAFB] rounded-[16px] border border-[#E3E8F4]">
                {criteria.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-[14px] font-semibold transition-colors duration-200">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      c.met 
                        ? 'border-emerald-500 bg-emerald-500 text-white' 
                        : 'border-gray-300 bg-white text-transparent'
                    }`}>
                      {c.met ? (
                        <svg className="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span className={c.met ? 'text-[#040B37] font-medium' : 'text-gray-400 font-medium'}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
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
