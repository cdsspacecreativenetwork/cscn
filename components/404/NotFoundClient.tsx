'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { Home, LogOut, LayoutDashboard, ArrowRight } from 'lucide-react';

import Button from '@/components/ui/Button';

interface NotFoundClientProps {
  userEmail: string | null;
}

export default function NotFoundClient({ userEmail }: NotFoundClientProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/signin' });
  };

  const isLoggedIn = Boolean(userEmail);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F4F6FB] text-[#040B37] font-inter px-4 sm:px-6 py-12 selection:bg-primary selection:text-white">
      {/* Centered Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex w-full max-w-[680px] flex-col items-center justify-center p-8 sm:p-14 md:p-16 text-center"
      >
        {/* CSCN Brand Icon */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
          className="mb-6 flex items-center justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center">
            <Image
              src="/assets/dashboard/signup/square-logo.svg"
              alt="CSCN Logo"
              width={44}
              height={44}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* 404 Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl font-extrabold tracking-tight text-[#040B37] sm:text-7xl md:text-8xl font-jakarta leading-none"
        >
          404
        </motion.h1>

        {/* Conditional Subtitle & Info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 text-center"
        >
          {isLoggedIn ? (
            <p className="text-sm sm:text-base font-normal text-[#4B5563] max-w-md leading-relaxed">
              You are logged in as{' '}
              <span className="font-semibold text-[#040B37] break-all">
                {userEmail}
              </span>
            </p>
          ) : (
            <p className="text-sm sm:text-base font-normal text-[#4B5563] max-w-md leading-relaxed">
              The page you are looking for does not exist or has been moved.
            </p>
          )}
        </motion.div>

        {/* Conditional Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center justify-center gap-3 w-full sm:w-auto"
        >
          {isLoggedIn ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Button
                variant="gradient"
                rounded="full"
                size="md"
                hasBorder={false}
                leftIcon={<LogOut size={16} />}
                loading={isSigningOut}
                onClick={handleSignOut}
                className="w-full sm:w-auto h-[46px] flex items-center justify-center px-6"
              >
                {isSigningOut ? 'Signing out...' : 'Sign in as a different user'}
              </Button>

              <Button
                variant="outline"
                rounded="full"
                size="md"
                leftIcon={<LayoutDashboard size={16} />}
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto h-[46px] flex items-center justify-center px-6 border-[#040B37] text-[#1C4ED1] hover:border-[#1C4ED1]"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Button
                variant="gradient"
                rounded="full"
                size="md"
                hasBorder={false}
                leftIcon={<Home size={16} />}
                onClick={() => router.push('/')}
                className="w-full sm:w-auto h-[46px] flex items-center justify-center px-6"
              >
                Go back home
              </Button>

              <Button
                variant="outline"
                rounded="full"
                size="md"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => router.push('/signin')}
                className="w-full sm:w-auto h-[46px] flex items-center justify-center px-6 border-[#040B37] text-[#1C4ED1] hover:border-[#1C4ED1]"
              >
                Sign in
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
