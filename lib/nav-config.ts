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
  { name: 'Overview', short: 'Overview', href: '/student', Icon: LayoutDashboard, section: 'main' },
  { name: 'My Cohorts', short: 'Cohorts', href: '/student/cohorts', Icon: GraduationCap, section: 'main' },
  { name: 'Career Hub', short: 'Career', href: '/student/career', Icon: BriefcaseBusiness, section: 'main' },
  { name: 'Organizations', short: 'Orgs', href: '/student/organizations', Icon: Building2, section: 'main' },
  { name: 'My Learning', short: 'Learning', href: '/student/courses', Icon: BookOpen, section: 'main' },
  { name: 'Schedule', short: 'Schedule', href: '/student/schedule', Icon: CalendarDays, section: 'main' },
  { name: 'My Progress', short: 'Progress', href: '/student/progress', Icon: ClipboardList, section: 'main' },
  { name: 'Resources', short: 'Resources', href: '/student/resources', Icon: Library, section: 'main' },
];

export const studentAccountItems: NavItem[] = [
  { name: 'Purchases', short: 'Purchases', href: '/student/purchases', Icon: CreditCard, section: 'account' },
  { name: 'Profile', short: 'Profile', href: '/student/profile', Icon: User, section: 'account' },
  { name: 'Settings', short: 'Settings', href: '/student/settings', Icon: Settings, section: 'account' },
];

export const instructorStudioItems: NavItem[] = [
  { name: 'Overview', short: 'Overview', href: '/instructor', Icon: LayoutDashboard, section: 'studio' },
  { name: 'Courses', short: 'Courses', href: '/instructor/courses', Icon: BookPlus, section: 'studio' },
  { name: 'Live Sessions', short: 'Sessions', href: '/instructor/live-sessions', Icon: CalendarDays, section: 'studio' },
  { name: 'Mentorship', short: 'Mentorship', href: '/instructor/mentorship', Icon: GraduationCap, section: 'studio' },
  { name: 'Earnings', short: 'Earnings', href: '/instructor/earnings', Icon: CreditCard, section: 'studio' },
  { name: 'Analytics', short: 'Analytics', href: '/instructor/analytics', Icon: BarChart2, section: 'studio' },
];

export const instructorAccountItems: NavItem[] = [
  { name: 'Profile', short: 'Profile', href: '/instructor/profile', Icon: User, section: 'account' },
  { name: 'Settings', short: 'Settings', href: '/instructor/settings', Icon: Settings, section: 'account' },
];

export const adminOperationItems: NavItem[] = [
  { name: 'Command Center', short: 'Center', href: '/admin', Icon: LayoutDashboard, section: 'operations' },
  { name: 'Courses', short: 'Courses', href: '/admin/courses', Icon: Layers, permissions: ['canManageCourses', 'canReviewCourses', 'canPublishCourses'], section: 'operations' },
  { name: 'Students', short: 'Students', href: '/admin/students', Icon: GraduationCap, permissions: ['canManageLearners', 'canManageUsers'], section: 'operations' },
  { name: 'Admissions', short: 'Admissions', href: '/admin/admissions', Icon: ClipboardCheck, permissions: ['canManageLearners', 'canManageUsers'], section: 'operations' },
  { name: 'Project Reviews', short: 'Reviews', href: '/admin/project-reviews', Icon: ClipboardList, permissions: ['canManageLearners', 'canManageUsers'], section: 'operations' },
  { name: 'Learner Insights', short: 'Insights', href: '/admin/learner-insights', Icon: BarChart2, permissions: ['canManageLearners', 'canManageMarketing', 'canViewAnalytics'], section: 'operations' },
  { name: 'Instructors', short: 'Instructors', href: '/admin/instructors', Icon: UserCheck, permissions: ['canManageInstructors', 'canVerifyInstructors'], section: 'operations' },
  { name: 'Invites', short: 'Invites', href: '/admin/invites', Icon: Link2, permissions: ['canManageInvites', 'canManageUsers'], section: 'operations' },
  { name: 'Platform Events', short: 'Events', href: '/admin/platform-events', Icon: CalendarDays, permissions: ['canManageCourses', 'canManageInstructors', 'canManageSettings'], section: 'operations' },
  { name: 'Mentorship', short: 'Mentorship', href: '/admin/mentorship', Icon: Handshake, permissions: ['canManageInstructors', 'canVerifyInstructors', 'canManageBilling'], section: 'operations' },
  { name: 'Community & Career', short: 'Community', href: '/admin/community-career', Icon: UsersRound, permissions: ['canManageMarketing', 'canManageLearners', 'canManageSettings'], section: 'operations' },
  { name: 'Organizations', short: 'Orgs', href: '/admin/organizations', Icon: Building2, permissions: ['canManageBilling', 'canManageUsers', 'canViewAnalytics'], section: 'operations' },
  { name: 'Announcements', short: 'Announce', href: '/admin/announcements', Icon: Megaphone, permissions: ['canManageAnnouncements'], section: 'operations' },
  { name: 'Billing', short: 'Billing', href: '/admin/billing', Icon: CreditCard, permissions: ['canManageBilling'], section: 'operations' },
  { name: 'Marketing', short: 'Marketing', href: '/admin/marketing', Icon: Tags, permissions: ['canManageMarketing'], section: 'operations' },
  { name: 'Permissions', short: 'Permissions', href: '/admin/permissions', Icon: ShieldCheck, permissions: ['canManagePermissions'], section: 'operations' },
  { name: 'Audit Logs', short: 'Audit', href: '/admin/audit-logs', Icon: FileClock, permissions: ['canViewAuditLogs'], section: 'operations' },
  { name: 'Platform Settings', short: 'Platform Settings', href: '/admin/settings', Icon: Settings2, permissions: ['canManageSettings'], section: 'operations' },
];

export const adminAccountItems: NavItem[] = [
  { name: 'Profile', short: 'Profile', href: '/admin/profile', Icon: User, section: 'account' },
  { name: 'Personal Settings', short: 'Personal Settings', href: '/admin/settings', Icon: UserCog, section: 'account' },
];
