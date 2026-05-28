import type { DefaultSession } from 'next-auth';
import type { AdminPermissionSet } from '@/lib/admin-permissions';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & AdminPermissionSet & {
      id: string;
      role: string;
      emailVerified: Date | null;
    };
  }

  interface User extends Partial<AdminPermissionSet> {
    role?: string;
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends Partial<AdminPermissionSet> {
    role?: string;
    emailVerified?: Date | null;
  }
}
