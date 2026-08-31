import { db } from "@/lib/db";
import { getCreatorReadiness } from "@/lib/trust-gates";

export async function getInstructorOnboardingStatusByUserId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      emailVerified: true,
      image: true,
      profile: {
        select: {
          publicProfileStatus: true,
          publicProfileSlug: true,
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
        },
      },
      instructorProfile: {
        select: {
          isEnabled: true,
          verificationStatus: true,
          yearsExperience: true,
          expertise: true,
          bio: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

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
  };

  const readiness = getCreatorReadiness(mergedUser);
  const hasInstructorProfile = user.instructorProfile?.isEnabled ?? false;
  const verificationStatus = user.instructorProfile?.verificationStatus ?? "NOT_STARTED";
  const publicProfileStatus = user.profile?.publicProfileStatus ?? "DRAFT";
  const publicProfileSlug = user.profile?.publicProfileSlug;
  const isInstructor = user.role === "INSTRUCTOR" || hasInstructorProfile;
  const publicSlug =
    publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    user.id;
  const mustCompleteProfile = false;
  const canRequestVerification =
    hasInstructorProfile &&
    readiness.canSubmitForReview &&
    (verificationStatus === "NOT_STARTED" || verificationStatus === "REJECTED");

  return {
    isInstructor,
    hasInstructorProfile,
    mustCompleteProfile,
    canRequestVerification,
    verificationStatus,
    publicProfileStatus,
    publicProfileUrl:
      hasInstructorProfile && publicProfileStatus === "PUBLIC"
        ? `/instructor/${publicSlug}`
        : null,
    readiness,
  };
}

export async function shouldRedirectInstructorToOnboarding(userId: string) {
  const status = await getInstructorOnboardingStatusByUserId(userId);
  return status.mustCompleteProfile;
}

export function getInstructorRoleTransitionData(role: string) {
  if (role === "INSTRUCTOR") {
    return {
      instructorProfile: {
        upsert: {
          create: { isEnabled: true, verificationStatus: "VERIFIED", verifiedAt: new Date() },
          update: { isEnabled: true, verificationStatus: "VERIFIED", verifiedAt: new Date() },
        },
      },
    };
  }
  return {};
}
