type ProfileSubject = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  image?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  expertise?: unknown;
  learningFocus?: string | null;
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

export type EligibilityItemId =
  | "name"
  | "photo"
  | "headline"
  | "bio"
  | "experience"
  | "expertise"
  | "social"
  | "student_signal";

export type EligibilityItem = {
  id: EligibilityItemId;
  label: string;
  complete: boolean;
};

export type ProfileEligibility = {
  eligible: boolean;
  items: EligibilityItem[];
  missingLabels: string[];
};

const SOCIAL_URL_KEYS = [
  "websiteUrl",
  "portfolioUrl",
  "linkedinUrl",
  "twitterUrl",
  "instagramUrl",
  "youtubeUrl",
  "githubUrl",
  "behanceUrl",
  "dribbbleUrl",
  "telegramUrl",
] as const;

function hasText(value?: string | null, minLength = 2) {
  return !!value?.trim() && value.trim().length >= minLength;
}

function hasDisplayName(user: ProfileSubject) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return hasText(fullName, 2) || hasText(user.name, 2);
}

function hasRealPhoto(user: ProfileSubject) {
  if (!user.image) return false;
  return !user.image.includes("tapback.co/api/avatar") && !user.image.includes("dicebear.com");
}

function hasExpertise(user: ProfileSubject) {
  return Array.isArray(user.expertise) && user.expertise.some((item) => typeof item === "string" && hasText(item, 2));
}

function hasExplicitSocialUrl(user: ProfileSubject) {
  return SOCIAL_URL_KEYS.some((key) => {
    const value = user[key];
    return typeof value === "string" && /^https?:\/\//i.test(value);
  });
}

function buildEligibility(items: EligibilityItem[]): ProfileEligibility {
  const missingLabels = items.filter((item) => !item.complete).map((item) => item.label);
  return {
    eligible: missingLabels.length === 0,
    items,
    missingLabels,
  };
}

export function getInstructorPublicProfileEligibility(user: ProfileSubject) {
  return buildEligibility([
    { id: "name", label: "Professional name", complete: hasDisplayName(user) },
    { id: "photo", label: "Real profile photo", complete: hasRealPhoto(user) },
    { id: "headline", label: "Professional headline", complete: hasText(user.headline, 6) },
    { id: "bio", label: "Instructor bio", complete: hasText(user.bio, 40) },
    {
      id: "experience",
      label: "Years of experience",
      complete: typeof user.yearsExperience === "number" && user.yearsExperience > 0,
    },
    { id: "expertise", label: "Expertise tags", complete: hasExpertise(user) },
    { id: "social", label: "At least one professional link", complete: hasExplicitSocialUrl(user) },
  ]);
}

export function getStudentPublicProfileEligibility(
  user: ProfileSubject,
  signals: { completedCourses?: number; certificates?: number; achievements?: number; projects?: number } = {}
) {
  const hasStudentSignal = [
    signals.completedCourses,
    signals.certificates,
    signals.achievements,
    signals.projects,
  ].some((value) => typeof value === "number" && value > 0);

  return buildEligibility([
    { id: "name", label: "Display name", complete: hasDisplayName(user) },
    { id: "photo", label: "Real profile photo", complete: hasRealPhoto(user) },
    {
      id: "headline",
      label: "Headline or learning focus",
      complete: hasText(user.headline, 6) || hasText(user.learningFocus, 6),
    },
    { id: "bio", label: "Short bio", complete: hasText(user.bio, 24) },
    { id: "student_signal", label: "Completed course, certificate, achievement, or project", complete: hasStudentSignal },
  ]);
}

export function isInstructorFeatureEligible(user: ProfileSubject & { instructorVerificationStatus?: string | null }) {
  return (
    user.instructorVerificationStatus === "VERIFIED" &&
    getInstructorPublicProfileEligibility(user).eligible
  );
}
