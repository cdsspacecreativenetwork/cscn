import { db } from "@/lib/db";
import { getInstructorPublicProfileEligibility } from "@/lib/profile-eligibility";

type CreatorUser = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  emailVerified?: Date | string | null;
  image?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  expertise?: unknown;
  websiteUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  githubUrl?: string | null;
  behanceUrl?: string | null;
  dribbbleUrl?: string | null;
  telegramUrl?: string | null;
};

export type CreatorReadinessItem = {
  id: "email" | "name" | "photo" | "headline" | "bio" | "experience" | "expertise" | "social";
  label: string;
  description: string;
  complete: boolean;
  href?: string;
};

export type CreatorReadiness = {
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  canSubmitForReview: boolean;
  items: CreatorReadinessItem[];
  missingLabels: string[];
};

function hasText(value?: string | null, minLength = 2) {
  return !!value?.trim() && value.trim().length >= minLength;
}

function hasProfessionalName(user: CreatorUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return hasText(fullName, 2) || hasText(user.name, 2);
}

function hasHeadshot(user: CreatorUser) {
  if (!user.image) return false;
  return !user.image.includes("tapback.co/api/avatar");
}

export function getCreatorReadiness(user: CreatorUser): CreatorReadiness {
  const publicProfileEligibility = getInstructorPublicProfileEligibility(user);
  const profileItems = publicProfileEligibility.items.map((item) => ({
    ...item,
    id: item.id === "experience" || item.id === "expertise" || item.id === "social" ? item.id : item.id,
    href: "/dashboard/profile",
    description:
      item.id === "name" ? "Use the name learners should see on course pages." :
      item.id === "photo" ? "A professional headshot helps learners trust the course." :
      item.id === "headline" ? "Summarize your role, expertise, or creator identity." :
      item.id === "bio" ? "Explain your background, experience, and what learners can expect." :
      item.id === "experience" ? "Add the number of years you have practiced or taught this discipline." :
      item.id === "expertise" ? "Add the main disciplines you can confidently teach." :
      "Add LinkedIn, portfolio, website, GitHub, Behance, YouTube, or another professional profile.",
  })) as CreatorReadinessItem[];

  const items: CreatorReadinessItem[] = [
    {
      id: "email",
      label: "Verify your email",
      description: "Required before creator work can be submitted for review.",
      complete: !!user.emailVerified,
    },
    ...profileItems,
  ];

  const missingLabels = items.filter((item) => !item.complete).map((item) => item.label);
  const isEmailVerified = items[0].complete;
  const isProfileComplete = items.slice(1).every((item) => item.complete);

  return {
    isEmailVerified,
    isProfileComplete,
    canSubmitForReview: isEmailVerified && isProfileComplete,
    items,
    missingLabels,
  };
}

export async function getCreatorReadinessByUserId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      name: true,
      emailVerified: true,
      image: true,
      headline: true,
      bio: true,
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
    },
  });

  if (!user) throw new Error("User not found");
  return getCreatorReadiness(user);
}

export async function assertCreatorReadyForReview(userId: string) {
  const readiness = await getCreatorReadinessByUserId(userId);
  if (readiness.canSubmitForReview) return readiness;

  throw new Error(
    `Complete your creator setup before submitting courses for review: ${readiness.missingLabels.join(", ")}.`
  );
}

export async function assertEmailVerifiedByUserId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user) throw new Error("User not found");
  if (!user.emailVerified) throw new Error("Verify your email before using this feature.");
}
