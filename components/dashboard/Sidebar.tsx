'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { logout } from '@/actions/logout';
import { LogOut } from 'lucide-react';
import { hasAnyAdminPermission } from '@/lib/admin-permissions';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  NavItem,
  studentMainItems,
  studentAccountItems,
  instructorStudioItems,
  instructorAccountItems,
  adminOperationItems,
  adminAccountItems,
} from '@/lib/nav-config';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

function isActivePath(pathname: string, href: string) {
  if (href === '/student' || href === '/instructor' || href === '/admin' || href === '/dashboard' || href === '/dashboard/admin' || href === '/dashboard/instructor') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function RailIcon({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.Icon;
  return (
    <Icon
      size={22}
      strokeWidth={active ? 2.1 : 1.85}
      className={cn('shrink-0 transition-colors', active ? 'text-[#1C4ED1]' : 'text-[#4B5563]')}
    />
  );
}

function RailItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={item.href}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-[10px] px-1 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              active ? 'bg-[#1C4ED1]/5 text-[#1C4ED1]' : 'text-[#4B5563] hover:bg-[#F4F6FB]',
            )}
          >
            <RailIcon item={item} active={active} />
            <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight break-words">
              {item.short ?? item.name}
            </span>
          </Link>
        }
      />
      <TooltipContent side="right" sideOffset={8}>
        {item.name}
      </TooltipContent>
    </Tooltip>
  );
}

function MobileNavigation({
  mainItems,
  accountItems,
  workspaceTitle,
  pathname,
  onNavigate,
  onLogout,
}: {
  mainItems: NavItem[];
  accountItems: NavItem[];
  workspaceTitle: string;
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  const renderGroup = (items: NavItem[]) =>
    items.map((item) => {
      const active = isActivePath(pathname, item.href);
      return (
        <Link
          key={item.name}
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            active ? 'bg-[#1C4ED1]/10 text-[#1C4ED1]' : 'text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]',
          )}
        >
          <RailIcon item={item} active={active} />
          <span>{item.name}</span>
        </Link>
      );
    });

  return (
    <>
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
        <section aria-label="Primary Navigation" className="flex flex-col gap-2">
          <h2 className="px-3 text-xs font-semibold text-[#64748B]">{workspaceTitle}</h2>
          <nav aria-label="Main navigation" className="flex flex-col gap-1">
            {renderGroup(mainItems)}
          </nav>
        </section>
        {accountItems.length > 0 && (
          <section aria-label="Account Navigation" className="flex flex-col gap-2">
            <h2 className="px-3 text-xs font-semibold text-[#64748B]">Account</h2>
            <nav aria-label="Account navigation" className="flex flex-col gap-1">
              {renderGroup(accountItems)}
            </nav>
          </section>
        )}
      </div>
      <div className="border-t border-[#E3E8F4] p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <LogOut className="size-[22px]" strokeWidth={1.85} />
          Log out
        </button>
      </div>
    </>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const handleNavClick = () => onClose?.();

  const handleLogout = () => {
    onClose?.();
    logout().catch(() => {
      signOut({ callbackUrl: '/signin' }).finally(() => {
        window.location.href = '/signin';
      });
    });
  };

  // Determine active view context from pathname
  const isAdminPath = pathname.startsWith('/dashboard/admin') || pathname.startsWith('/admin');
  const isInstructorPath = pathname.startsWith('/dashboard/instructor') || pathname.startsWith('/instructor');

  let mainItems: NavItem[] = studentMainItems;
  let accountItems: NavItem[] = studentAccountItems;
  let workspaceTitle = 'Learner Workspace';

  if (isAdminPath && isAdmin) {
    mainItems = adminOperationItems.filter((item) => {
      if (!item.permissions) return true;
      return hasAnyAdminPermission(session?.user, item.permissions);
    });
    accountItems = adminAccountItems;
    workspaceTitle = 'Admin Command Center';
  } else if (isInstructorPath) {
    mainItems = instructorStudioItems;
    accountItems = instructorAccountItems;
    workspaceTitle = 'Instructor Workspace';
  }

  return (
    <>
      {/* Mobile Drawer Navigation */}
      <Sheet open={Boolean(isOpen)} onOpenChange={(open) => { if (!open) onClose?.(); }}>
        <SheetContent side="left" style={{ width: 280, maxWidth: 'calc(100vw - 2rem)' }} className="gap-0 p-0 min-[900px]:hidden">
          <SheetHeader className="flex h-[72px] flex-row items-center border-b border-[#E3E8F4] px-4 py-0">
            <Link
              href="/"
              onClick={handleNavClick}
              className="rounded-md bg-[#D7EAFF] p-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Image src="/assets/dashboard/user/Group 162.svg" alt="CSCN home" width={30} height={30} />
            </Link>
            <div className="ml-3">
              <SheetTitle className="text-base font-semibold text-[#040B37]">{workspaceTitle}</SheetTitle>
              <SheetDescription className="text-xs font-normal">CSCN Platform Workspace</SheetDescription>
            </div>
          </SheetHeader>
          <MobileNavigation
            mainItems={mainItems}
            accountItems={accountItems}
            workspaceTitle={workspaceTitle}
            pathname={pathname}
            onNavigate={handleNavClick}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop ADPList-Style Slim Rail Sidebar */}
      <TooltipProvider delay={300}>
        <aside
          className="sticky top-0 hidden h-screen w-[clamp(76px,5.2vw,88px)] flex-col border-r border-[#E3E8F4] bg-white min-[900px]:flex z-[60]"
        >
          <div className="relative flex h-[clamp(60px,4.17vw,72px)] shrink-0 items-center justify-center border-b border-[#E3E8F4] px-2">
            <Link
              href="/"
              className="block shrink-0 rounded-sm bg-[#D7EAFF] p-[clamp(4px,0.5vw,8px)] transition-opacity hover:opacity-90"
            >
              <Image
                src="/assets/dashboard/user/Group 162.svg"
                alt="CSCN Logo"
                width={32}
                height={32}
                className="h-[clamp(22px,1.7vw,30px)] w-[clamp(22px,1.7vw,30px)] object-contain"
              />
            </Link>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto py-4">
            <nav className="flex flex-col gap-1">
              {mainItems.map((item) => (
                <RailItem
                  key={item.name}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  onClick={handleNavClick}
                />
              ))}
              {accountItems.length > 0 && (
                <>
                  <div className="mx-auto my-2 h-px w-8 bg-[#E3E8F4]" />
                  {accountItems.map((item) => (
                    <RailItem
                      key={item.name}
                      item={item}
                      active={isActivePath(pathname, item.href)}
                      onClick={handleNavClick}
                    />
                  ))}
                </>
              )}
            </nav>
          </div>

          <div className="shrink-0 border-t border-[#E3E8F4] p-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] px-1 py-2.5 text-[#EF4444] transition-colors hover:bg-red-50"
                  >
                    <LogOut style={{ width: 22, height: 22 }} strokeWidth={1.85} className="shrink-0" />
                    <span className="w-full truncate text-center text-[10px] font-medium leading-tight">Logout</span>
                  </button>
                }
              />
              <TooltipContent side="right" sideOffset={8}>
                Log out
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>
    </>
  );
};
