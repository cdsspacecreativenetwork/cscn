'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  BarChart2,
  BookOpen,
  BookPlus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileClock,
  GraduationCap,
  Handshake,
  Layers,
  LayoutDashboard,
  Library,
  Link2,
  LogOut,
  Megaphone,
  Settings,
  Settings2,
  ShieldCheck,
  Tags,
  User,
  UserCog,
  UserCheck,
  X,
} from 'lucide-react';
import { hasAnyAdminPermission, type AdminPermissionKey } from '@/lib/admin-permissions';

type IconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}>;

type NavItem = {
  name: string;
  href: string;
  Icon?: IconComponent;
  icon?: string;
  permissions?: AdminPermissionKey[];
};

const adminOperationItems: NavItem[] = [
  { name: 'Command Center', href: '/dashboard/admin', Icon: LayoutDashboard },
  { name: 'Courses', href: '/dashboard/admin/courses', Icon: Layers, permissions: ['canManageCourses', 'canReviewCourses', 'canPublishCourses'] },
  { name: 'Students', href: '/dashboard/admin/students', Icon: GraduationCap, permissions: ['canManageLearners', 'canManageUsers'] },
  { name: 'Instructors', href: '/dashboard/admin/instructors', Icon: UserCheck, permissions: ['canManageInstructors', 'canVerifyInstructors'] },
  { name: 'Invites', href: '/dashboard/admin/invites', Icon: Link2, permissions: ['canManageInvites', 'canManageUsers'] },
  { name: 'Platform Events', href: '/dashboard/admin/platform-events', Icon: CalendarDays, permissions: ['canManageCourses', 'canManageInstructors', 'canManageSettings'] },
  { name: 'Mentorship', href: '/dashboard/admin/mentorship', Icon: Handshake, permissions: ['canManageInstructors', 'canVerifyInstructors', 'canManageBilling'] },
  { name: 'Announcements', href: '/dashboard/admin/announcements', Icon: Megaphone, permissions: ['canManageAnnouncements'] },
  { name: 'Billing', href: '/dashboard/admin/billing', Icon: CreditCard, permissions: ['canManageBilling'] },
  { name: 'Marketing', href: '/dashboard/admin/marketing', Icon: Tags, permissions: ['canManageMarketing'] },
  { name: 'Permissions', href: '/dashboard/admin/permissions', Icon: ShieldCheck, permissions: ['canManagePermissions'] },
  { name: 'Audit Logs', href: '/dashboard/admin/audit-logs', Icon: FileClock, permissions: ['canViewAuditLogs'] },
  { name: 'Platform Settings', href: '/dashboard/admin/settings', Icon: Settings2, permissions: ['canManageSettings'] },
];

const adminPersonalItems: NavItem[] = [
  { name: 'My Learning', href: '/dashboard/courses', Icon: BookOpen },
  { name: 'Instructor Studio', href: '/dashboard/instructor/courses', Icon: BookPlus },
  { name: 'Schedule', href: '/dashboard/schedule', Icon: CalendarDays },
  { name: 'My Progress', href: '/dashboard/progress', Icon: ClipboardList },
  { name: 'Resources', href: '/dashboard/resources', Icon: Library },
  { name: 'Purchases', href: '/dashboard/purchases', Icon: CreditCard },
];

const adminAccountItems: NavItem[] = [
  { name: 'Profile', href: '/dashboard/profile', Icon: User },
  { name: 'Personal Settings', href: '/dashboard/settings', Icon: UserCog },
];

const instructorItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard', Icon: LayoutDashboard },
  { name: 'Courses', href: '/dashboard/instructor/courses', Icon: BookPlus },
  { name: 'Live Sessions', href: '/dashboard/instructor/live-sessions', Icon: CalendarDays },
  { name: 'Mentorship', href: '/dashboard/instructor/mentorship', Icon: GraduationCap },
  { name: 'Earnings', href: '/dashboard/instructor/earnings', Icon: CreditCard },
  { name: 'Analytics', href: '/dashboard/instructor/analytics', Icon: BarChart2 },
];

