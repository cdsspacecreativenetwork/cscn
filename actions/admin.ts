"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const isSuperAdmin = (role: string | undefined) => role === "SUPER_ADMIN";
const isAdminOrAbove = (role: string | undefined) =>
  role === "ADMIN" || role === "SUPER_ADMIN";

export const changeUserRole = async (userId: string, newRole: string) => {
  const session = await auth();
  const callerRole = session?.user?.role as string | undefined;
  const callerId = session?.user?.id;

  if (!callerId || !isAdminOrAbove(callerRole)) {
    return { error: "Unauthorized" };
  }

  if (callerId === userId) {
    return { error: "You cannot change your own role" };
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: "User not found" };

  const targetRole = targetUser.role as string;

  // Only SUPER_ADMIN can touch ADMIN or SUPER_ADMIN accounts
  if (
    (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN") &&
    !isSuperAdmin(callerRole)
  ) {
    return { error: "Only a Super Admin can change an Admin's role" };
  }

  // Only SUPER_ADMIN can grant ADMIN or SUPER_ADMIN roles
  if (
    (newRole === "ADMIN" || newRole === "SUPER_ADMIN") &&
    !isSuperAdmin(callerRole)
  ) {
    return { error: "Only a Super Admin can grant Admin privileges" };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { role: newRole as UserRole },
    });
    revalidatePath("/dashboard/admin/users");
    return { success: "Role updated successfully" };
  } catch {
    return { error: "Failed to update role" };
  }
};

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageCourses: boolean;
  canManageBilling: boolean;
  canViewAnalytics: boolean;
}

export const updateAdminPermissions = async (
  userId: string,
  permissions: AdminPermissions
) => {
  const session = await auth();

  if (!isSuperAdmin(session?.user?.role as string | undefined)) {
    return { error: "Only a Super Admin can manage permissions" };
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: "User not found" };
  if ((targetUser.role as string) !== "ADMIN") {
    return { error: "Permissions can only be set for Admin-role users" };
  }

  try {
    await db.user.update({ where: { id: userId }, data: permissions as any });
    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch {
    return { error: "Failed to update permissions" };
  }
};
