'use client';

import React from 'react';
import { Search, Bell, X } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';
import { UserAvatarMenu } from './UserAvatarMenu';

interface NavbarProps {
  onMenuClick?: () => void;
}

import { Skeleton } from '../ui/Skeleton';

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { data: session, status, update } = useSession();

  // Force a session refresh once on mount so role/name are always fresh
  React.useEffect(() => { update(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = status === 'loading' || (status === 'authenticated' && !session?.user?.name);

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const { notifications, unreadCount, markRead, markAllRead, markVisibleAsSeen } = useNotifications();

  return (
    <header className="h-[clamp(60px,4.17vw,72px)] bg-white border-b border-[#E3E8F4] flex items-center justify-between gap-3 px-[clamp(16px,1.85vw,32px)] sticky top-0 z-40 shrink-0">
      {/* Click-outside backdrop for notifications */}
      {isNotificationsOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsNotificationsOpen(false)}
        />
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 z-[80] bg-[#040B37]/25 p-4 backdrop-blur-sm md:hidden">
          <div className="mx-auto mt-4 flex w-full max-w-lg items-center gap-2 rounded-2xl border border-[#D8E0EE] bg-white p-2 shadow-[0_22px_60px_rgba(4,11,55,0.18)]">
            <div className="relative min-w-0 flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                autoFocus
                type="text"
                placeholder="Search courses, lessons, people..."
                className="h-11 w-full rounded-xl bg-[#F4F6FB] pl-11 pr-4 text-[15px] font-semibold text-[#040B37] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#1C4ED1]/15"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E3E8F4] text-[#4B5563]"
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Left Area: Menu Toggle (Mobile) + Search */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#4B5563] hover:bg-[#F4F6FB] rounded-lg transition-all shrink-0"
        >
          <Image 
            src="/assets/menu.svg" 
            alt="Menu" 
            width={24} 
            height={24} 
            className="w-6 h-6 brightness-0"
          />
        </button>

        {/* Search Bar - Fluid Width */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex h-[clamp(40px,2.55vw,44px)] w-[clamp(40px,2.55vw,44px)] items-center justify-center rounded-[12px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1] md:hidden"
          aria-label="Open search"
        >
          <Search size={20} />
        </button>

        <div className="relative hidden w-[clamp(220px,26.68vw,461px)] group md:block">
          <div className="absolute left-[clamp(12px,0.92vw,16px)] top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#1C4ED1] transition-colors">
            <Search size={20} style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }} />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-[clamp(40px,2.55vw,44px)] pl-[clamp(38px,2.55vw,44px)] pr-[clamp(12px,0.92vw,16px)] bg-[#F4F6FB] border border-[#E3E8F4] rounded-full text-[clamp(14px,0.92vw,15px)] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] transition-all"
          />
        </div>
      </div>

      {/* User Actions - Fluid Spacing */}
      <div className="relative z-40 flex shrink-0 items-center gap-2 sm:gap-[clamp(12px,1.39vw,24px)]">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`w-[clamp(40px,2.55vw,44px)] h-[clamp(40px,2.55vw,44px)] flex items-center justify-center border border-[#E3E8F4] rounded-[12px] text-[#4B5563] transition-all relative ${isNotificationsOpen ? 'bg-[#F4F6FB]' : 'hover:bg-[#F4F6FB]'}`}
          >
            <Bell size={24} style={{ width: 'clamp(20px, 1.39vw, 24px)', height: 'clamp(20px, 1.39vw, 24px)' }} />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-none text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            notifications={notifications}
            isOpen={isNotificationsOpen}
            onMarkAllAsRead={markAllRead}
            onMarkRead={markRead}
            onMarkVisibleAsSeen={markVisibleAsSeen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {/* Divider */}
        <div className="hidden h-[clamp(28px,2.08vw,36px)] w-[1px] bg-[#E3E8F4] sm:block"></div>

        {isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="h-11 w-11" />
            <div className="hidden space-y-1 sm:block">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-3 w-[50px]" />
            </div>
          </div>
        ) : (
          <UserAvatarMenu user={session?.user ?? null} showUserText />
        )}
      </div>
    </header>
  );
};
