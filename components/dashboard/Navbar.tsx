'use client';

import React from 'react';
import { Search, Bell } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';
import { UserAvatarMenu } from './UserAvatarMenu';
import { CommandPaletteModal } from './CommandPaletteModal';

interface NavbarProps {
  onMenuClick?: () => void;
}

import { Skeleton } from '../ui/Skeleton';

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading' || (status === 'authenticated' && !session?.user?.name);

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const { notifications, unreadCount, markRead, markAllRead, markVisibleAsSeen } = useNotifications();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut globally
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-[clamp(60px,4.17vw,72px)] bg-white border-b border-[#E3E8F4] flex items-center justify-between gap-3 px-[clamp(16px,1.85vw,32px)] sticky top-0 z-40 shrink-0 font-jakarta">
      {/* Click-outside backdrop for notifications */}
      {isNotificationsOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsNotificationsOpen(false)}
        />
      )}

      {/* Left Area: Menu Toggle (Mobile) + Search */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button 
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-[#4B5563] transition-colors hover:bg-[#F4F6FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-[900px]:hidden"
          aria-label="Open navigation menu"
        >
          <Image 
            src="/assets/menu.svg" 
            alt="Menu" 
            width={24} 
            height={24} 
            className="w-6 h-6 brightness-0"
          />
        </button>

        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex h-[clamp(40px,2.55vw,44px)] w-[clamp(40px,2.55vw,44px)] items-center justify-center rounded-[12px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1] md:hidden"
          aria-label="Open command palette search"
        >
          <Search size={20} />
        </button>

        {/* Desktop Search Trigger Input with ⌘K Badge */}
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="group relative hidden h-[clamp(40px,2.55vw,44px)] w-[clamp(220px,26.68vw,461px)] items-center justify-between rounded-full border border-[#E3E8F4] bg-[#F4F6FB] px-[clamp(14px,1.15vw,18px)] text-left text-[#9CA3AF] transition-[border-color,background-color] hover:border-[#1C4ED1]/50 hover:bg-white md:flex"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search size={18} className="text-[#9CA3AF] group-hover:text-[#1C4ED1] transition-colors shrink-0" />
            <span className="text-[clamp(13px,0.92vw,14px)] font-medium text-[#6B7280] group-hover:text-[#040B37] truncate">
              Search features & sections...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-extrabold text-[#4B5563] bg-white border border-[#E3E8F4] rounded-[6px] shadow-2xs font-mono shrink-0">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* User Actions - Fluid Spacing */}
      <div className="relative z-40 flex shrink-0 items-center gap-2 sm:gap-[clamp(12px,1.39vw,24px)]">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative flex size-[clamp(40px,2.55vw,44px)] items-center justify-center rounded-[12px] border border-[#E3E8F4] text-[#4B5563] transition-colors ${isNotificationsOpen ? 'bg-[#F4F6FB]' : 'hover:bg-[#F4F6FB]'}`}
            aria-label={isNotificationsOpen ? 'Close notifications' : `Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={24} style={{ width: 'clamp(20px, 1.39vw, 24px)', height: 'clamp(20px, 1.39vw, 24px)' }} />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold leading-none text-white ring-2 ring-white">
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

      {/* Global Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </header>
  );
};
