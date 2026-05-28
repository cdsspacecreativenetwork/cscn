"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertEmailVerifiedByUserId } from "@/lib/trust-gates";
import { getInstructorRoleTransitionData } from "@/lib/instructor-onboarding";
import { ADMIN_PERMISSION_KEYS, hasAdminPermission, type AdminPermissionSet, normalizeAdminPermissions } from "@/lib/admin-permissions";
import { createAuditLog } from "@/data/audit-logs";

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
  if (callerRole === "ADMIN" && !hasAdminPermission(session.user, "canManageUsers")) {
    return { error: "You do not have permission to manage users." };
  }
  try {
    await assertEmailVerifiedByUserId(callerId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Verify your email before using this feature." };
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
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: newRole as UserRole,
        ...getInstructorRoleTransitionData(newRole),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    await createAuditLog({
      actorId: callerId,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "user.role_changed",
      entityType: "USER",
      entityId: updatedUser.id,
      entityName: updatedUser.name ?? updatedUser.email,
      metadata: { from: targetRole, to: updatedUser.role },
    });
    revalidatePath("/dashboard/admin/users");
    return { success: "Role updated successfully" };
  } catch {
    return { error: "Failed to update role" };
  }
};

export type AdminPermissions = AdminPermissionSet;

export const updateAdminPermissions = async (
  userId: string,
  permissions: Partial<AdminPermissions>
) => {
  const session = await auth();
  const superAdminId = session?.user?.id;

  if (!superAdminId || !isSuperAdmin(session?.user?.role as string | undefined)) {
    return { error: "Only a Super Admin can manage permissions" };
  }
  try {
    await assertEmailVerifiedByUserId(superAdminId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Verify your email before using this feature." };
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: "User not found" };
  if ((targetUser.role as string) !== "ADMIN") {
    return { error: "Permissions can only be set for Admin-role users" };
  }

  try {
    const normalized = normalizeAdminPermissions(permissions);
    const data = ADMIN_PERMISSION_KEYS.reduce((acc, key) => {
      acc[key] = normalized[key];
      return acc;
    }, {} as Record<keyof AdminPermissions, boolean>);

    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true },
    });
    await createAuditLog({
      actorId: superAdminId,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "user.permissions_updated",
      entityType: "USER",
      entityId: updatedUser.id,
      entityName: updatedUser.name ?? updatedUser.email,
      metadata: { permissions: data },
    });
    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard/admin/permissions");
    return { success: true };
  } catch {
    return { error: "Failed to update permissions" };
  }
};
