import React from 'react';
import {
  BarChart2,
  BookOpen,
  BookPlus,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileClock,
  GraduationCap,
  Handshake,
  Layers,
  LayoutDashboard,
  Library,
  Link2,
  Megaphone,
  Settings,
  Settings2,
  ShieldCheck,
  Tags,
  User,
  UserCheck,
  UserCog,
  UsersRound,
} from 'lucide-react';
import type { AdminPermissionKey } from '@/lib/admin-permissions';

export type NavItem = {
  name: string;
  href: string;
  Icon: React.ComponentType<{
    size?: number;
    className?: string;
    style?: React.CSSProperties;
    strokeWidth?: number;
  }>;
  short?: string;
  permissions?: AdminPermissionKey[];
  section?: 'main' | 'studio' | 'operations' | 'account';
};

export const studentMainItems: NavItem[] = [
  { name: 'Overview', short: 'Overview', href: '/dashboard', Icon: LayoutDashboard, section: 'main' },
  { name: 'My Cohorts', short: 'Cohorts', href: '/dashboard/cohorts', Icon: GraduationCap, section: 'main' },
  { name: 'Career Hub', short: 'Career', href: '/dashboard/career', Icon: BriefcaseBusiness, section: 'main' },
  { name: 'Organizations', short: 'Orgs', href: '/dashboard/organizations', Icon: Building2, section: 'main' },
  { name: 'My Learning', short: 'Learning', href: '/dashboard/courses', Icon: BookOpen, section: 'main' },
  { name: 'Schedule', short: 'Schedule', href: '/dashboard/schedule', Icon: CalendarDays, section: 'main' },
  { name: 'My Progress', short: 'Progress', href: '/dashboard/progress', Icon: ClipboardList, section: 'main' },
  { name: 'Resources', short: 'Resources', href: '/dashboard/resources', Icon: Library, section: 'main' },
];

export const studentAccountItems: NavItem[] = [
  { name: 'Purchases', short: 'Purchases', href: '/dashboard/purchases', Icon: CreditCard, section: 'account' },
  { name: 'Profile', short: 'Profile', href: '/dashboard/profile', Icon: User, section: 'account' },
  { name: 'Settings', short: 'Settings', href: '/dashboard/settings', Icon: Settings, section: 'account' },
];

export const instructorStudioItems: NavItem[] = [
  { name: 'Overview', short: 'Overview', href: '/dashboard/instructor', Icon: LayoutDashboard, section: 'studio' },
  { name: 'Courses', short: 'Courses', href: '/dashboard/instructor/courses', Icon: BookPlus, section: 'studio' },
  { name: 'Live Sessions', short: 'Sessions', href: '/dashboard/instructor/live-sessions', Icon: CalendarDays, section: 'studio' },
  { name: 'Mentorship', short: 'Mentorship', href: '/dashboard/instructor/mentorship', Icon: Handshake, section: 'studio' },
  { name: 'Earnings', short: 'Earnings', href: '/dashboard/instructor/earnings', Icon: CreditCard, section: 'studio' },
  { name: 'Analytics', short: 'Analytics', href: '/dashboard/instructor/analytics', Icon: BarChart2, section: 'studio' },
];

export const instructorAccountItems: NavItem[] = [
  { name: 'Profile', short: 'Profile', href: '/dashboard/profile', Icon: User, section: 'account' },
  { name: 'Settings', short: 'Settings', href: '/dashboard/settings', Icon: Settings, section: 'account' },
];

export const adminOperationItems: NavItem[] = [
  { name: 'Command Center', short: 'Center', href: '/dashboard/admin', Icon: LayoutDashboard, section: 'operations' },
  { name: 'Courses', short: 'Courses', href: '/dashboard/admin/courses', Icon: Layers, permissions: ['canManageCourses', 'canReviewCourses', 'canPublishCourses'], section: 'operations' },
  { name: 'Students', short: 'Students', href: '/dashboard/admin/students', Icon: GraduationCap, permissions: ['canManageLearners', 'canManageUsers'], section: 'operations' },
  { name: 'Admissions', short: 'Admissions', href: '/dashboard/admin/admissions', Icon: ClipboardCheck, permissions: ['canManageLearners', 'canManageUsers'], section: 'operations' },
  { name: 'Project Reviews', short: 'Reviews', href: '/dashboard/admin/project-reviews', Icon: ClipboardList, permissions: ['canManageLearners', 'canManageUsers'], section: 'operations' },
  { name: 'Learner Insights', short: 'Insights', href: '/dashboard/admin/learner-insights', Icon: BarChart2, permissions: ['canManageLearners', 'canManageMarketing', 'canViewAnalytics'], section: 'operations' },
  { name: 'Instructors', short: 'Instructors', href: '/dashboard/admin/instructors', Icon: UserCheck, permissions: ['canManageInstructors', 'canVerifyInstructors'], section: 'operations' },
  { name: 'Invites', short: 'Invites', href: '/dashboard/admin/invites', Icon: Link2, permissions: ['canManageInvites', 'canManageUsers'], section: 'operations' },
  { name: 'Platform Events', short: 'Events', href: '/dashboard/admin/platform-events', Icon: CalendarDays, permissions: ['canManageCourses', 'canManageInstructors', 'canManageSettings'], section: 'operations' },
  { name: 'Mentorship', short: 'Mentorship', href: '/dashboard/admin/mentorship', Icon: Handshake, permissions: ['canManageInstructors', 'canVerifyInstructors', 'canManageBilling'], section: 'operations' },
  { name: 'Community & Career', short: 'Community', href: '/dashboard/admin/community-career', Icon: UsersRound, permissions: ['canManageMarketing', 'canManageLearners', 'canManageSettings'], section: 'operations' },
  { name: 'Organizations', short: 'Orgs', href: '/dashboard/admin/organizations', Icon: Building2, permissions: ['canManageBilling', 'canManageUsers', 'canViewAnalytics'], section: 'operations' },
  { name: 'Announcements', short: 'Announce', href: '/dashboard/admin/announcements', Icon: Megaphone, permissions: ['canManageAnnouncements'], section: 'operations' },
  { name: 'Billing', short: 'Billing', href: '/dashboard/admin/billing', Icon: CreditCard, permissions: ['canManageBilling'], section: 'operations' },
  { name: 'Marketing', short: 'Marketing', href: '/dashboard/admin/marketing', Icon: Tags, permissions: ['canManageMarketing'], section: 'operations' },
  { name: 'Permissions', short: 'Permissions', href: '/dashboard/admin/permissions', Icon: ShieldCheck, permissions: ['canManagePermissions'], section: 'operations' },
  { name: 'Audit Logs', short: 'Audit', href: '/dashboard/admin/audit-logs', Icon: FileClock, permissions: ['canViewAuditLogs'], section: 'operations' },
  { name: 'Platform Settings', short: 'Platform Settings', href: '/dashboard/admin/settings', Icon: Settings2, permissions: ['canManageSettings'], section: 'operations' },
];

export const adminAccountItems: NavItem[] = [
  { name: 'Profile', short: 'Profile', href: '/dashboard/profile', Icon: User, section: 'account' },
  { name: 'Personal Settings', short: 'Personal Settings', href: '/dashboard/settings', Icon: UserCog, section: 'account' },
];
