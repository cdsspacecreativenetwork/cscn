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
  GraduationCap,
  Handshake,
  Layers,
  LayoutDashboard,
  Library,
  UserCheck,
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
};

export const studentNavItems: NavItem[] = [
  { name: 'My Cohorts', short: 'Cohorts', href: '/dashboard/cohorts', Icon: GraduationCap },
  { name: 'Career Hub', short: 'Career', href: '/dashboard/career', Icon: BriefcaseBusiness },
  { name: 'Organizations', short: 'Orgs', href: '/dashboard/organizations', Icon: Building2 },
  { name: 'My Learning', short: 'Learning', href: '/dashboard/courses', Icon: BookOpen },
  { name: 'Schedule', short: 'Schedule', href: '/dashboard/schedule', Icon: CalendarDays },
  { name: 'My Progress', short: 'Progress', href: '/dashboard/progress', Icon: ClipboardList },
  { name: 'Resources', short: 'Resources', href: '/dashboard/resources', Icon: Library },
];

export const instructorNavItems: NavItem[] = [
  { name: 'Overview', short: 'Overview', href: '/dashboard/instructor', Icon: LayoutDashboard },
  { name: 'Courses', short: 'Courses', href: '/dashboard/instructor/courses', Icon: BookPlus },
  { name: 'Live Sessions', short: 'Sessions', href: '/dashboard/instructor/live-sessions', Icon: CalendarDays },
  { name: 'Mentorship', short: 'Mentorship', href: '/dashboard/instructor/mentorship', Icon: Handshake },
  { name: 'Earnings', short: 'Earnings', href: '/dashboard/instructor/earnings', Icon: CreditCard },
  { name: 'Analytics', short: 'Analytics', href: '/dashboard/instructor/analytics', Icon: BarChart2 },
  { name: 'Resources', short: 'Resources', href: '/dashboard/resources', Icon: Library },
];

export const adminNavItems: NavItem[] = [
  { name: 'Command Center', short: 'Center', href: '/dashboard/admin', Icon: LayoutDashboard },
  { name: 'Courses', short: 'Courses', href: '/dashboard/admin/courses', Icon: Layers, permissions: ['canManageCourses', 'canReviewCourses', 'canPublishCourses'] },
  { name: 'Instructors', short: 'Instructors', href: '/dashboard/admin/instructors', Icon: UserCheck, permissions: ['canManageInstructors', 'canVerifyInstructors'] },
  { name: 'Admissions', short: 'Admissions', href: '/dashboard/admin/admissions', Icon: ClipboardCheck, permissions: ['canManageLearners', 'canManageUsers'] },
  { name: 'Project Reviews', short: 'Reviews', href: '/dashboard/admin/project-reviews', Icon: ClipboardList, permissions: ['canManageLearners', 'canManageUsers'] },
  { name: 'Users', short: 'Users', href: '/dashboard/admin/students', Icon: GraduationCap, permissions: ['canManageLearners', 'canManageUsers'] },
  { name: 'Organizations', short: 'Orgs', href: '/dashboard/admin/organizations', Icon: Building2, permissions: ['canManageBilling', 'canManageUsers', 'canViewAnalytics'] },
];
