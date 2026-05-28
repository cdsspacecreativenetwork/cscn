import { db } from "@/lib/db";
import { getInstructorPublicProfileEligibility, isInstructorFeatureEligible } from "@/lib/profile-eligibility";

export type AdminInstructorsFilter = {
  page?: number;
  query?: string;
  sort?: string;
  tab?: string;
};

export const ADMIN_INSTRUCTORS_PAGE_SIZE = 25;

function getSort(sort?: string) {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "name") return { name: "asc" as const };
  if (sort === "featured") return [{ instructorFeaturedOrder: "asc" as const }, { createdAt: "desc" as const }];
  return { createdAt: "desc" as const };
}

function getTabWhere(tab?: string) {
  if (tab === "pending") return { instructorVerificationStatus: "PENDING" as const };
  if (tab === "verified") return { instructorVerificationStatus: "VERIFIED" as const };
  if (tab === "featured") return { instructorFeatured: true };
  if (tab === "mentorship") return { mentorshipEnabled: true };
  if (tab === "rejected") return { instructorVerificationStatus: "REJECTED" as const };
  return {};
}

function publicSlug(user: { publicProfileSlug: string | null; id: string; name: string | null }) {
  return (
    user.publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    user.id
  );
}

export async function getAdminInstructors(filters: AdminInstructorsFilter = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const query = filters.query?.trim();
  const baseWhere = {
    instructorProfileEnabled: true,
    ...getTabWhere(filters.tab),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { headline: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.user.findMany({
      where: baseWhere,
      orderBy: getSort(filters.sort) as any,
      skip: (page - 1) * ADMIN_INSTRUCTORS_PAGE_SIZE,
      take: ADMIN_INSTRUCTORS_PAGE_SIZE,
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        bio: true,
        firstName: true,
        lastName: true,
        yearsExperience: true,
        expertise: true,
        websiteUrl: true,
        portfolioUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        githubUrl: true,
        behanceUrl: true,
        dribbbleUrl: true,
        telegramUrl: true,
        publicProfileSlug: true,
        publicProfileStatus: true,
        instructorProfileEnabled: true,
        instructorVerificationStatus: true,
        instructorVerifiedAt: true,
        instructorFeatured: true,
        instructorFeaturedOrder: true,
        mentorshipEnabled: true,
        payoutSetup: true,
        payoutDetails: true,
        createdAt: true,
        taughtCourses: {
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            _count: { select: { enrollments: true, ratings: true } },
            ratings: { select: { rating: true } },
          },
        },
      },
    }),
    db.user.count({ where: baseWhere }),
  ]);

  const instructors = rows
    .map((user) => {
      const eligibility = getInstructorPublicProfileEligibility(user);
      const students = user.taughtCourses.reduce((sum, course) => sum + course._count.enrollments, 0);
      const ratings = user.taughtCourses.flatMap((course) => course.ratings.map((rating) => rating.rating));
      const averageRating =
        ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
      const payoutDetails =
        (user.payoutDetails as { payoutCountry?: unknown; preferredCurrency?: unknown } | null) ?? {};
      const payoutReady = Boolean(user.payoutSetup && payoutDetails.payoutCountry && payoutDetails.preferredCurrency);
      const featureEligible = isInstructorFeatureEligible(user);

      return {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        image: user.image,
        headline: user.headline,
        publicProfileStatus: user.publicProfileStatus,
        publicProfileUrl: eligibility.eligible ? `/instructor/${publicSlug(user)}` : null,
        verificationStatus: user.instructorVerificationStatus,
        verifiedAt: user.instructorVerifiedAt,
        featured: user.instructorFeatured,
        featuredOrder: user.instructorFeaturedOrder,
        mentorshipEnabled: user.mentorshipEnabled,
        profileComplete: eligibility.eligible,
        missingLabels: eligibility.missingLabels,
        publishedCourses: user.taughtCourses.length,
        students,
        averageRating,
        ratingCount: ratings.length,
        payoutReady,
        featureEligible,
        createdAt: user.createdAt,
      };
    })
    .filter((instructor) => (filters.tab === "needs-completion" ? !instructor.profileComplete : true));

  return {
    instructors,
    total: filters.tab === "needs-completion" ? instructors.length : total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_INSTRUCTORS_PAGE_SIZE)),
  };
}

export async function getAdminInstructorStats() {
  const [total, pending, verified, featured, mentorship] = await Promise.all([
    db.user.count({ where: { instructorProfileEnabled: true } }),
    db.user.count({ where: { instructorProfileEnabled: true, instructorVerificationStatus: "PENDING" } }),
    db.user.count({ where: { instructorProfileEnabled: true, instructorVerificationStatus: "VERIFIED" } }),
    db.user.count({ where: { instructorProfileEnabled: true, instructorFeatured: true } }),
    db.user.count({ where: { instructorProfileEnabled: true, mentorshipEnabled: true } }),
  ]);

  return { total, pending, verified, featured, mentorship };
}
