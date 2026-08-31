import { getLearnerInterestProfileByUserId } from "@/data/learner-insights";
import { getMarketingSettings } from "@/data/marketing";
import { db } from "@/lib/db";

export async function getPostAuthRedirect(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      learnerProfile: { select: { learningFocus: true } },
      instructorProfile: { select: { isEnabled: true } },
    },
  });

  const role = user?.role ?? "USER";
  const learningFocus = user?.learnerProfile?.learningFocus;
  const instructorProfileEnabled = user?.instructorProfile?.isEnabled ?? false;
  const isInstructor = role === "INSTRUCTOR" || learningFocus === "INSTRUCTOR" || instructorProfileEnabled === true;

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "/dashboard/admin";
  }

  // Instructors ALWAYS go directly to /dashboard and NEVER to student /onboarding
  if (isInstructor) {
    return "/dashboard";
  }

  // Students ONLY: check launch mode & student onboarding
  const [marketingSettings, learnerInterestProfile] = await Promise.all([
    getMarketingSettings(),
    getLearnerInterestProfileByUserId(userId),
  ]);

  if (marketingSettings.launchMode && !learnerInterestProfile?.onboardingCompletedAt) {
    return "/onboarding";
  }

  return "/dashboard";
}
