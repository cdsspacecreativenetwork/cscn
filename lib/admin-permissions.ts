export const ADMIN_PERMISSION_KEYS = [
  "canManageUsers",
  "canManageCourses",
  "canReviewCourses",
  "canPublishCourses",
  "canManageLearners",
  "canManageInstructors",
  "canVerifyInstructors",
  "canManageInvites",
  "canManageAnnouncements",
  "canManageBilling",
  "canManageMarketing",
  "canManagePermissions",
  "canViewAuditLogs",
  "canManageSettings",
  "canViewAnalytics",
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];
export type AdminPermissionSet = Record<AdminPermissionKey, boolean>;

export const EMPTY_ADMIN_PERMISSIONS: AdminPermissionSet = ADMIN_PERMISSION_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {} as AdminPermissionSet
);

export function normalizeAdminPermissions(source: Partial<Record<AdminPermissionKey, unknown>> = {}) {
  return ADMIN_PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(source[key]);
    return acc;
  }, {} as AdminPermissionSet);
}

export function isSuperAdminRole(role?: string | null) {
  return role === "SUPER_ADMIN";
}

export function isAdminRole(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function hasAdminPermission(
  user: (Partial<Record<AdminPermissionKey, unknown>> & { role?: string | null }) | null | undefined,
  permission: AdminPermissionKey
) {
  if (!user) return false;
  if (isSuperAdminRole(user.role)) return true;
  return Boolean(user[permission]);
}

export function hasAnyAdminPermission(
  user: (Partial<Record<AdminPermissionKey, unknown>> & { role?: string | null }) | null | undefined,
  permissions: AdminPermissionKey[]
) {
  if (!user) return false;
  if (isSuperAdminRole(user.role)) return true;
  return permissions.some((permission) => Boolean(user[permission]));
}
