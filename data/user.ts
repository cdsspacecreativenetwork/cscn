import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export type AdminUsersFilter = {
  page?: number;
  tab?: string;
  query?: string;
  sort?: string;
};

export const getUserByEmail = async (email: string) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        learnerProfile: true,
        instructorProfile: true,
        mentorProfile: true,
        adminPermission: true,
        userSecurity: true,
        payoutConfig: true,
      },
    });
    if (!user) return null;
    return {
      ...user,
      bio: user.profile?.bio,
      headline: user.profile?.headline,
      location: user.profile?.location,
      timezone: user.profile?.timezone ?? "Africa/Lagos",
      socials: user.profile?.socials,
      publicProfileSlug: user.profile?.publicProfileSlug,
      publicProfileStatus: user.profile?.publicProfileStatus,
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
      expertise: user.profile?.expertise,
      learningFocus: user.learnerProfile?.learningFocus,
      onboardingIntent: user.learnerProfile?.onboardingIntent,
      instructorProfileEnabled: user.instructorProfile?.isEnabled ?? false,
      instructorVerificationStatus: user.instructorProfile?.verificationStatus ?? "NOT_STARTED",
      instructorVerifiedAt: user.instructorProfile?.verifiedAt ?? null,
      instructorFeatured: user.instructorProfile?.isFeatured ?? false,
      instructorFeaturedOrder: user.instructorProfile?.featuredOrder ?? null,
      mentorshipEligible: user.mentorProfile?.isEligible ?? false,
      mentorshipEnabled: user.mentorProfile?.isEnabled ?? false,
      mentorshipApprovedAt: user.mentorProfile?.approvedAt ?? null,
      mentorshipPrice: user.mentorProfile?.price ?? null,
      mentorshipCurrency: user.mentorProfile?.currency ?? "NGN",
      mentorshipFree: user.mentorProfile?.isFree ?? true,
      mentorshipBio: user.mentorProfile?.bio ?? null,
      mentorshipTopics: user.mentorProfile?.topics ?? null,
      mentorshipInstructions: user.mentorProfile?.instructions ?? null,
      twoFactorEnabled: user.userSecurity?.twoFactorEnabled ?? false,
      twoFactorSecret: user.userSecurity?.twoFactorSecret ?? null,
    };
  } catch (error) {
    console.error("[getUserByEmail] DB query error:", error);
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        profile: true,
        learnerProfile: true,
        instructorProfile: true,
        mentorProfile: true,
        adminPermission: true,
        userSecurity: true,
        payoutConfig: true,
      },
    });
    if (!user) return null;
    return {
      ...user,
      bio: user.profile?.bio,
      headline: user.profile?.headline,
      location: user.profile?.location,
      timezone: user.profile?.timezone ?? "Africa/Lagos",
      socials: user.profile?.socials,
      publicProfileSlug: user.profile?.publicProfileSlug,
      publicProfileStatus: user.profile?.publicProfileStatus,
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
      expertise: user.profile?.expertise,
      learningFocus: user.learnerProfile?.learningFocus,
      onboardingIntent: user.learnerProfile?.onboardingIntent,
      instructorProfileEnabled: user.instructorProfile?.isEnabled ?? false,
      instructorVerificationStatus: user.instructorProfile?.verificationStatus ?? "NOT_STARTED",
      instructorVerifiedAt: user.instructorProfile?.verifiedAt ?? null,
      instructorFeatured: user.instructorProfile?.isFeatured ?? false,
      instructorFeaturedOrder: user.instructorProfile?.featuredOrder ?? null,
      mentorshipEligible: user.mentorProfile?.isEligible ?? false,
      mentorshipEnabled: user.mentorProfile?.isEnabled ?? false,
      mentorshipApprovedAt: user.mentorProfile?.approvedAt ?? null,
      mentorshipPrice: user.mentorProfile?.price ?? null,
      mentorshipCurrency: user.mentorProfile?.currency ?? "NGN",
      mentorshipFree: user.mentorProfile?.isFree ?? true,
      mentorshipBio: user.mentorProfile?.bio ?? null,
      mentorshipTopics: user.mentorProfile?.topics ?? null,
      mentorshipInstructions: user.mentorProfile?.instructions ?? null,
      twoFactorEnabled: user.userSecurity?.twoFactorEnabled ?? false,
      twoFactorSecret: user.userSecurity?.twoFactorSecret ?? null,
    };
  } catch {
    return null;
  }
};

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  headline: true,
  instructorProfileEnabled: true,
  instructorVerificationStatus: true,
  instructorFeatured: true,
  instructorFeaturedOrder: true,
  mentorshipEnabled: true,
  createdAt: true,
  canManageUsers: true,
  canManageCourses: true,
  canReviewCourses: true,
  canPublishCourses: true,
  canManageLearners: true,
  canManageInstructors: true,
  canVerifyInstructors: true,
  canManageInvites: true,
  canManageAnnouncements: true,
  canManageBilling: true,
  canManageMarketing: true,
  canManagePermissions: true,
  canViewAuditLogs: true,
  canManageSettings: true,
  canViewAnalytics: true,
  profile: {
    select: {
      headline: true,
      bio: true,
      location: true,
      timezone: true,
      socials: true,
    },
  },
  instructorProfile: {
    select: {
      isEnabled: true,
      verificationStatus: true,
      isFeatured: true,
      featuredOrder: true,
    },
  },
  mentorProfile: {
    select: {
      isEnabled: true,
    },
  },
  adminPermission: {
    select: {
      canManageUsers: true,
      canManageCourses: true,
      canReviewCourses: true,
      canPublishCourses: true,
      canManageLearners: true,
      canManageInstructors: true,
      canVerifyInstructors: true,
      canManageInvites: true,
      canManageAnnouncements: true,
      canManageBilling: true,
      canManageMarketing: true,
      canManagePermissions: true,
      canViewAuditLogs: true,
      canManageSettings: true,
      canViewAnalytics: true,
    },
  },
  taughtCourses: {
    where: { status: "PUBLISHED" as const },
    select: {
      id: true,
      _count: { select: { enrollments: true, ratings: true } },
      ratings: { select: { rating: true } },
    },
  },
  _count: { select: { enrollments: true } },
} as any;

