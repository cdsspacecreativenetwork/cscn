'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
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
  const fallbackAvatar = generateTapbackAvatar(displayName);
  const [imgSrc, setImgSrc] = React.useState(sessionUser?.image || fallbackAvatar);

  React.useEffect(() => {
    setImgSrc(sessionUser?.image || fallbackAvatar);
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
        className="group flex items-center gap-1.5 rounded-full p-1 transition hover:bg-[#F4F6FB] sm:gap-3"
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
            <p className="max-w-[160px] truncate text-[clamp(14px,1.04vw,18px)] font-semibold text-[#040B37]">
              {displayName}
            </p>
            <p className="text-[clamp(11px,0.81vw,14px)] font-medium text-[#4B5563]">{roleLabel}</p>
          </div>
        )}
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className={`text-[#9CA3AF] transition ${isOpen ? 'rotate-180 text-[#040B37]' : 'group-hover:text-[#040B37]'}`}
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
            <p className="mt-2 max-w-full truncate text-base font-black text-[#040B37]">{displayName}</p>
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
                className={`flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-[13px] transition hover:bg-[#F4F6FB] ${
                  strong ? 'font-black text-[#040B37]' : 'font-semibold text-[#334155]'
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
                onClick={() => signOut({ callbackUrl: '/signin' })}
                className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-[13px] font-bold text-red-600 transition hover:bg-red-50"
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
