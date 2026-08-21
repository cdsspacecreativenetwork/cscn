'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { logout } from '@/actions/logout';
import {
  BookOpen,
  ChevronDown,
  Compass,
  LogIn,
  LogOut,
  Settings,
} from 'lucide-react';
import { generateTapbackAvatar } from '@/lib/avatar';
import Button from '@/components/ui/Button';

type UserAvatarMenuProps = {
  showUserText?: boolean;
  align?: 'left' | 'right';
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    onboardingCohort?: string | null;
  } | null;
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  INSTRUCTOR: 'Instructor',
  USER: 'Student',
};

export function UserAvatarMenu({ showUserText = true, align = 'right', user: userProp }: UserAvatarMenuProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const sessionUser = userProp ?? session?.user ?? null;
  const isAuthenticated = !!sessionUser?.email || status === 'authenticated';
  const displayName = sessionUser?.name || sessionUser?.email?.split('@')[0] || 'Guest learner';
  const email = sessionUser?.email || 'Sign in to continue learning';
  const roleLabel = roleLabels[(sessionUser?.role as string) ?? ''] ?? 'Student';
  const isPioneerStudent = Boolean(sessionUser?.onboardingCohort);
  const fallbackAvatar = generateTapbackAvatar(displayName);
  const [imgSrc, setImgSrc] = React.useState(sessionUser?.image || fallbackAvatar);

  const handleLogout = () => {
    setIsOpen(false);
    logout().catch(() => {
      signOut({ callbackUrl: '/signin' }).finally(() => {
        window.location.href = '/signin';
      });
    });
  };

  React.useEffect(() => {
    queueMicrotask(() => setImgSrc(sessionUser?.image || fallbackAvatar));
  }, [fallbackAvatar, sessionUser?.image]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const menuItems = isAuthenticated
    ? [
        { href: '/dashboard/courses', label: 'My Learning', Icon: BookOpen },
        { href: '/courses', label: 'Explore Courses', Icon: Compass },
        { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
      ]
    : [
        { href: '/signin', label: 'Sign in', Icon: LogIn, strong: true },
        { href: '/courses', label: 'Explore Courses', Icon: Compass },
      ];

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="group flex items-center gap-3 rounded-[8px] px-2 py-1.5 transition hover:bg-[#F4F6FB] sm:gap-4 sm:pr-4"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
      >
        <div className="h-[clamp(36px,2.55vw,44px)] w-[clamp(36px,2.55vw,44px)] shrink-0 overflow-hidden rounded-full border-2 border-[#1C4ED1] bg-[#E3E8F4]">
          <Image
            src={imgSrc}
            alt={displayName}
            width={44}
            height={44}
            className="h-full w-full object-cover"
            onError={() => setImgSrc(fallbackAvatar)}
          />
        </div>
        {showUserText && (
          <div className="hidden min-w-0 text-left sm:block">
            <div className="flex min-w-0 items-center gap-2">
              <p className="max-w-[160px] truncate text-[clamp(14px,1.04vw,18px)] font-semibold text-[#040B37]">
                {displayName}
              </p>
              {isPioneerStudent && (
                <span className="group/badge relative inline-flex shrink-0">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-[#BFD1FF] bg-[linear-gradient(135deg,#EEF3FF_0%,#FFFFFF_54%,#DDE7FF_100%)] text-[10px] font-black text-[#1C4ED1] shadow-[0_3px_10px_rgba(28,78,209,0.18)] ring-2 ring-white"
                    aria-label="Pioneer Student"
                  >
                    P
                  </span>
                  <span className="pointer-events-none absolute right-1/2 top-[calc(100%+8px)] z-[100] translate-x-1/2 whitespace-nowrap rounded-[8px] border border-[#D8E0EF] bg-white px-3 py-2 text-[12px] font-semibold text-[#040B37] opacity-0 shadow-[0_14px_34px_rgba(4,11,55,0.12)] transition group-hover/badge:opacity-100 group-focus-within/badge:opacity-100">
                    Pioneer Student
                  </span>
                </span>
              )}
            </div>
            <p className="text-[clamp(11px,0.81vw,14px)] font-medium text-[#4B5563]">{roleLabel}</p>
          </div>
        )}
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className={`ml-0 shrink-0 text-[#9CA3AF] transition ${isOpen ? 'rotate-180 text-[#040B37]' : 'group-hover:text-[#040B37]'}`}
        />
      </button>

      {isOpen && (
        <div
          className={`fixed right-4 top-[76px] z-[90] w-[calc(100vw-2rem)] max-w-[330px] rounded-[20px] border border-[#E3E8F4] bg-white p-3 shadow-[0_24px_70px_rgba(4,11,55,0.18)] sm:absolute sm:top-[calc(100%+10px)] sm:w-[min(84vw,320px)] ${
            align === 'right' ? 'sm:right-0' : 'sm:left-0'
          }`}
        >
          <div className="flex flex-col items-center rounded-[18px] bg-[#F4F6FB] px-4 py-4 text-center">
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-[#E3E8F4] shadow-sm">
              <Image
                src={imgSrc}
                alt={displayName}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                onError={() => setImgSrc(fallbackAvatar)}
              />
            </div>
            <p className="mt-2 max-w-full truncate text-base font-semibold text-[#040B37]">{displayName}</p>
            {isPioneerStudent && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#D8E0EF] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#1C4ED1] shadow-sm">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#BFD1FF] bg-[#EEF3FF] text-[9px] leading-none">
                  P
                </span>
                Pioneer Student
              </div>
            )}
            <p className="custom-scrollbar mt-0.5 max-w-full overflow-x-auto whitespace-nowrap text-xs font-semibold text-[#64748B]">{email}</p>
            <Link href={isAuthenticated ? '/dashboard/profile' : '/signin'} className="mt-3 w-full" onClick={() => setIsOpen(false)}>
              <Button variant="outline" rounded="[12px]" className="w-full px-4! py-2.5! text-sm! border-[#1C4ED1]! text-[#1C4ED1]! hover:bg-[#1C4ED1]/5!">
                {isAuthenticated ? 'View Profile' : 'Sign in'}
              </Button>
            </Link>
          </div>

          <div className="mt-2 space-y-1 border-t border-[#E3E8F4] pt-2">
            {menuItems.map(({ href, label, Icon, strong }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] transition hover:bg-[#F4F6FB] ${
                  strong ? 'font-semibold text-[#040B37]' : 'font-medium text-[#334155]'
                }`}
              >
                <Icon size={15} strokeWidth={1.65} className="text-[#1C4ED1]" />
                {label}
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <div className="mt-2 border-t border-[#E3E8F4] pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={15} strokeWidth={1.65} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
