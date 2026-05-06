'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Continue where you left off"
      sidebarTitle="Your Knowledge Awaits You."
      sidebarSubtitle="Pick up right where you left off. Your progress, your courses, your community all here."
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

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full h-[56px] xl:h-[64px] px-4 pr-14 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[#1C4ED1] font-medium text-[16px] xl:text-[18px] tracking-[-0.18px]">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 xl:gap-[40px]">
          <button className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center rounded-full transition-all duration-300" style={{ backgroundImage: "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)" }}>
              <span className="text-white text-[16px] xl:text-[18px] font-medium tracking-[-0.18px]">
                Sign In
              </span>
            </div>
          </button>

          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-[#E3E8F4]" />
            <span className="text-[#9CA3AF] text-[16px] xl:text-[18px] font-medium tracking-[-0.36px]">Or</span>
            <div className="flex-1 h-[1px] bg-[#E3E8F4]" />
          </div>

          <div className="flex gap-6 xl:gap-[40px]">
            <button className="w-[56px] h-[56px] xl:w-[64px] xl:h-[64px] bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-transform">
              <Image src="/assets/dashboard/flat-color-icons_google.svg" alt="Google" width={28} height={28} />
            </button>
            <button className="w-[56px] h-[56px] xl:w-[64px] xl:h-[64px] bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-transform">
              <Image src="/assets/dashboard/logos_facebook.svg" alt="Facebook" width={28} height={28} />
            </button>
            <button className="w-[56px] h-[56px] xl:w-[64px] xl:h-[64px] bg-[#F4F6FB] border-2 border-white rounded-[16px] shadow-[0px_4px_8px_4px_rgba(0,0,0,0.04)] flex items-center justify-center hover:scale-105 transition-transform">
              <Image src="/assets/dashboard/mdi_apple.svg" alt="Apple" width={28} height={28} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[16px] xl:text-[18px] tracking-[-0.18px]">
            <span className="text-[#4B5563] font-medium">New to CSCN?</span>
            <Link href="/signup" className="text-[#1C4ED1] font-semibold">
              Create a free account
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