const instructorPersonalItems: NavItem[] = [
  { name: 'My Learning', href: '/dashboard/courses', Icon: BookOpen },
  { name: 'Schedule', href: '/dashboard/schedule', Icon: CalendarDays },
  { name: 'My Progress', href: '/dashboard/progress', Icon: ClipboardList },
  { name: 'Resources', href: '/dashboard/resources', Icon: Library },
  { name: 'Purchases', href: '/dashboard/purchases', Icon: CreditCard },
];

const instructorAccountItems: NavItem[] = [
  { name: 'Profile', href: '/dashboard/profile', Icon: User },
  { name: 'Settings', href: '/dashboard/settings', Icon: Settings },
];

const learnerItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard', Icon: LayoutDashboard },
  { name: 'My Learning', href: '/dashboard/courses', Icon: BookOpen },
  { name: 'Schedule', href: '/dashboard/schedule', Icon: CalendarDays },
  { name: 'My Progress', href: '/dashboard/progress', Icon: ClipboardList },
  { name: 'Resources', href: '/dashboard/resources', Icon: Library },
];

const learnerAccountItems: NavItem[] = [
  { name: 'Purchases', href: '/dashboard/purchases', Icon: CreditCard },
  { name: 'Profile', href: '/dashboard/profile', Icon: User },
  { name: 'Settings', href: '/dashboard/settings', Icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/dashboard/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({
  item,
  collapsed,
  active,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center rounded-[8px] transition-all ${
        collapsed
          ? 'justify-center p-3'
          : 'gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)]'
      } ${
        active
          ? 'bg-[#1C4ED1]/5 text-[#1C4ED1]'
          : 'text-[#4B5563] hover:bg-[#F4F6FB]'
      }`}
      title={collapsed ? item.name : ''}
    >
      {item.Icon ? (
        <item.Icon
          style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
          strokeWidth={1.85}
          className="shrink-0 text-current"
        />
      ) : (
        <div
          className="relative shrink-0"
          style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
        >
          <Image
            src={item.icon ?? '/assets/dashboard/user/dashboard-square-03.svg'}
            alt=""
            fill
            className={`object-contain transition-all ${active ? 'brightness-0 opacity-100' : 'brightness-0 opacity-60'}`}
          />
        </div>
      )}
      {!collapsed && <span className="text-[clamp(14px,0.92vw,16px)] font-medium truncate">{item.name}</span>}
    </Link>
  );
}

function SidebarSection({
  label,
  items,
  collapsed,
  pathname,
  onClick,
  accent = false,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <div className="space-y-[clamp(4px,0.46vw,8px)]">
      {!collapsed && (
        <div className="px-[clamp(12px,0.92vw,16px)] py-[clamp(6px,0.46vw,8px)] flex items-center gap-2">
          <p
            className={`text-[clamp(13px,0.81vw,14px)] font-normal uppercase tracking-wider ${
              accent ? 'text-[#1C4ED1]' : 'text-[#9CA3AF]'
            }`}
          >
            {label}
          </p>
          {accent && <span className="h-px flex-1 bg-[#1C4ED1]/20" />}
        </div>
      )}
      <nav className="space-y-[clamp(2px,0.23vw,4px)]">
        {items.map((item) => (
          <SidebarLink
            key={item.name}
            item={item}
            collapsed={collapsed}
            active={isActivePath(pathname, item.href)}
            onClick={onClick}
          />
        ))}
      </nav>
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [hasCourseCollaborations, setHasCourseCollaborations] = React.useState(false);
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isInstructor = role === 'INSTRUCTOR';
  const effectivelyCollapsed = !!isCollapsed && !isOpen;
  const handleNavClick = () => onClose?.();
  const visibleAdminOperationItems = adminOperationItems.filter((item) => {
    if (!item.permissions) return true;
    return hasAnyAdminPermission(session?.user, item.permissions);
  });
  const learnerMainItems = hasCourseCollaborations
    ? [
        ...learnerItems,
        { name: 'Studio', href: '/dashboard/instructor/courses', Icon: BookPlus },
      ]
    : learnerItems;

  React.useEffect(() => {
    if (!session?.user?.id || isAdmin || isInstructor) {
      queueMicrotask(() => setHasCourseCollaborations(false));
      return;
    }

    let cancelled = false;
    fetch('/api/me/course-collaborations')
      .then((res) => (res.ok ? res.json() : { hasCourseCollaborations: false }))
      .then((data) => {
        if (!cancelled) setHasCourseCollaborations(Boolean(data.hasCourseCollaborations));
      })
      .catch(() => {
        if (!cancelled) setHasCourseCollaborations(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, isAdmin, isInstructor]);

  return (
    <aside
      className={`
        bg-white border-r border-[#E3E8F4] flex flex-col h-screen transition-all duration-300 ease-in-out
        ${isOpen ? 'fixed inset-y-0 left-0 z-[70] translate-x-0 w-[clamp(280px,80vw,300px)]' : 'fixed inset-y-0 -translate-x-full lg:static lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[88px] lg:sticky lg:top-0 lg:z-[50]' : 'lg:w-[clamp(240px,17.07vw,295px)] lg:fixed lg:inset-y-0 lg:left-0 lg:z-[70] xl:static xl:sticky xl:top-0'}
      `}
    >
      <button
        onClick={() => setIsCollapsed?.(!isCollapsed)}
        className="hidden lg:flex absolute -right-5 top-[242px] w-10 h-10 bg-white border border-[#E3E8F4] rounded-full items-center justify-center text-[#1C4ED1] shadow-[0px_4px_12px_rgba(28,78,209,0.15)] hover:shadow-[0px_6px_16px_rgba(28,78,209,0.25)] hover:scale-110 transition-all z-[80] cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
      </button>

      <div
        className={`
          h-[72px] lg:h-[72px] flex items-center px-[clamp(20px,1.62vw,28px)] border-b border-[#E3E8F4] shrink-0 transition-all
          ${effectivelyCollapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}
        `}
      >
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
          <button onClick={onClose} className="lg:hidden p-2 text-[#9CA3AF] hover:text-[#040B37] transition-all">
            <X size={24} />
          </button>
        )}
      </div>

      <div
        className={`
          flex-1 overflow-y-auto py-[clamp(16px,1.62vw,28px)] space-y-[clamp(22px,2.08vw,36px)] custom-scrollbar transition-all
          ${effectivelyCollapsed ? 'px-4' : 'px-[clamp(16px,1.85vw,32px)]'}
        `}
      >
       {isAdmin ? (
          <>
            <SidebarSection
              label="Operations"
              items={visibleAdminOperationItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
            <SidebarSection
              label="Personal"
              items={adminPersonalItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
            <SidebarSection
              label="Account"
              items={adminAccountItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
          </>
        ) : isInstructor ? (
          <>
            <SidebarSection
              label="Studio"
              items={instructorItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
            <SidebarSection
              label="Personal"
              items={instructorPersonalItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
            <SidebarSection
              label="Account"
              items={instructorAccountItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
          </>
        ) : (
          <>
            <SidebarSection
              label="Main"
              items={learnerMainItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
            <SidebarSection
              label="Account"
              items={learnerAccountItems}
              collapsed={effectivelyCollapsed}
              pathname={pathname}
              onClick={handleNavClick}
            />
          </>
        )}
      </div>

      <div className={`p-[clamp(16px,1.38vw,24px)] border-t border-[#E3E8F4] transition-all ${effectivelyCollapsed ? 'flex justify-center px-4' : ''}`}>
        <button
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className={`flex items-center text-[#EF4444] hover:bg-red-50 rounded-lg transition-all ${
            effectivelyCollapsed ? 'p-3' : 'gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)] w-full'
          }`}
          title={effectivelyCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }} />
          {!effectivelyCollapsed && <span className="text-[clamp(14px,0.92vw,16px)] font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
