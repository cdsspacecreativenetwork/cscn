'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function SignupPage() {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <AuthLayout 
      title="Start learning today" 
      subtitle="Create your free CSCN account"
      sidebarTitle="Learn without limits."
      sidebarSubtitle="Join thousands of professionals mastering in-demand skills through structured, expert-led learning paths."
    >
      <form className="space-y-8 xl:space-y-10">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6">
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">First name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Last name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Email address</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full h-[56px] xl:h-[64px] px-4 rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#040B37] placeholder:text-[#9CA3AF] text-[16px] xl:text-[18px] focus:border-[#1C4ED1] outline-none transition-all"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[16px] xl:text-[18px] font-medium text-[#4B5563] tracking-[-0.18px]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
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
            
            <div className="flex gap-[5px]">
              <div className="flex-1 h-[8px] bg-[#F4F6FB] rounded-[100px]" />
              <div className="flex-1 h-[8px] bg-[#F4F6FB] rounded-[100px]" />
              <div className="flex-1 h-[8px] bg-[#F4F6FB] rounded-[100px]" />
              <div className="flex-1 h-[8px] bg-[#F4F6FB] rounded-[100px]" />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-[8px]">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 w-5 h-5 rounded border-[#E3E8F4] text-[#1C4ED1] focus:ring-[#1C4ED1] cursor-pointer shrink-0"
          />
          <label htmlFor="terms" className="text-[14px] xl:text-[16px] leading-normal text-[#9CA3AF] font-medium tracking-[-0.16px] cursor-pointer">
            I agree to CSCN's <Link href="/terms" className="text-[#1C4ED1] underline underline-offset-4">Terms of Service</Link> and <Link href="/privacy" className="text-[#1C4ED1] underline underline-offset-4">Privacy Policy</Link>.
          </label>
        </div>

        <div className="flex flex-col items-center gap-8 xl:gap-[40px]">
          <button className="w-full h-[56px] p-[2px] bg-[#F4F6FB] border border-[#648EFC] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)] overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center rounded-full transition-all duration-300" style={{ backgroundImage: "linear-gradient(146deg, #0035C1 8.83%, #0575FF 86.3%)" }}>
              <span className="text-white text-[16px] xl:text-[18px] font-medium tracking-[-0.18px]">
                Create account
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
            <span className="text-[#4B5563] font-medium">Already have an account?</span>
            <Link href="/login" className="text-[#1C4ED1] font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

