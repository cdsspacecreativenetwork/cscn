import { db } from "@/lib/db";
import type { AdminPermissionKey } from "@/lib/admin-permissions";
import { subDays } from "date-fns";

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export async function getAdminDashboardOverview() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [
    totalUsers,
    newUsers30d,
    totalLearners,
    instructorsCount,
    totalEnrollments,
    newEnrollments30d,
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
    db.user.count({ where: { instructorProfile: { isEnabled: true } } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { enrolledAt: { gte: thirtyDaysAgo } } }),
    db.enrollment.count({ where: { status: "ACTIVE" } }),
    db.enrollment.count({ where: { status: "COMPLETED" } }),
    db.course.groupBy({ by: ["status"], _count: { status: true } }),
    db.user.count({
      where: {
        instructorProfile: {
          isEnabled: true,
          verificationStatus: "PENDING",
        },
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
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        instructor: { select: { name: true } },
        pricingProposals: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
    }),
    db.course.findMany({
      where: { status: { in: ["PUBLISHED", "PENDING_REVIEW"] } },
      select: {
        id: true,
        title: true,
        status: true,
        thumbnail: true,
        promoVideo: true,
        price: true,
        instructor: {
          select: {
            name: true,
            payoutConfig: {
              select: {
                isSetup: true,
                payoutDetails: true,
              },
            },
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
          { instructorProfile: { verificationStatus: "PENDING" } },
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
        instructorProfile: {
          select: {
            isEnabled: true,
            verificationStatus: true,
          },
        },
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
        (course.instructor.payoutConfig?.payoutDetails as { payoutCountry?: unknown; preferredCurrency?: unknown } | null) ??
        {};
      const issues = [
        !course.thumbnail ? "Missing thumbnail" : null,
        !course.promoVideo ? "Missing trailer" : null,
        !hasPublishedModule ? "No published module" : null,
        !hasPublishedLesson ? "No published lesson" : null,
        course.pricingProposals.length > 0 ? "Pricing review pending" : null,
        course.price && Number(course.price) > 0 && (!course.instructor.payoutConfig?.isSetup || !payoutDetails.payoutCountry)
          ? "Paid course payout incomplete"
          : null,
      ].filter((issue): issue is string => Boolean(issue));

      return {
        id: course.id,
        title: course.title,
        status: course.status,
        issues,
      };
    })
    .filter((course) => course.issues.length > 0);

  const reviewQueue = [
    {
      title: "Course Publishing Reviews",
      count: pendingCourseReviews,
      badge: "Course",
      href: "/dashboard/admin/courses?status=PENDING_REVIEW",
    },
    {
      title: "Course Pricing Approvals",
      count: pendingPricingCount,
      badge: "Billing",
      href: "/dashboard/admin/courses",
    },
    {
      title: "Instructor Applications",
      count: pendingInstructorProfiles,
      badge: "Instructors",
      href: "/dashboard/admin/instructors?tab=pending",
    },
  ];

  const platformSignals = [
    {
      label: "Instructors",
      value: `${instructorsCount}`,
      note: `${pendingInstructorProfiles} verification pending`,
    },
    {
      label: "Course Library",
      value: `${publishedCourses} published`,
      note: `${draftCourses} draft, ${archivedCourses} archived`,
    },
    {
      label: "30-Day Growth",
      value: `${newUsers30d} new users`,
      note: `${newEnrollments30d} new enrollments`,
    },
    {
      label: "Broadcast System",
      value: `${activeAnnouncements} active`,
      note: "Live platform-wide broadcasts",
    },
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
      description: user.instructorProfile?.isEnabled
        ? `${(user.instructorProfile.verificationStatus ?? "NOT_STARTED").replace("_", " ").toLowerCase()} instructor profile`
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
