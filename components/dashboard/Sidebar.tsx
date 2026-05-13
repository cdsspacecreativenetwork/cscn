'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Link2,
  BookPlus,
  BarChart2,
  Layers,
} from 'lucide-react';

const adminNavItems = [
  { name: 'Courses', href: '/dashboard/admin/courses', Icon: Layers },
  { name: 'Users',   href: '/dashboard/admin/users',   Icon: Users },
  { name: 'Invites', href: '/dashboard/admin/invites', Icon: Link2 },
];

const instructorNavItems = [
  { name: 'My Courses', href: '/dashboard/instructor/courses', Icon: BookPlus },
  { name: 'Analytics', href: '/dashboard/instructor/analytics', Icon: BarChart2 },
];

const mainNavItems = [
  { name: 'Overview', href: '/dashboard', icon: '/assets/dashboard/user/dashboard-square-03.svg' },
  { name: 'My Learning', href: '/dashboard/courses', icon: '/assets/dashboard/user/book-open-text.svg' },
  { name: 'Schedule', href: '/dashboard/schedule', icon: '/assets/dashboard/user/calendar-02.svg' },
  { name: 'My Progress', href: '/dashboard/progress', icon: '/assets/dashboard/user/progress.svg' },
  { name: 'Resources', href: '/dashboard/resources', icon: '/assets/dashboard/user/library.svg' },
];

