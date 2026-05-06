'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout 
      title="Forgot password?" 
      subtitle="Enter your email address to reset your password"
      sidebarTitle="Don’t worry, we’ve got you."
      sidebarSubtitle="Take a deep breath. A few quick clicks and you’ll be back to your lessons in no time."
      showBackToHome={false}
    >
      <form className="space-y-8 xl:space-y-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Email address</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-8">
          <button className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center rounded-full transition-all duration-300" style={{ backgroundImage: "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)" }}>
              <span className="text-white text-[16px] xl:text-[18px] font-medium tracking-[-0.18px]">
                Send reset link
              </span>
            </div>
          </button>

          <div className="flex items-center justify-center gap-2">
            <Link href="/login" className="flex items-center gap-2 text-[#1C4ED1] font-semibold text-[16px] xl:text-[18px] tracking-[-0.18px]">
              <ArrowLeft size={20} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