export const PAGE_SIZE = 25;

function getRoleWhere(tab?: string) {
  if (tab === "students") return { role: "USER" as UserRole };
  if (tab === "instructors") return { instructorProfileEnabled: true };
  if (tab === "admins") return { role: { in: ["ADMIN", "SUPER_ADMIN"] as UserRole[] } };
  if (tab === "pending") return { instructorProfileEnabled: true, instructorVerificationStatus: "PENDING" as const };
  if (tab === "featured") return { instructorProfileEnabled: true, instructorFeatured: true };
  return {};
}

function sortUsers(users: any[], sort = "newest") {
  const getInstructorStudents = (user: any) =>
    user.taughtCourses?.reduce((sum: number, course: any) => sum + course._count.enrollments, 0) ?? 0;
  const getAverageRating = (user: any) => {
    const ratings = user.taughtCourses?.flatMap((course: any) => course.ratings.map((rating: any) => rating.rating)) ?? [];
    return ratings.length > 0 ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;
  };

  return [...users].sort((a, b) => {
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "name") return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    if (sort === "courses") return (b.taughtCourses?.length ?? 0) - (a.taughtCourses?.length ?? 0);
    if (sort === "students") return getInstructorStudents(b) - getInstructorStudents(a);
    if (sort === "rating") return getAverageRating(b) - getAverageRating(a);
    if (sort === "enrolled") return (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0);
    if (sort === "featured") return (a.instructorFeaturedOrder ?? 999) - (b.instructorFeaturedOrder ?? 999);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export const getAllUsers = async (filters: AdminUsersFilter = {}) => {
  try {
    const page = Math.max(1, filters.page ?? 1);
    const query = filters.query?.trim();
    const where = {
      ...getRoleWhere(filters.tab),
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

    const [allUsers, total] = await Promise.all([
      db.user.findMany({
        where,
        select: USER_SELECT,
        take: 500,
      }),
      db.user.count({ where }),
    ]);
    const sorted = sortUsers(allUsers, filters.sort);
    const sliced = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const users = sliced.map((u: any) => ({
      ...u,
      headline: u.profile?.headline ?? u.headline,
      instructorProfileEnabled: u.instructorProfile?.isEnabled ?? u.instructorProfileEnabled,
      instructorVerificationStatus: u.instructorProfile?.verificationStatus ?? u.instructorVerificationStatus,
      instructorFeatured: u.instructorProfile?.isFeatured ?? u.instructorFeatured,
      instructorFeaturedOrder: u.instructorProfile?.featuredOrder ?? u.instructorFeaturedOrder,
      mentorshipEnabled: u.mentorProfile?.isEnabled ?? u.mentorshipEnabled,
      canManageUsers: u.adminPermission?.canManageUsers ?? u.canManageUsers ?? false,
      canManageCourses: u.adminPermission?.canManageCourses ?? u.canManageCourses ?? false,
      canReviewCourses: u.adminPermission?.canReviewCourses ?? u.canReviewCourses ?? false,
      canPublishCourses: u.adminPermission?.canPublishCourses ?? u.canPublishCourses ?? false,
      canManageLearners: u.adminPermission?.canManageLearners ?? u.canManageLearners ?? false,
      canManageInstructors: u.adminPermission?.canManageInstructors ?? u.canManageInstructors ?? false,
      canVerifyInstructors: u.adminPermission?.canVerifyInstructors ?? u.canVerifyInstructors ?? false,
      canManageInvites: u.adminPermission?.canManageInvites ?? u.canManageInvites ?? false,
      canManageAnnouncements: u.adminPermission?.canManageAnnouncements ?? u.canManageAnnouncements ?? false,
      canManageBilling: u.adminPermission?.canManageBilling ?? u.canManageBilling ?? false,
      canManageMarketing: u.adminPermission?.canManageMarketing ?? u.canManageMarketing ?? false,
      canManagePermissions: u.adminPermission?.canManagePermissions ?? u.canManagePermissions ?? false,
      canViewAuditLogs: u.adminPermission?.canViewAuditLogs ?? u.canViewAuditLogs ?? false,
      canManageSettings: u.adminPermission?.canManageSettings ?? u.canManageSettings ?? false,
      canViewAnalytics: u.adminPermission?.canViewAnalytics ?? u.canViewAnalytics ?? false,
    }));
    return { users, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  } catch {
    return { users: [], total: 0, page: 1, totalPages: 1 };
  }
};

export const getUserStats = async () => {
  try {
    const [total, superAdmins, admins, instructors, students] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "SUPER_ADMIN" as UserRole } }),
      db.user.count({ where: { role: "ADMIN" as UserRole } }),
      db.user.count({ where: { instructorProfile: { isEnabled: true } } }),
      db.user.count({ where: { role: "USER" as UserRole } }),
    ]);
    return { total, superAdmins, admins, instructors, students };
  } catch {
    return { total: 0, superAdmins: 0, admins: 0, instructors: 0, students: 0 };
  }
};

export const adminExists = async () => {
  try {
    const superAdmin = await db.user.findFirst({
      where: { role: "SUPER_ADMIN" as UserRole }, 
    });
    return !!superAdmin;
  } catch {
    return false;
  }
};