const accountNavItems = [
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: '/assets/dashboard/user/payment-02.svg' },
  { name: 'Profile', href: '/dashboard/profile', icon: '/assets/dashboard/user/user.svg' },
  { name: 'Settings', href: '/dashboard/settings', icon: '/assets/dashboard/user/setting-07.svg' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  // Admins manage courses via the Admin section — no separate Instructor sidebar section
  const isInstructor = session?.user?.role === 'INSTRUCTOR';


  // When the sidebar is open as an overlay (mobile/tablet), always show full content
  // regardless of the desktop collapsed state
  const effectivelyCollapsed = !!isCollapsed && !isOpen;

  // Close/collapse sidebar whenever a nav link is clicked
  const handleNavClick = () => onClose?.();

  return (
    <aside 
      className={`
        bg-white border-r border-[#E3E8F4] flex flex-col h-screen transition-all duration-300 ease-in-out
        ${isOpen ? 'fixed inset-y-0 left-0 z-[70] translate-x-0 w-[clamp(280px,80vw,300px)]' : 'fixed inset-y-0 -translate-x-full lg:static lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[88px] lg:sticky lg:top-0 lg:z-[50]' : 'lg:w-[clamp(240px,17.07vw,295px)] lg:fixed lg:inset-y-0 lg:left-0 lg:z-[70] xl:static xl:sticky xl:top-0'}
      `}
    >
      {/* Collapse Toggle Button (Laptop only) */}
      <button 
        onClick={() => setIsCollapsed?.(!isCollapsed)}
        className="hidden lg:flex absolute -right-5 top-[242px] w-10 h-10 bg-white border border-[#E3E8F4] rounded-full items-center justify-center text-[#1C4ED1] shadow-[0px_4px_12px_rgba(28,78,209,0.15)] hover:shadow-[0px_6px_16px_rgba(28,78,209,0.25)] hover:scale-110 transition-all z-[80] cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
      </button>

      {/* Logo Area */}
      <div className={`
        h-[96px] lg:h-[clamp(72px,5.56vw,96px)] flex items-center px-[clamp(24px,1.85vw,32px)] border-b border-[#E3E8F4] shrink-0 transition-all
        ${effectivelyCollapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}
      `}>
        <Link href="/" className="bg-[#D7EAFF] p-[clamp(4px,0.5vw,8px)] rounded-sm shrink-0 block hover:opacity-90 transition-opacity">
          <Image
            src="/assets/dashboard/user/Group 162.svg"
            alt="CSCN Logo"
            width={32}
            height={32}
            className="w-[clamp(24px,1.85vw,32px)] h-[clamp(24px,1.85vw,32px)] object-contain"
          />
        </Link>
        {!effectivelyCollapsed && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-[#9CA3AF] hover:text-[#040B37] transition-all"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <div className={`
        flex-1 overflow-y-auto py-[clamp(16px,1.85vw,32px)] space-y-[clamp(24px,2.5vw,40px)] custom-scrollbar transition-all
        ${effectivelyCollapsed ? 'px-4' : 'px-[clamp(16px,1.85vw,32px)]'}
      `}>
        {/* Main Section */}
        <div className="space-y-[clamp(4px,0.46vw,8px)]">
          {!effectivelyCollapsed && <p className="px-[clamp(12px,0.92vw,16px)] py-[clamp(6px,0.46vw,8px)] text-[#9CA3AF] text-[clamp(14px,0.92vw,16px)] font-semibold uppercase tracking-wider">Main</p>}
          <nav className="space-y-[clamp(2px,0.23vw,4px)]">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center rounded-lg transition-all ${effectivelyCollapsed ? 'justify-center p-3' : 'gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)]'} ${
                    isActive
                      ? 'bg-[#1C4ED1]/5 border-l-2 border-[#1C4ED1] text-[#1C4ED1]'
                      : 'text-[#4B5563] hover:bg-[#F4F6FB]'
                  }`}
                  title={effectivelyCollapsed ? item.name : ''}
                >
                  <div
                    className="relative shrink-0"
                    style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
                  >
                    <Image
                      src={item.icon}
                      alt=""
                      fill
                      className={`object-contain transition-all ${isActive ? 'brightness-100' : 'brightness-0 opacity-40'}`}
                    />
                  </div>
                  {!effectivelyCollapsed && <span className="text-[clamp(14px,0.92vw,16px)] font-medium truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Account Section */}
        <div className="space-y-[clamp(4px,0.46vw,8px)]">
          {!effectivelyCollapsed && <p className="px-[clamp(12px,0.92vw,16px)] py-[clamp(6px,0.46vw,8px)] text-[#9CA3AF] text-[clamp(14px,0.92vw,16px)] font-semibold uppercase tracking-wider">Account</p>}
          <nav className="space-y-[clamp(2px,0.23vw,4px)]">
            {accountNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center rounded-lg transition-all ${effectivelyCollapsed ? 'justify-center p-3' : 'gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)]'} ${
                    isActive
                      ? 'bg-[#1C4ED1]/5 border-l-2 border-[#1C4ED1] text-[#1C4ED1]'
                      : 'text-[#4B5563] hover:bg-[#F4F6FB]'
                  }`}
                  title={effectivelyCollapsed ? item.name : ''}
                >
                  <div
                    className="relative shrink-0"
                    style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
                  >
                    <Image
                      src={item.icon}
                      alt=""
                      fill
                      className={`object-contain transition-all ${isActive ? 'brightness-100' : 'brightness-0 opacity-40'}`}
                    />
                  </div>
                  {!effectivelyCollapsed && <span className="text-[clamp(14px,0.92vw,16px)] font-medium truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Instructor Section */}
        {isInstructor && (
          <div className="space-y-[clamp(4px,0.46vw,8px)]">
            {!effectivelyCollapsed && (
              <p className="px-[clamp(12px,0.92vw,16px)] py-[clamp(6px,0.46vw,8px)] text-primary/60 text-[clamp(14px,0.92vw,16px)] font-semibold uppercase tracking-wider">
                Instructor
              </p>
            )}
            <nav className="space-y-[clamp(2px,0.23vw,4px)]">
              {instructorNavItems.map(({ name, href, Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={name}
                    href={href}
                    onClick={handleNavClick}
                    title={effectivelyCollapsed ? name : ''}
                    className={`flex items-center rounded-lg transition-all ${effectivelyCollapsed ? 'justify-center p-3' : 'gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)]'} ${
                      isActive
                        ? 'bg-primary/5 border-l-2 border-primary text-primary'
                        : 'text-text-body hover:bg-background'
                    }`}
                  >
                    <Icon
                      style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
                      className="shrink-0"
                    />
                    {!effectivelyCollapsed && (
                      <span className="text-[clamp(14px,0.92vw,16px)] font-medium truncate">{name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Admin Section — only visible to admins */}
        {isAdmin && (
          <div className="space-y-[clamp(4px,0.46vw,8px)]">
            {!effectivelyCollapsed && (
              <div className="px-[clamp(12px,0.92vw,16px)] py-[clamp(6px,0.46vw,8px)] flex items-center gap-2">
                <p className="text-[#1C4ED1] text-[clamp(14px,0.92vw,16px)] font-bold uppercase tracking-wider">
                  Admin
                </p>
                <span className="h-px flex-1 bg-[#1C4ED1]/20" />
              </div>
            )}
            <nav className="space-y-[clamp(2px,0.23vw,4px)]">
              {adminNavItems.map(({ name, href, Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={name}
                    href={href}
                    onClick={handleNavClick}
                    title={effectivelyCollapsed ? name : ''}
                    className={`flex items-center rounded-lg transition-all ${effectivelyCollapsed ? 'justify-center p-3' : 'gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)]'} ${
                      isActive
                        ? 'bg-[#1C4ED1]/5 border-l-2 border-[#1C4ED1] text-[#1C4ED1]'
                        : 'text-[#4B5563] hover:bg-[#F4F6FB]'
                    }`}
                  >
                    <Icon
                      style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
                      className="shrink-0"
                    />
                    {!effectivelyCollapsed && (
                      <span className="text-[clamp(14px,0.92vw,16px)] font-medium truncate">
                        {name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className={`p-[clamp(16px,1.38vw,24px)] border-t border-[#E3E8F4] transition-all ${effectivelyCollapsed ? 'flex justify-center px-4' : ''}`}>
        <button
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className={`flex items-center text-[#EF4444] hover:bg-red-50 rounded-lg transition-all ${effectivelyCollapsed ? 'p-3' : 'gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)] w-full'}`}
          title={effectivelyCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }} />
          {!effectivelyCollapsed && <span className="text-[clamp(14px,0.92vw,16px)] font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
