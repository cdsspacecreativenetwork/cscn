'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { newPasswordAction } from '@/actions/new-password';

export default function NewPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!token) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="This password reset link is missing or malformed."
        sidebarTitle="Something went wrong."
        sidebarSubtitle="Please request a new password reset link from the login page."
        showBackToHome={false}
      >
        <Link
          href="/forgot-password"
          className="w-full h-[56px] flex items-center justify-center rounded-full bg-[#1C4ED1] text-white font-semibold text-[16px]"
        >
          Request new link
        </Link>
      </AuthLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setResult({ error: "Passwords do not match." }); return; }
    startTransition(async () => {
      const res = await newPasswordAction({ token, password });
      setResult(res);
    });
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
      sidebarTitle="Almost there."
      sidebarSubtitle="Enter your new password and you'll be back to learning in no time."
      showBackToHome={false}
    >
      {result?.success ? (
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-[18px] font-semibold text-[#040B37]">Password updated!</p>
              <p className="text-[15px] text-[#4B5563]">{result.success}</p>
            </div>
          </div>
          <Link
            href="/signin"
            className="w-full h-[56px] flex items-center justify-center rounded-full bg-[#1C4ED1] text-white font-semibold text-[16px] hover:bg-[#163BB1] transition-all"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 xl:space-y-10">
          <div className="space-y-5">
            {/* New password */}
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full h-[56px] xl:h-[64px] px-4 pr-12 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#040B37] transition-colors"
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">
                Confirm password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
              />
            </div>

            {result?.error && (
              <div className="flex items-center gap-2 text-red-500 text-[14px] font-medium">
                <XCircle size={16} className="shrink-0" />
                {result.error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={pending || !password || !confirm}
            className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full overflow-hidden disabled:opacity-60"
          >
            <div
              className="w-full h-full flex items-center justify-center rounded-full"
              style={{ backgroundImage: "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)" }}
            >
              <span className="text-white text-[16px] xl:text-[18px] font-medium tracking-[-0.18px]">
                {pending ? 'Updating…' : 'Set new password'}
              </span>
            </div>
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
