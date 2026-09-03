"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { RegisterSchema } from "@/schemas";
import { register } from "@/actions/register";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { Social } from "@/components/auth/Social";
import Button from "@/components/ui/Button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { readInstructorApplicationDraft } from "@/lib/instructor-application-draft";
import {
  INSTRUCTOR_EXPERIENCE_LEVELS,
  type InstructorApplicationInput,
} from "@/lib/instructor-applications";
import { cn } from "@/lib/utils";

const fieldGroupClass = "space-y-2";
const labelClass = "block text-sm sm:text-base font-medium text-[#4B5563] font-jakarta";
const inputClass = "h-12 sm:h-14 w-full px-4.5 text-base sm:text-lg! font-medium bg-[#F4F6FB] border border-[#E3E8F4] !rounded-lg text-[#040B37] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1C4ED1] focus:bg-white focus:ring-2 focus:ring-[#1C4ED1]/15 transition-all outline-none disabled:opacity-50 font-jakarta !bg-[#F4F6FB]";

export type CreateAccountVariant = "learner" | "instructor";

type CreateAccountScreenProps = {
  variant?: CreateAccountVariant;
};

const instructorResumeCallback = "/instructors?apply=1&resume=1";

export function CreateAccountScreen({ variant = "learner" }: CreateAccountScreenProps) {
  const searchParams = useSearchParams();
  const isInstructor = variant === "instructor" || searchParams.get("intent")?.toUpperCase() === "INSTRUCTOR";
  const callbackUrl = searchParams.get("callbackUrl") || (isInstructor ? instructorResumeCallback : undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [applicationDraft, setApplicationDraft] = useState<InstructorApplicationInput | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      callbackUrl,
    },
  });

  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const draft = readInstructorApplicationDraft();
    if (!draft) return;
    if (draft.firstName) form.setValue('firstName', draft.firstName);
    if (draft.lastName) form.setValue('lastName', draft.lastName);
    if (draft.email) form.setValue('email', draft.email);
    setApplicationDraft(draft);
  }, [form]);

  const experienceLabel = applicationDraft
    ? INSTRUCTOR_EXPERIENCE_LEVELS.find((option) => option.value === applicationDraft.experienceLevel)?.label
    : undefined;

  const passwordValue = useWatch({ control: form.control, name: "password" }) || "";
  const criteria = [
    { label: "Uppercase letter", met: /[A-Z]/.test(passwordValue) },
    { label: "Lowercase letter", met: /[a-z]/.test(passwordValue) },
    { label: "Number", met: /\d/.test(passwordValue) },
    { label: "Special character", met: /[!@#$%^&*(),.?":{}|<>_~`+\-=\[\]\\';/ ]/.test(passwordValue) },
    { label: "8+ characters", met: passwordValue.length >= 8 },
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

    const intentParam = searchParams.get("intent") || (isInstructor ? "INSTRUCTOR" : undefined);

    startTransition(() => {
      register({ ...values, callbackUrl, isInstructor, intent: intentParam }).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };

  return (
    <AuthLayout
      title={isInstructor ? "Become a CSCN Instructor" : "Start learning today"}
      subtitle={isInstructor ? "Join CSCN as an instructor & share your knowledge" : "Create your free CSCN account"}
      sidebarTitle={isInstructor ? "Teach what you know. Help creators grow." : "Learn without limits."}
      sidebarSubtitle={isInstructor
        ? "Join CSCN as an instructor and turn your practical industry experience into learning that moves careers forward."
        : "Join thousands of professionals mastering in-demand skills through structured, expert-led learning paths."}
      benefits={isInstructor ? [
        {
          title: "Share practical expertise",
          description: "Create learning experiences grounded in real industry work",
          iconSrc: "/assets/dashboard/motorboard-02.svg",
        },
        {
          title: "Guide ambitious learners",
          description: "Help professionals build skills and move their careers forward",
          iconSrc: "/assets/dashboard/certificate-01.svg",
        },
      ] : undefined}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-4.5"
      >
        {isInstructor && applicationDraft && (
          <Alert className="py-2.5 px-3.5 rounded-[14px]">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 text-primary shrink-0" />
            <div className="text-xs">
              <AlertTitle className="font-semibold text-xs mb-0.5">Instructor application draft found</AlertTitle>
              <AlertDescription className="text-xs">
                {applicationDraft.firstName} {applicationDraft.lastName} · {applicationDraft.email}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="space-y-3.5">
          {/* First & Last Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className={fieldGroupClass}>
              <label className={labelClass}>First name</label>
              <input
                {...form.register("firstName")}
                disabled={isPending}
                type="text"
                placeholder="Enter your full name"
                className={cn(inputClass, form.formState.errors.firstName && "border-red-500 focus:border-red-500")}
              />
              {form.formState.errors.firstName && (
                <p className="text-[11px] text-[#FF383C] font-medium ml-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div className={fieldGroupClass}>
              <label className={labelClass}>Last name</label>
              <input
                {...form.register("lastName")}
                disabled={isPending}
                type="text"
                placeholder="Enter your full name"
                className={cn(inputClass, form.formState.errors.lastName && "border-red-500 focus:border-red-500")}
              />
              {form.formState.errors.lastName && (
                <p className="text-[11px] text-[#FF383C] font-medium ml-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div className={fieldGroupClass}>
            <label className={labelClass}>Email address</label>
            <input
              {...form.register("email")}
              disabled={isPending}
              type="email"
              placeholder="Enter your email"
              className={cn(inputClass, form.formState.errors.email && "border-red-500 focus:border-red-500")}
            />
            {form.formState.errors.email && (
              <p className="text-[11px] text-[#FF383C] font-medium ml-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className={fieldGroupClass}>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input
                {...form.register("password")}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                disabled={isPending}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className={cn(inputClass, "pr-11", form.formState.errors.password && "border-red-500 focus:border-red-500")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Industry Standard 4-Segment Progressive Password Strength Indicator (Figma Spec EL-f8bd89f1) */}
            <div className="space-y-1.5 pt-1.5">
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((step) => {
                  const metCount = criteria.filter(c => c.met).length;
                  const score = !passwordValue ? 0 : metCount <= 2 ? 1 : metCount === 3 ? 2 : metCount === 4 ? 3 : 4;
                  const isFilled = score >= step;
                  const colors = ["bg-[#E3E8F4]", "bg-[#EF4444]", "bg-[#F59E0B]", "bg-[#1C4ED1]", "bg-[#10B981]"];
                  return (
                    <div
                      key={step}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-all duration-300",
                        isFilled
                          ? colors[score]
                          : "bg-[#F4F6FB] border border-[#E3E8F4]"
                      )}
                    />
                  );
                })}
              </div>

              {passwordValue.length > 0 && (
                <div className="flex items-center justify-between text-xs font-jakarta pt-0.5">
                  <span className="text-[#9CA3AF] font-medium">Password strength</span>
                  <span
                    className={cn(
                      "font-semibold text-xs",
                      criteria.filter(c => c.met).length <= 2 && "text-[#EF4444]",
                      criteria.filter(c => c.met).length === 3 && "text-[#F59E0B]",
                      criteria.filter(c => c.met).length === 4 && "text-[#1C4ED1]",
                      criteria.filter(c => c.met).length === 5 && "text-[#10B981]"
                    )}
                  >
                    {criteria.filter(c => c.met).length <= 2 ? "Weak" : criteria.filter(c => c.met).length === 3 ? "Fair" : criteria.filter(c => c.met).length === 4 ? "Good" : "Strong"}
                  </span>
                </div>
              )}

              {/* Animated Requirement Checklist Box - Smoothly expands when typing/focused, collapses smoothly when strong */}
              <AnimatePresence>
                {(isPasswordFocused || passwordValue.length > 0) && !isPasswordSecure && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 bg-[#F4F6FB] border border-[#E3E8F4] !rounded-lg space-y-2">
                      <p className="text-xs font-semibold text-[#040B37] font-jakarta">Password must contain:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-jakarta">
                        {criteria.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {c.met ? (
                              <div className="w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-[#9CA3AF]/60 bg-white flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                              </div>
                            )}
                            <span className={cn(c.met ? "text-[#10B981] font-semibold" : "text-[#6B7280]")}>
                              {c.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {form.formState.errors.password && (
              <p className="text-[11px] text-[#FF383C] font-medium ml-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Terms & Privacy checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1C4ED1] focus:ring-[#1C4ED1] cursor-pointer shrink-0"
            />
            <label htmlFor="terms" className="text-xs sm:text-sm! text-[#6B7280] font-normal leading-normal select-none">
              I agree to CSCN&apos;s{" "}
              <Link href="/terms" className="text-[#1C4ED1] font-medium underline hover:text-[#1C4ED1]/80">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#1C4ED1] font-medium underline hover:text-[#1C4ED1]/80">
                Privacy Policy
              </Link>
              . I understand I may receive emails about my account and platform updates.
            </label>
          </div>
        </div>

        <FormError message={error} />
        <FormSuccess message={success} />

        {/* Custom Action Button (Figma Spec Node #8732:4506) */}
        <button
          type="submit"
          disabled={isPending || !agreed || !isPasswordSecure}
          className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden group disabled:cursor-not-allowed cursor-pointer"
        >
          <div
            className="w-full h-full flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              backgroundImage: "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)",
              opacity: (isPending || !agreed || !isPasswordSecure) ? 0.4 : 1,
            }}
          >
            <span className="text-white text-[16px] xl:text-[18px] font-medium font-jakarta tracking-[-0.18px] flex items-center gap-2">
              {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
              {isPending
                ? "Creating account..."
                : (isInstructor ? "Create instructor account" : "Create account")}
            </span>
          </div>
        </button>

        {/* Divider (Figma Spec Node #8732:4507) */}
        <div className="relative flex items-center justify-center my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#C8D1E0]/60" />
          </div>
          <div className="relative bg-white px-4 text-sm sm:text-base font-medium text-[#9CA3AF] font-inter">
            Or
          </div>
        </div>

        {/* Social Auth Buttons (Google & LinkedIn) */}
        <Social />

        {/* Bottom Sign In Link (Figma Spec Node #8732:4529) */}
        <p className="text-center text-sm sm:text-base text-[#4B5563] font-medium font-jakarta pt-2">
          Already have an account?{" "}
          <Link href={`/signin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="font-semibold text-[#1C4ED1] hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
