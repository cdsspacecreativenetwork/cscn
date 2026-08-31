import { db } from "@/lib/db";
import { getInstructorPublicProfileEligibility, isInstructorFeatureEligible } from "@/lib/profile-eligibility";
import type { Prisma } from "@prisma/client";

export type AdminInstructorsFilter = {
  page?: number;
  query?: string;
  sort?: string;
  tab?: string;
};

export const ADMIN_INSTRUCTORS_PAGE_SIZE = 25;

export async function getAdminInstructorApplications(filters: AdminInstructorsFilter = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const query = filters.query?.trim();
  const where = {
    status: "PENDING" as const,
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { industry: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [applications, total] = await Promise.all([
    db.instructorApplication.findMany({
      where,
      orderBy: { submittedAt: "asc" },
      skip: (page - 1) * ADMIN_INSTRUCTORS_PAGE_SIZE,
      take: ADMIN_INSTRUCTORS_PAGE_SIZE,
      include: { user: { select: { image: true, role: true } } },
    }),
    db.instructorApplication.count({ where }),
  ]);
  return {
    applications,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_INSTRUCTORS_PAGE_SIZE)),
  };
}

function getSort(sort?: string): Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "name") return { name: "asc" as const };
  if (sort === "featured") return [{ instructorProfile: { featuredOrder: "asc" as const } }, { createdAt: "desc" as const }];
  return { createdAt: "desc" as const };
}

function getTabWhere(tab?: string) {
  if (tab === "pending") return { instructorProfile: { isEnabled: true, verificationStatus: "PENDING" as const } };
  if (tab === "verified") return { instructorProfile: { isEnabled: true, verificationStatus: "VERIFIED" as const } };
  if (tab === "featured") return { instructorProfile: { isEnabled: true, isFeatured: true } };
  if (tab === "mentorship") return { mentorProfile: { isEligible: true } };
  if (tab === "rejected") return { instructorProfile: { isEnabled: true, verificationStatus: "REJECTED" as const } };
  return { instructorProfile: { isEnabled: true } };
}

function publicSlug(user: { profile?: { publicProfileSlug?: string | null } | null; id: string; name: string | null }) {
  return (
    user.profile?.publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    user.id
  );
}

export async function getAdminInstructors(filters: AdminInstructorsFilter = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const query = filters.query?.trim();
  const baseWhere = {
    ...getTabWhere(filters.tab),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { profile: { headline: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.user.findMany({
      where: baseWhere,
      orderBy: getSort(filters.sort),
      skip: (page - 1) * ADMIN_INSTRUCTORS_PAGE_SIZE,
      take: ADMIN_INSTRUCTORS_PAGE_SIZE,
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        image: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        profile: {
          select: {
            headline: true,
            bio: true,
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
          },
        },
        instructorProfile: {
          select: {
            isEnabled: true,
            verificationStatus: true,
            verifiedAt: true,
            isFeatured: true,
            featuredOrder: true,
            yearsExperience: true,
            expertise: true,
            bio: true,
          },
        },
        mentorProfile: {
          select: {
            isEligible: true,
            isEnabled: true,
            approvedAt: true,
            isFree: true,
            price: true,
            currency: true,
          },
        },
        payoutConfig: { select: { isSetup: true, payoutDetails: true } },
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
      const mergedUser = {
        ...user,
        headline: user.profile?.headline,
        bio: user.profile?.bio ?? user.instructorProfile?.bio,
        yearsExperience: user.instructorProfile?.yearsExperience,
        expertise: user.instructorProfile?.expertise ?? user.profile?.expertise,
        websiteUrl: user.profile?.websiteUrl,
        portfolioUrl: user.profile?.portfolioUrl,
        linkedinUrl: user.profile?.linkedinUrl,
        twitterUrl: user.profile?.twitterUrl,
        instagramUrl: user.profile?.instagramUrl,
        youtubeUrl: user.profile?.youtubeUrl,
        githubUrl: user.profile?.githubUrl,
        behanceUrl: user.profile?.behanceUrl,
        dribbbleUrl: user.profile?.dribbbleUrl,
        telegramUrl: user.profile?.telegramUrl,
        publicProfileSlug: user.profile?.publicProfileSlug,
        publicProfileStatus: user.profile?.publicProfileStatus,
        instructorVerificationStatus: user.instructorProfile?.verificationStatus ?? "NOT_STARTED",
      };

      const eligibility = getInstructorPublicProfileEligibility(mergedUser);
      const students = user.taughtCourses.reduce((sum, course) => sum + course._count.enrollments, 0);
      const ratings = user.taughtCourses.flatMap((course) => course.ratings.map((rating) => rating.rating));
      const averageRating =
        ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
      const payoutDetails =
        (user.payoutConfig?.payoutDetails as { payoutCountry?: unknown; preferredCurrency?: unknown } | null) ?? {};
      const payoutReady = Boolean(user.payoutConfig?.isSetup && payoutDetails.payoutCountry && payoutDetails.preferredCurrency);
      const featureEligible = isInstructorFeatureEligible(mergedUser);

      return {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        image: user.image,
        headline: user.profile?.headline,
        publicProfileStatus: user.profile?.publicProfileStatus ?? "DRAFT",
        publicProfileUrl: eligibility.eligible ? `/instructor/${publicSlug(user)}` : null,
        verificationStatus: user.instructorProfile?.verificationStatus ?? "NOT_STARTED",
        verifiedAt: user.instructorProfile?.verifiedAt ?? null,
        featured: user.instructorProfile?.isFeatured ?? false,
        featuredOrder: user.instructorProfile?.featuredOrder ?? null,
        mentorshipEligible: user.mentorProfile?.isEligible ?? false,
        mentorshipEnabled: user.mentorProfile?.isEnabled ?? false,
        mentorshipApprovedAt: user.mentorProfile?.approvedAt ?? null,
        mentorshipFree: user.mentorProfile?.isFree ?? true,
        mentorshipPrice: user.mentorProfile?.price ?? null,
        mentorshipCurrency: user.mentorProfile?.currency ?? "NGN",
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
  const now = new Date();
  const [total, pending, verified, featured, mentorship, pendingApplications, overdueApplications] = await Promise.all([
    db.user.count({ where: { instructorProfile: { isEnabled: true } } }),
    db.user.count({ where: { instructorProfile: { isEnabled: true, verificationStatus: "PENDING" } } }),
    db.user.count({ where: { instructorProfile: { isEnabled: true, verificationStatus: "VERIFIED" } } }),
    db.user.count({ where: { instructorProfile: { isEnabled: true, isFeatured: true } } }),
    db.user.count({ where: { mentorProfile: { isEligible: true } } }),
    db.instructorApplication.count({ where: { status: "PENDING" } }),
    db.instructorApplication.count({ where: { status: "PENDING", reviewDueAt: { lt: now } } }),
  ]);

  return { total, pending, verified, featured, mentorship, pendingApplications, overdueApplications };
}
