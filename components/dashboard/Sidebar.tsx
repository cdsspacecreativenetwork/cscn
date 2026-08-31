'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { logout } from '@/actions/logout';
import {
  BarChart2,
  BookOpen,
  BookPlus,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
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
  UsersRound,
  X,
} from 'lucide-react';
import { hasAnyAdminPermission, type AdminPermissionKey } from '@/lib/admin-permissions';
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
  // Concise label used only by the narrow learner rail; full `name` stays in the tooltip.
  short?: string;
};

const adminOperationItems: NavItem[] = [
  { name: 'Command Center', href: '/dashboard/admin', Icon: LayoutDashboard },
  { name: 'Courses', href: '/dashboard/admin/courses', Icon: Layers, permissions: ['canManageCourses', 'canReviewCourses', 'canPublishCourses'] },
  { name: 'Students', href: '/dashboard/admin/students', Icon: GraduationCap, permissions: ['canManageLearners', 'canManageUsers'] },
  { name: 'Admissions', href: '/dashboard/admin/admissions', Icon: ClipboardCheck, permissions: ['canManageLearners', 'canManageUsers'] },
  { name: 'Project Reviews', href: '/dashboard/admin/project-reviews', Icon: ClipboardList, permissions: ['canManageLearners', 'canManageUsers'] },
  { name: 'Learner Insights', href: '/dashboard/admin/learner-insights', Icon: BarChart2, permissions: ['canManageLearners', 'canManageMarketing', 'canViewAnalytics'] },
  { name: 'Instructors', href: '/dashboard/admin/instructors', Icon: UserCheck, permissions: ['canManageInstructors', 'canVerifyInstructors'] },
  { name: 'Invites', href: '/dashboard/admin/invites', Icon: Link2, permissions: ['canManageInvites', 'canManageUsers'] },
  { name: 'Platform Events', href: '/dashboard/admin/platform-events', Icon: CalendarDays, permissions: ['canManageCourses', 'canManageInstructors', 'canManageSettings'] },
  { name: 'Cohorts', href: '/dashboard/admin/cohorts', Icon: GraduationCap, permissions: ['canManageCohorts'] },
  { name: 'Mentorship', href: '/dashboard/admin/mentorship', Icon: Handshake, permissions: ['canManageInstructors', 'canVerifyInstructors', 'canManageBilling'] },
  { name: 'Community & Career', href: '/dashboard/admin/community-career', Icon: UsersRound, permissions: ['canManageMarketing', 'canManageLearners', 'canManageSettings'] },
  { name: 'Organizations', href: '/dashboard/admin/organizations', Icon: Building2, permissions: ['canManageBilling', 'canManageUsers', 'canViewAnalytics'] },
  { name: 'Announcements', href: '/dashboard/admin/announcements', Icon: Megaphone, permissions: ['canManageAnnouncements'] },
  { name: 'Billing', href: '/dashboard/admin/billing', Icon: CreditCard, permissions: ['canManageBilling'] },
  { name: 'Marketing', href: '/dashboard/admin/marketing', Icon: Tags, permissions: ['canManageMarketing'] },
  { name: 'Permissions', href: '/dashboard/admin/permissions', Icon: ShieldCheck, permissions: ['canManagePermissions'] },
  { name: 'Audit Logs', href: '/dashboard/admin/audit-logs', Icon: FileClock, permissions: ['canViewAuditLogs'] },
  { name: 'Platform Settings', href: '/dashboard/admin/settings', Icon: Settings2, permissions: ['canManageSettings'] },
];

const adminPersonalItems: NavItem[] = [
  { name: 'My Learning', href: '/dashboard/courses', Icon: BookOpen },
  { name: 'My Cohorts', href: '/dashboard/cohorts', Icon: GraduationCap },
  { name: 'Community', href: '/community', Icon: UsersRound },
  { name: 'Career Hub', href: '/dashboard/career', Icon: BriefcaseBusiness },
  { name: 'Organizations', href: '/dashboard/organizations', Icon: Building2 },
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
  { name: 'Cohorts', href: '/dashboard/instructor/cohorts', Icon: GraduationCap },
  { name: 'Live Sessions', href: '/dashboard/instructor/live-sessions', Icon: CalendarDays },
  { name: 'Mentorship', href: '/dashboard/instructor/mentorship', Icon: GraduationCap },
  { name: 'Earnings', href: '/dashboard/instructor/earnings', Icon: CreditCard },
  { name: 'Analytics', href: '/dashboard/instructor/analytics', Icon: BarChart2 },
];

