import { db } from "@/lib/db";
import { getCreatorReadiness } from "@/lib/trust-gates";

export function getInstructorRoleTransitionData(newRole: string) {
  if (newRole === "INSTRUCTOR") {
    return {
      instructorProfileEnabled: true,
      publicProfileStatus: "DRAFT" as const,
      instructorVerificationStatus: "NOT_STARTED" as const,
      instructorVerifiedAt: null,
      instructorFeatured: false,
      instructorFeaturedOrder: null,
    };
  }

  return {
    instructorProfileEnabled: false,
    publicProfileStatus: "DRAFT" as const,
    instructorVerificationStatus: "NOT_STARTED" as const,
    instructorVerifiedAt: null,
    instructorFeatured: false,
    instructorFeaturedOrder: null,
    mentorshipEnabled: false,
  };
}

export async function getInstructorOnboardingStatusByUserId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      id: true,
      email: true,
      instructorProfileEnabled: true,
      instructorVerificationStatus: true,
      publicProfileStatus: true,
      publicProfileSlug: true,
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

  const readiness = getCreatorReadiness(user);
  const hasInstructorProfile = user.instructorProfileEnabled;
  const isInstructor = user.role === "INSTRUCTOR" || hasInstructorProfile;
  const publicSlug =
    user.publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    user.id;
  const mustCompleteProfile = hasInstructorProfile && !readiness.isProfileComplete;
  const canRequestVerification =
    hasInstructorProfile &&
    readiness.canSubmitForReview &&
    (user.instructorVerificationStatus === "NOT_STARTED" || user.instructorVerificationStatus === "REJECTED");

  return {
    isInstructor,
    hasInstructorProfile,
    mustCompleteProfile,
    canRequestVerification,
    verificationStatus: user.instructorVerificationStatus,
    publicProfileStatus:
      hasInstructorProfile && readiness.isProfileComplete ? "PUBLIC" : user.publicProfileStatus,
    publicProfileUrl:
      hasInstructorProfile && readiness.isProfileComplete
        ? `/instructor/${publicSlug}`
        : null,
    readiness,
  };
}

export async function shouldRedirectInstructorToOnboarding(userId: string) {
  const status = await getInstructorOnboardingStatusByUserId(userId);
  return status.mustCompleteProfile;
}
