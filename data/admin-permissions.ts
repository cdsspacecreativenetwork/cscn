import { db } from "@/lib/db";
import { ADMIN_PERMISSION_KEYS, normalizeAdminPermissions } from "@/lib/admin-permissions";

const ADMIN_PERMISSION_SELECT = ADMIN_PERMISSION_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: true }),
  {} as Record<(typeof ADMIN_PERMISSION_KEYS)[number], true>
);

export async function getAdminPermissionsOverview() {
  const [roleCounts, admins, roleCandidates] = await Promise.all([
    db.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        ...ADMIN_PERMISSION_SELECT,
      },
    }),
    db.user.findMany({
      where: { role: { in: ["USER", "INSTRUCTOR", "ADMIN"] } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        instructorProfileEnabled: true,
        instructorVerificationStatus: true,
        _count: { select: { enrollments: true, taughtCourses: true } },
      },
    }),
  ]);

  const counts = roleCounts.reduce(
    (acc, row) => ({ ...acc, [row.role]: row._count.role }),
    { SUPER_ADMIN: 0, ADMIN: 0, INSTRUCTOR: 0, USER: 0 } as Record<string, number>
  );

  return {
    counts,
    admins: admins.map((admin: any) => ({
      ...admin,
      permissions: normalizeAdminPermissions(admin),
      enabledPermissionCount: ADMIN_PERMISSION_KEYS.filter((key) => Boolean(admin[key])).length,
    })),
    roleCandidates,
    totalPermissionScopes: ADMIN_PERMISSION_KEYS.length,
  };
}
