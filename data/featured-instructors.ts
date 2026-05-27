import { db } from "@/lib/db";
import { generateTapbackAvatar } from "@/lib/avatar";
import type { Prisma } from "@prisma/client";
import {
  getInstructorPublicProfileEligibility,
  isInstructorFeatureEligible,
} from "@/lib/profile-eligibility";

export type FeaturedInstructorRow = {
  id: string;
  name: string;
  email: string;
  image: string;
  headline: string;
  slug: string;
  verificationStatus: string;
  featuredOrder: number | null;
  checklist: { label: string; complete: boolean }[];
  missingLabels: string[];
  publishedCourses: number;
  totalStudents: number;
  averageRating: number;
  ratingCount: number;
  score: number;
};

export type HomepageFeaturedInstructor = {
  name: string;
  role: string;
  image: string;
  slug: string;
};

const instructorSelect = {
  id: true,
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
  instructorFeatured: true,
  instructorFeaturedOrder: true,
  taughtCourses: {
    where: { status: "PUBLISHED" as const },
    select: {
      id: true,
      _count: { select: { enrollments: true, ratings: true } },
      ratings: { select: { rating: true } },
    },
  },
} as const;

type FeaturedInstructorRecord = Prisma.UserGetPayload<{ select: typeof instructorSelect }>;

function displayName(user: { name: string | null; firstName?: string | null; lastName?: string | null; email: string }) {
  return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
}

function publicSlug(user: { publicProfileSlug: string | null; id: string; name: string | null; email: string }) {
  if (user.publicProfileSlug) return user.publicProfileSlug;
  if (user.name) return user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return user.id;
}

function formatCardName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0]}\n${parts.slice(1).join(" ")}`;
}

function mapInstructor(user: FeaturedInstructorRecord): FeaturedInstructorRow {
  const eligibility = getInstructorPublicProfileEligibility(user);
  const publishedCourses = user.taughtCourses.length;
  const totalStudents = user.taughtCourses.reduce((sum, course) => sum + course._count.enrollments, 0);
  const ratings = user.taughtCourses.flatMap((course) => course.ratings.map((rating) => rating.rating));
  const averageRating = ratings.length > 0
    ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1))
    : 0;
  const score =
    averageRating * 20 +
    Math.min(totalStudents, 500) * 0.2 +
    publishedCourses * 8 +
    eligibility.items.filter((item) => item.complete).length * 3;

  const name = displayName(user);

  return {
    id: user.id,
    name,
    email: user.email,
    image: user.image || generateTapbackAvatar(name),
    headline: user.headline || "CSCN Instructor",
    slug: publicSlug(user),
    verificationStatus: user.instructorVerificationStatus,
    featuredOrder: user.instructorFeaturedOrder,
    checklist: eligibility.items.map((item) => ({ label: item.label, complete: item.complete })),
    missingLabels: eligibility.missingLabels,
    publishedCourses,
    totalStudents,
    averageRating,
    ratingCount: ratings.length,
    score: Math.round(score),
  };
}

export async function getFeaturedInstructorAdminData() {
  const users = await db.user.findMany({
    where: {
      instructorProfileEnabled: true,
    },
    select: instructorSelect,
    orderBy: [
      { instructorFeaturedOrder: "asc" },
      { updatedAt: "desc" },
    ],
  });

  const eligible = users
    .filter((user) => isInstructorFeatureEligible(user))
    .map(mapInstructor)
    .sort((a, b) => {
      const aFeatured = a.featuredOrder ?? 999;
      const bFeatured = b.featuredOrder ?? 999;
      if (aFeatured !== bFeatured) return aFeatured - bFeatured;
      return b.score - a.score;
    });

  const slots = Array.from({ length: 4 }, (_, index) => {
    const slot = index + 1;
    return eligible.find((instructor) => instructor.featuredOrder === slot) ?? null;
  });

  return {
    slots,
    suggestions: eligible,
  };
}

export async function getHomepageFeaturedInstructors(): Promise<HomepageFeaturedInstructor[]> {
  const users = await db.user.findMany({
    where: {
      instructorProfileEnabled: true,
      instructorVerificationStatus: "VERIFIED",
      publicProfileStatus: "PUBLIC",
      instructorFeatured: true,
      instructorFeaturedOrder: { not: null },
    },
    select: instructorSelect,
    orderBy: { instructorFeaturedOrder: "asc" },
    take: 4,
  });

  return users
    .filter((user) => isInstructorFeatureEligible(user))
    .map((user) => {
      const name = displayName(user);
      return {
        name: formatCardName(name),
        role: user.headline || "CSCN Instructor",
        image: user.image || generateTapbackAvatar(name),
        slug: publicSlug(user),
      };
    });
}
