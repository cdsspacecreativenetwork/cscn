import { db } from "@/lib/db";
import type { AdminPermissionKey } from "@/lib/admin-permissions";

const DAY = 24 * 60 * 60 * 1000;

function since(days: number) {
  return new Date(Date.now() - days * DAY);
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export type AdminQueueItem = {
  label: string;
  value: number;
  href: string;
  tone: "blue" | "emerald" | "amber" | "rose" | "slate";
  permissions: AdminPermissionKey[];
};

export type AdminSignal = {
  label: string;
  value: number;
  permissions: AdminPermissionKey[];
};

export async function getAdminDashboardData() {
  const thirtyDaysAgo = since(30);
  const sevenDaysAgo = since(7);

  const [
    totalUsers,
    newUsers30d,
    learners,
    instructors,
    totalEnrollments,
    enrollments30d,
    activeEnrollments,
    completedEnrollments,
    coursesByStatus,
    pendingInstructorProfiles,
    pendingPricingCount,
    activeAnnouncements,
    recentCourses,
    qualityCourses,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where: { instructorProfileEnabled: true } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { enrolledAt: { gte: thirtyDaysAgo } } }),
    db.enrollment.count({ where: { status: "ACTIVE" } }),
    db.enrollment.count({ where: { status: "COMPLETED" } }),
    db.course.groupBy({ by: ["status"], _count: { status: true } }),
    db.user.count({
      where: {
        instructorProfileEnabled: true,
        instructorVerificationStatus: "PENDING",
      },
    }),
    db.coursePricingProposal.count({ where: { status: "PENDING" } }),
    db.announcement.count({
      where: {
        publishedAt: { not: null, lte: new Date() },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    db.course.findMany({
      where: {
        OR: [
          { status: "PENDING_REVIEW" },
          { pricingProposals: { some: { status: "PENDING" } } },
          { status: "PUBLISHED", updatedAt: { gte: sevenDaysAgo } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        instructor: { select: { name: true } },
        pricingProposals: {
          where: { status: "PENDING" },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.course.findMany({
      where: {
        OR: [
          { status: "PENDING_REVIEW" },
          { status: "PUBLISHED" },
          { pricingProposals: { some: { status: "PENDING" } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 150,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        thumbnail: true,
        promoVideo: true,
        price: true,
        instructor: {
          select: {
            name: true,
            payoutSetup: true,
            payoutDetails: true,
          },
        },
        modules: {
          select: {
            isPublished: true,
            lessons: { select: { isPublished: true } },
          },
        },
        pricingProposals: {
          where: { status: "PENDING" },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.user.findMany({
      where: {
        OR: [
          { instructorVerificationStatus: "PENDING" },
          { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
          { createdAt: { gte: thirtyDaysAgo } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        instructorProfileEnabled: true,
        instructorVerificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const courseStatusCounts = coursesByStatus.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {});
  const publishedCourses = courseStatusCounts.PUBLISHED ?? 0;
  const draftCourses = courseStatusCounts.DRAFT ?? 0;
  const pendingCourseReviews = courseStatusCounts.PENDING_REVIEW ?? 0;
  const archivedCourses = courseStatusCounts.ARCHIVED ?? 0;

  const courseQualityIssues = qualityCourses
    .map((course) => {
      const hasPublishedModule = course.modules.some((module) => module.isPublished);
      const hasPublishedLesson = course.modules.some((module) =>
        module.lessons.some((lesson) => lesson.isPublished)
      );
      const payoutDetails =
        (course.instructor.payoutDetails as { payoutCountry?: unknown; preferredCurrency?: unknown } | null) ??
        {};
      const issues = [
        !course.thumbnail ? "Missing thumbnail" : null,
        !course.promoVideo ? "Missing trailer" : null,
        !hasPublishedModule ? "No published module" : null,
        !hasPublishedLesson ? "No published lesson" : null,
        course.pricingProposals.length > 0 ? "Pricing review pending" : null,
        course.price && Number(course.price) > 0 && (!course.instructor.payoutSetup || !payoutDetails.payoutCountry)
          ? "Paid course payout incomplete"
          : null,
      ].filter(Boolean) as string[];

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        instructorName: course.instructor.name ?? "Unknown instructor",
        issues,
      };
    })
    .filter((course) => course.issues.length > 0)
    .slice(0, 6);

  const reviewQueue: AdminQueueItem[] = [
    {
      label: "Course reviews",
      value: pendingCourseReviews,
      href: "/dashboard/admin/courses?tab=review",
      tone: "blue",
      permissions: ["canReviewCourses", "canPublishCourses"],
    },
    {
      label: "Instructor verification",
      value: pendingInstructorProfiles,
      href: "/dashboard/admin/instructors?tab=pending",
      tone: "emerald",
      permissions: ["canVerifyInstructors", "canManageInstructors"],
    },
    {
      label: "Pricing reviews",
      value: pendingPricingCount,
      href: "/dashboard/admin/courses?tab=pricing",
      tone: "amber",
      permissions: ["canManageBilling"],
    },
    {
      label: "Quality flags",
      value: courseQualityIssues.length,
      href: "/dashboard/admin/courses?tab=attention",
      tone: "rose",
      permissions: ["canManageCourses", "canReviewCourses"],
    },
  ];

  const platformSignals: AdminSignal[] = [
    { label: "Total users", value: totalUsers, permissions: ["canManageUsers", "canManageLearners", "canManageInstructors"] },
    { label: "New users in 30 days", value: newUsers30d, permissions: ["canManageUsers", "canManageLearners", "canManageInstructors"] },
    { label: "Students", value: learners, permissions: ["canManageLearners", "canManageUsers"] },
    { label: "Instructor profiles", value: instructors, permissions: ["canManageInstructors", "canVerifyInstructors"] },
    { label: "Published courses", value: publishedCourses, permissions: ["canManageCourses", "canReviewCourses", "canPublishCourses"] },
    { label: "Draft courses", value: draftCourses, permissions: ["canManageCourses"] },
    { label: "Archived courses", value: archivedCourses, permissions: ["canManageCourses"] },
    { label: "Active enrollments", value: activeEnrollments, permissions: ["canManageLearners", "canViewAnalytics"] },
    { label: "New enrollments in 30 days", value: enrollments30d, permissions: ["canManageLearners", "canViewAnalytics"] },
    { label: "Completion rate", value: percent(completedEnrollments, totalEnrollments), permissions: ["canManageLearners", "canViewAnalytics"] },
    { label: "Active announcements", value: activeAnnouncements, permissions: ["canManageAnnouncements", "canManageMarketing"] },
  ];

  const recentActivity = [
    ...recentCourses.map((course) => ({
      id: `course-${course.id}`,
      title: course.title,
      description: `${course.status.replace("_", " ").toLowerCase()} course by ${course.instructor.name ?? "Unknown instructor"}`,
      href: `/dashboard/admin/courses/${course.id}`,
      createdAt: course.updatedAt,
      badge: course.pricingProposals.length > 0 ? "Pricing" : course.status.replace("_", " "),
      permissions: course.pricingProposals.length > 0
        ? ["canManageBilling" as AdminPermissionKey]
        : ["canManageCourses", "canReviewCourses", "canPublishCourses"] as AdminPermissionKey[],
    })),
    ...recentUsers.map((user) => ({
      id: `user-${user.id}`,
      title: user.name ?? user.email ?? "Unnamed user",
      description: user.instructorProfileEnabled
        ? `${user.instructorVerificationStatus.replace("_", " ").toLowerCase()} instructor profile`
        : `${user.role.toLowerCase()} account`,
      href: `/dashboard/admin/users?q=${encodeURIComponent(user.email ?? user.name ?? "")}`,
      createdAt: user.updatedAt,
      badge: user.role.replace("_", " "),
      permissions: ["canManageUsers", "canManageLearners", "canManageInstructors"] as AdminPermissionKey[],
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return {
    summary: {
      totalUsers,
      newUsers30d,
      publishedCourses,
      activeEnrollments,
      completionRate: percent(completedEnrollments, totalEnrollments),
      pendingCourseReviews,
      pendingInstructorProfiles,
      pendingPricingCount,
    },
    reviewQueue,
    platformSignals,
    courseQualityIssues,
    recentActivity,
  };
}
