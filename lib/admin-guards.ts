import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { hasAdminPermission, hasAnyAdminPermission, isAdminRole, type AdminPermissionKey } from "@/lib/admin-permissions";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");
  return session;
}

export async function requireAdminPermission(permission: AdminPermissionKey) {
  const session = await requireAdmin();
  if (!hasAdminPermission(session.user, permission)) redirect("/dashboard/admin");
  return session;
}

export async function requireAnyAdminPermission(permissions: AdminPermissionKey[]) {
  const session = await requireAdmin();
  if (!hasAnyAdminPermission(session.user, permissions)) redirect("/dashboard/admin");
  return session;
}
