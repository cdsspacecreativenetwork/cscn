import { db } from "@/lib/db";

type CreatorUser = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  emailVerified?: Date | string | null;
  image?: string | null;
  headline?: string | null;
  bio?: string | null;
};

export type CreatorReadinessItem = {
  id: "email" | "name" | "photo" | "headline" | "bio";
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
  const items: CreatorReadinessItem[] = [
    {
      id: "email",
      label: "Verify your email",
      description: "Required before creator work can be submitted for review.",
      complete: !!user.emailVerified,
    },
    {
      id: "name",
      label: "Add your professional name",
      description: "Use the name learners should see on course pages.",
      complete: hasProfessionalName(user),
      href: "/dashboard/profile",
    },
    {
      id: "photo",
      label: "Upload a real profile photo",
      description: "A professional headshot helps learners trust the course.",
      complete: hasHeadshot(user),
      href: "/dashboard/profile",
    },
    {
      id: "headline",
      label: "Add a professional headline",
      description: "Summarize your role, expertise, or creator identity.",
      complete: hasText(user.headline, 6),
      href: "/dashboard/profile",
    },
    {
      id: "bio",
      label: "Write your instructor bio",
      description: "Explain your background, experience, and what learners can expect.",
      complete: hasText(user.bio, 40),
      href: "/dashboard/profile",
    },
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
    },
  });

  if (!user) throw new Error("User not found");
  return getCreatorReadiness(user);
}

export async function assertCreatorReadyForReview(userId: string) {
  const readiness = await getCreatorReadinessByUserId(userId);
  if (readiness.canSubmitForReview) return readiness;

  throw new Error(
    `Complete your creator setup before creating or submitting courses: ${readiness.missingLabels.join(", ")}.`
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
