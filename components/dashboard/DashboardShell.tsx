'use client';

import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { VerificationBanner } from '@/components/dashboard/VerificationBanner';
import { useSession } from 'next-auth/react';

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMidSize, setIsMidSize] = React.useState(false);

  React.useEffect(() => {
    if (status === 'authenticated' && !session?.user?.name) {
      update();
    }
  }, [status, session?.user?.name, update]);

  React.useEffect(() => {
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

  return (
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
  );
}
