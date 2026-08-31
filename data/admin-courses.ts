import { db } from "@/lib/db";
import { checkAndAwardAchievements } from "@/lib/services/achievements.service";
import type { CourseStatus, Prisma } from "@prisma/client";

export type AdminCoursesFilter = {
  page?: number;
  query?: string;
  status?: string;
  sort?: string;
};

export const ADMIN_COURSES_PAGE_SIZE = 15;

function getSort(sort?: string): Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[] {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "title") return { title: "asc" };
  if (sort === "status") return [{ status: "asc" }, { updatedAt: "desc" }];
  if (sort === "price-desc") return [{ price: "desc" }, { createdAt: "desc" }];
  return { updatedAt: "desc" };
}

export async function getAdminCoursesConsole(filters: AdminCoursesFilter = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const query = filters.query?.trim();
  const statusFilter = filters.status?.toUpperCase() as CourseStatus | undefined;

  const where: Prisma.CourseWhereInput = {
    ...(statusFilter && statusFilter !== ("ALL" as any) ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { instructor: { name: { contains: query, mode: "insensitive" } } },
            { instructor: { email: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [courses, total, statusCounts] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: getSort(filters.sort),
      skip: (page - 1) * ADMIN_COURSES_PAGE_SIZE,
      take: ADMIN_COURSES_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDesc: true,
        thumbnail: true,
        status: true,
        difficulty: true,
        featuredOrder: true,
        createdAt: true,
        updatedAt: true,
        instructorId: true,
        instructor: { select: { id: true, name: true, image: true, payoutConfig: { select: { isSetup: true, payoutDetails: true } } } },
        price: true,
        baseCurrency: true,
        pricingProposals: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            proposedPrice: true,
            currentPriceSnapshot: true,
            currency: true,
            status: true,
            adminNote: true,
            createdAt: true,
          },
        },
        _count: { select: { enrollments: true, modules: true, reviews: true } },
      },
    }),
    db.course.count({ where }),
    db.course.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const countsMap = statusCounts.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count.status;
    return acc;
  }, {});

  return {
    courses: courses.map((course) => ({
      ...course,
      price: course.price?.toString() ?? null,
      pendingProposal: course.pricingProposals[0]
        ? {
            ...course.pricingProposals[0],
            proposedPrice: course.pricingProposals[0].proposedPrice?.toString() ?? "0",
            currentPriceSnapshot: course.pricingProposals[0].currentPriceSnapshot?.toString() ?? null,
            submittedAt: course.pricingProposals[0].createdAt.toISOString(),
          }
        : null,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_COURSES_PAGE_SIZE)),
    counts: {
      ALL: Object.values(countsMap).reduce((sum, val) => sum + val, 0),
      DRAFT: countsMap.DRAFT ?? 0,
      PENDING_REVIEW: countsMap.PENDING_REVIEW ?? 0,
      PUBLISHED: countsMap.PUBLISHED ?? 0,
      CHANGES_REQUESTED: countsMap.CHANGES_REQUESTED ?? 0,
      REJECTED: countsMap.REJECTED ?? 0,
      ARCHIVED: countsMap.ARCHIVED ?? 0,
    },
  };
}

export async function toggleAdminCoursePublishStatus(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      status: true,
      instructorId: true,
      thumbnail: true,
      promoVideo: true,
      price: true,
      instructor: { select: { payoutConfig: { select: { isSetup: true, payoutDetails: true } } } },
      modules: {
        where: { isPublished: true },
        take: 1,
        select: {
          lessons: {
            where: { isPublished: true },
            take: 1,
            select: { id: true },
          },
        },
      },
      pricingProposals: {
        where: { status: "PENDING" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!course) throw new Error("Not found");
  const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  if (newStatus === "PUBLISHED" && course.pricingProposals.length > 0) {
    throw new Error("Approve or reject the pending course price before publishing this course.");
  }

  if (newStatus === "PUBLISHED") {
    if (!course.thumbnail) {
      throw new Error("Add a course thumbnail before publishing this course.");
    }
    if (!course.modules.some((module) => module.lessons.length > 0)) {
      throw new Error("Publish at least one lesson before publishing this course.");
    }
  }

  if (newStatus === "PUBLISHED" && course.price && Number(course.price) > 0) {
    const payoutConfig = course.instructor.payoutConfig;
    const payoutDetails = (payoutConfig?.payoutDetails as { payoutCountry?: unknown; preferredCurrency?: unknown }) || {};
    if (!payoutConfig?.isSetup || !payoutDetails.payoutCountry || !payoutDetails.preferredCurrency) {
      throw new Error("Complete the instructor payout region and payout setup before publishing a paid course.");
    }
  }

  const updated = await db.course.update({
    where: { id: courseId },
    data: { status: newStatus },
    select: { status: true },
  });

  if (newStatus === "PUBLISHED") {
    const publishedCount = await db.course.count({
      where: { instructorId: course.instructorId, status: "PUBLISHED" },
    });
    await checkAndAwardAchievements(course.instructorId, "PUBLISH_COURSE", publishedCount);
  }

  return updated;
}

export async function getStudioCourseAdmin(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shortDesc: true,
      thumbnail: true,
      promoVideo: true,
      difficulty: true,
      courseType: true,
      status: true,
      previewCount: true,
      categoryId: true,
      requirements: true,
      includes: true,
      certificateEnabled: true,
      examGated: true,
      metaTitle: true,
      metaDescription: true,
      price: true,
      baseCurrency: true,
      instructor: { select: { id: true, name: true, email: true, image: true, payoutConfig: { select: { isSetup: true, payoutDetails: true } } } },
      category: { select: { name: true } },
      _count: { select: { enrollments: true } },
      pricingProposals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          proposedPrice: true,
          currentPriceSnapshot: true,
          currency: true,
          status: true,
          adminNote: true,
          createdAt: true,
        },
      },
    },
  });
}
