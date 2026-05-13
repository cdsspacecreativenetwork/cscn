"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Check, Loader2, Link2 } from "lucide-react";

import { InviteSchema } from "@/schemas";
import { createInvite } from "@/actions/invite";

type InviteFormValues = z.infer<typeof InviteSchema>;

const SUPER_ADMIN_OPTIONS = [
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const ADMIN_OPTIONS = [{ value: "INSTRUCTOR", label: "Instructor" }];

interface InviteFormProps {
  currentUserRole: string;
}

export function InviteForm({ currentUserRole }: InviteFormProps) {
  const roleOptions =
    currentUserRole === "SUPER_ADMIN" ? SUPER_ADMIN_OPTIONS : ADMIN_OPTIONS;

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { email: "", role: "INSTRUCTOR" },
  });

  const onSubmit = (values: InviteFormValues) => {
    setServerError(null);
    setGeneratedLink(null);
    startTransition(async () => {
      const result = await createInvite(
        values.role as any,
        values.email || undefined
      );
      if (result.success && result.token) {
        setGeneratedLink(`${window.location.origin}/invite/${result.token}`);
        form.reset();
      } else {
        setServerError(result.error ?? "Something went wrong");
      }
    });
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            {...form.register("email")}
            disabled={isPending}
            type="email"
            placeholder="Email (optional — leave blank for any user)"
            className="flex-1 h-[48px] px-4 rounded-[10px] border border-[#E3E8F4] bg-[#F4F6FB] text-[14px] text-[#040B37] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] transition-all disabled:opacity-60"
          />
          <select
            {...form.register("role")}
            disabled={isPending}
            className="h-[48px] px-4 rounded-[10px] border border-[#E3E8F4] bg-[#F4F6FB] text-[14px] text-[#040B37] outline-none focus:border-[#1C4ED1] transition-all font-medium disabled:opacity-60 cursor-pointer"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="h-[48px] px-6 bg-[#1C4ED1] hover:bg-[#163BB1] text-white rounded-[10px] text-[14px] font-semibold transition-all flex items-center gap-2 disabled:opacity-60 shrink-0"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Link2 size={16} />
            )}
            Generate Link
          </button>
        </div>
        {form.formState.errors.email && (
          <p className="text-[12px] text-red-500 mt-1.5">
            {form.formState.errors.email.message}
          </p>
        )}
        {serverError && (
          <p className="text-[12px] text-red-500 mt-1.5">{serverError}</p>
        )}
      </form>

      {generatedLink && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-[10px]">
          <p className="flex-1 text-[13px] text-emerald-800 font-mono truncate">
            {generatedLink}
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-[8px] text-[13px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-all shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
