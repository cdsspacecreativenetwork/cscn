'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { VerificationBanner } from '@/components/dashboard/VerificationBanner';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { RegistrationIntentModal } from '@/components/auth/RegistrationIntentModal';
import { BecomeInstructorModal } from '@/components/marketing/BecomeInstructorModal';

export function DashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMidSize, setIsMidSize] = useState(false);

  const [showIntentModal, setShowIntentModal] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Hard guard: If user has not selected their registration role, redirect to /onboarding/intent
    const userFocus = (session?.user as any)?.learningFocus;
    if (searchParams.get('onboarding') === 'intent' || (!userFocus && searchParams.get('onboarding') === '1')) {
      router.replace('/onboarding/intent');
    }
  }, [searchParams, session, router]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024 && width < 1440) {
        setIsCollapsed(true);
        setIsMidSize(true);
      } else if (width >= 1440) {
        setIsCollapsed(false);
        setIsMidSize(false);
      } else {
        setIsMidSize(false);
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectIntent = (intent: 'LEARNER' | 'INSTRUCTOR') => {
    setShowIntentModal(false);
    router.replace('/dashboard');

    if (intent === 'INSTRUCTOR') {
      setShowInstructorModal(true);
    }
  };

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <div className="relative flex h-dvh w-full overflow-hidden bg-background">
        {(isSidebarOpen || (!isCollapsed && isMidSize)) && (
          <div
            className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-60 animate-in fade-in duration-300"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsCollapsed(true);
            }}
          />
        )}

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            if (typeof window !== 'undefined' && window.innerWidth < 1440) {
              setIsCollapsed(true);
            }
          }}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300">
          <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
          <VerificationBanner />
          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(112px+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        </div>
      </div>

      <RegistrationIntentModal
        open={showIntentModal}
        onClose={() => {
          setShowIntentModal(false);
          router.replace('/dashboard');
        }}
        onSelectIntent={handleSelectIntent}
      />

      <BecomeInstructorModal
        open={showInstructorModal}
        onClose={() => setShowInstructorModal(false)}
      />
    </SessionProvider>
  );
}
