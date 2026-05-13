"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { SetupAdminSchema } from "@/schemas";
import { createFirstAdmin } from "@/actions/setup";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";

interface SetupFormProps {
  requireSecret: boolean;
}

export function SetupForm({ requireSecret }: SetupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SetupAdminSchema>>({
    resolver: zodResolver(SetupAdminSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      setupSecret: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SetupAdminSchema>) => {
    setError(undefined);
    startTransition(() => {
      createFirstAdmin(values).then((data) => {
        if (data?.error) setError(data.error);
      });
    });
  };

  return (
    <AuthLayout
      title="Create admin account"
      subtitle="One-time setup — run this before anyone else signs up"
      sidebarTitle="You're in control."
      sidebarSubtitle="Set up your admin account to manage users, invite instructors, and configure the platform."
      showBackToHome={false}
    >
      <div className="mb-6 flex items-center gap-3 p-4 bg-[#EFF3FF] border border-[#C8D1E0] rounded-[12px]">
        <ShieldCheck className="text-[#1C4ED1] shrink-0" size={20} />
        <p className="text-[14px] text-[#4B5563] font-medium leading-snug">
          This page is only accessible when no admin exists. It will redirect to
          sign-in once setup is complete.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[16px] font-medium text-[#4B5563]">
              First name
            </label>
            <input
              {...form.register("firstName")}
              disabled={isPending}
              placeholder="First name"
              className="w-full h-[56px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
            />
            {form.formState.errors.firstName && (
              <p className="text-[12px] text-[#FF383C] font-medium">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[16px] font-medium text-[#4B5563]">
              Last name
            </label>
            <input
              {...form.register("lastName")}
              disabled={isPending}
              placeholder="Last name"
              className="w-full h-[56px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[16px] font-medium text-[#4B5563]">
            Email address
          </label>
          <input
            {...form.register("email")}
            disabled={isPending}
            type="email"
            placeholder="admin@cscn.com"
            className="w-full h-[56px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
          />
          {form.formState.errors.email && (
            <p className="text-[12px] text-[#FF383C] font-medium">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[16px] font-medium text-[#4B5563]">
            Password
          </label>
          <div className="relative">
            <input
              {...form.register("password")}
              disabled={isPending}
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              className="w-full h-[56px] px-4 pr-14 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-[12px] text-[#FF383C] font-medium">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {requireSecret && (
          <div className="space-y-2">
            <label className="text-[16px] font-medium text-[#4B5563]">
              Setup secret{" "}
              <span className="text-[#9CA3AF] font-normal text-[14px]">
                (from SETUP_SECRET env var)
              </span>
            </label>
            <input
              {...form.register("setupSecret")}
              disabled={isPending}
              type="password"
              placeholder="Enter setup secret"
              className="w-full h-[56px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] focus:border-[#1C4ED1] outline-none transition-all disabled:opacity-70"
            />
          </div>
        )}

        <FormError message={error} />

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden disabled:opacity-70"
        >
          <div
            className="w-full h-full flex items-center justify-center rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)",
            }}
          >
            <span className="text-white text-[16px] font-medium tracking-[-0.18px] flex items-center gap-2">
              {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
              Create Admin Account
            </span>
          </div>
        </button>
      </form>
    </AuthLayout>
  );
}
