import { getLearnerInterestProfileByUserId } from "@/data/learner-insights";
import { getMarketingSettings } from "@/data/marketing";
import { shouldRedirectInstructorToOnboarding } from "@/lib/instructor-onboarding";
import { db } from "@/lib/db";

export async function getPostAuthRedirect(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const role = user?.role ?? "USER";

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "/dashboard/admin";
  }

  if (role === "INSTRUCTOR") {
    return await shouldRedirectInstructorToOnboarding(userId)
      ? "/dashboard/profile?setup=instructor"
      : "/dashboard";
  }

  const [marketingSettings, learnerInterestProfile] = await Promise.all([
    getMarketingSettings(),
    getLearnerInterestProfileByUserId(userId),
  ]);

  if (marketingSettings.launchMode && !learnerInterestProfile?.onboardingCompletedAt) {
    return "/onboarding";
  }

  return "/dashboard";
}

