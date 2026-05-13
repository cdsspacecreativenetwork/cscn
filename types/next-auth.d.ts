import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: string;
      emailVerified: Date | null;
      canManageUsers: boolean;
      canManageCourses: boolean;
      canManageBilling: boolean;
      canViewAnalytics: boolean;
    };
  }

  interface User {
    role?: string;
    emailVerified?: Date | null;
    canManageUsers?: boolean;
    canManageCourses?: boolean;
    canManageBilling?: boolean;
    canViewAnalytics?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    emailVerified?: Date | null;
    canManageUsers?: boolean;
    canManageCourses?: boolean;
    canManageBilling?: boolean;
    canViewAnalytics?: boolean;
  }
}
