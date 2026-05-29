'use client';

import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { VerificationBanner } from '@/components/dashboard/VerificationBanner';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMidSize, setIsMidSize] = React.useState(false);

  // Silent sync: If user is logged in but name is missing (common after initial redirect)
  // trigger a silent session refresh to populate the client-side state.
  React.useEffect(() => {
    if (status === 'authenticated' && !session?.user?.name) {
      update();
    }
  }, [status, session?.user?.name, update]);

  // Default to collapsed on mid-size screens (up to 1440px)
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

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      {/* Sidebar Overlay (Mobile & Laptop Overlay Range) */}
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
          // On lg screens where the sidebar renders as an overlay, also collapse it
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
