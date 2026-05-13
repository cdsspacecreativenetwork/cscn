'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { forgotPasswordAction } from '@/actions/forgot-password';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await forgotPasswordAction({ email });
      setResult(res);
    });
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email address to reset your password"
      sidebarTitle="Don't worry, we've got you."
      sidebarSubtitle="Take a deep breath. A few quick clicks and you'll be back to your lessons in no time."
      showBackToHome={false}
    >
      {result?.success ? (
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-[18px] font-semibold text-[#040B37]">Check your email</p>
              <p className="text-[15px] text-[#4B5563] leading-relaxed">{result.success}</p>
            </div>
          </div>
          <Link
            href="/signin"
            className="flex items-center justify-center gap-2 text-[#1C4ED1] font-semibold text-[16px] xl:text-[18px] tracking-[-0.18px]"
          >
            <ArrowLeft size={20} />
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 xl:space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
              />
            </div>

            {result?.error && (
              <p className="text-[14px] text-red-500 font-medium">{result.error}</p>
            )}
          </div>

          <div className="space-y-8">
            <button
              type="submit"
              disabled={pending || !email.trim()}
              className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden group disabled:opacity-60"
            >
              <div
                className="w-full h-full flex items-center justify-center rounded-full transition-all duration-300"
                style={{ backgroundImage: "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)" }}
              >
                <span className="text-white text-[16px] xl:text-[18px] font-medium tracking-[-0.18px]">
                  {pending ? 'Sending…' : 'Send reset link'}
                </span>
              </div>
            </button>

            <div className="flex items-center justify-center gap-2">
              <Link
                href="/signin"
                className="flex items-center gap-2 text-[#1C4ED1] font-semibold text-[16px] xl:text-[18px] tracking-[-0.18px]"
              >
                <ArrowLeft size={20} />
                Back to Sign In
              </Link>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