const instructorPersonalItems: NavItem[] = [
  { name: 'My Learning', href: '/dashboard/courses', Icon: BookOpen },
  { name: 'My Cohorts', href: '/dashboard/cohorts', Icon: GraduationCap },
  { name: 'Community', href: '/community', Icon: UsersRound },
  { name: 'Career Hub', href: '/dashboard/career', Icon: BriefcaseBusiness },
  { name: 'Organizations', href: '/dashboard/organizations', Icon: Building2 },
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
  { name: 'My Cohorts', short: 'Cohorts', href: '/dashboard/cohorts', Icon: GraduationCap },
  { name: 'Career Hub', short: 'Career', href: '/dashboard/career', Icon: BriefcaseBusiness },
  { name: 'Organizations', short: 'Orgs', href: '/dashboard/organizations', Icon: Building2 },
  { name: 'My Learning', short: 'Learning', href: '/dashboard/courses', Icon: BookOpen },
  { name: 'Schedule', href: '/dashboard/schedule', Icon: CalendarDays },
  { name: 'My Progress', short: 'Progress', href: '/dashboard/progress', Icon: ClipboardList },
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
      {!collapsed && <span className="text-[clamp(14px,0.92vw,16px)] font-normal truncate">{item.name}</span>}
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

function RailIcon({ item, active }: { item: NavItem; active: boolean }) {
  if (item.Icon) {
    return (
      <item.Icon
        style={{ width: 22, height: 22 }}
        strokeWidth={1.85}
        className="shrink-0 text-current"
      />
    );
  }
  return (
    <span className="relative block shrink-0" style={{ width: 22, height: 22 }}>
      <Image
        src={item.icon ?? '/assets/dashboard/user/dashboard-square-03.svg'}
        alt=""
        fill
        className={cn('object-contain transition-all', active ? 'brightness-0 opacity-100' : 'brightness-0 opacity-60')}
      />
    </span>
  );
}

// ADPList-style rail item: icon stacked above a small caption. Used for the learner rail.
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

function MobileLearnerNavigation({
  mainItems,
  pathname,
  onNavigate,
  onLogout,
}: {
  mainItems: NavItem[];
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  const renderItems = (items: NavItem[]) => items.map((item) => {
    const active = isActivePath(pathname, item.href);
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          active ? 'bg-primary/10 text-primary' : 'text-text-body hover:bg-background hover:text-navy',
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
        <section aria-labelledby="learner-main-navigation" className="flex flex-col gap-2">
          <h2 id="learner-main-navigation" className="px-3 text-xs font-semibold text-text-mute">Main</h2>
          <nav aria-label="Learner navigation" className="flex flex-col gap-1">
            {renderItems(mainItems)}
          </nav>
        </section>
        <section aria-labelledby="learner-account-navigation" className="flex flex-col gap-2">
          <h2 id="learner-account-navigation" className="px-3 text-xs font-semibold text-text-mute">Account</h2>
          <nav aria-label="Account navigation" className="flex flex-col gap-1">
            {renderItems(learnerAccountItems)}
          </nav>
        </section>
      </div>
      <div className="border-t border-stroke p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <LogOut className="size-[22px]" strokeWidth={1.85} />
          Log out
        </button>
      </div>
    </>
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

  const handleLogout = () => {
    onClose?.();
    logout().catch(() => {
      signOut({ callbackUrl: '/signin' }).finally(() => {
        window.location.href = '/signin';
      });
    });
  };

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

  const isLearner = !isAdmin && !isInstructor;

  // Learner view uses an ADPList-style permanent narrow rail (icon above a small
  // caption), independent of the admin/instructor collapse behaviour.
  if (isLearner) {
    return (
      <>
        <Sheet open={Boolean(isOpen)} onOpenChange={(open) => { if (!open) onClose?.(); }}>
          <SheetContent side="left" style={{ width: 280, maxWidth: 'calc(100vw - 2rem)' }} className="gap-0 p-0 min-[900px]:hidden">
            <SheetHeader className="flex h-[72px] flex-row items-center border-b border-stroke px-4 py-0">
              <Link
                href="/"
                onClick={handleNavClick}
                className="rounded-md bg-[#D7EAFF] p-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Image src="/assets/dashboard/user/Group 162.svg" alt="CSCN home" width={30} height={30} />
              </Link>
              <div>
                <SheetTitle className="text-base font-semibold text-navy">Learner dashboard</SheetTitle>
                <SheetDescription className="text-xs font-normal">Navigate your learning workspace</SheetDescription>
              </div>
            </SheetHeader>
            <MobileLearnerNavigation
              mainItems={learnerMainItems}
              pathname={pathname}
              onNavigate={handleNavClick}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>
        <TooltipProvider delay={300}>
        <aside
          className="sticky top-0 hidden h-screen w-[clamp(76px,5.2vw,88px)] flex-col border-r border-[#E3E8F4] bg-white min-[900px]:flex"
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

          <div className="custom-scrollbar flex-1 overflow-y-auto px-2 py-4">
            <nav className="flex flex-col gap-1">
              {learnerMainItems.map((item) => (
                <RailItem
                  key={item.name}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  onClick={handleNavClick}
                />
              ))}
              <div className="mx-auto my-2 h-px w-8 bg-[#E3E8F4]" />
              {learnerAccountItems.map((item) => (
                <RailItem
                  key={item.name}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  onClick={handleNavClick}
                />
              ))}
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
  }

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
          h-[clamp(60px,4.17vw,72px)] flex items-center px-[clamp(20px,1.62vw,28px)] border-b border-[#E3E8F4] shrink-0 transition-all
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
          type="button"
          onClick={handleLogout}
          className={`flex items-center text-[#EF4444] hover:bg-red-50 rounded-lg transition-all cursor-pointer ${
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
