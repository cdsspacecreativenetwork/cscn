import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import type { AdminPermissionSet } from "@/lib/admin-permissions";

export type ExtendedUser = DefaultSession["user"] & AdminPermissionSet & {
  role: UserRole | string;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT extends Partial<AdminPermissionSet> {
    role?: UserRole | string;
  }
}
