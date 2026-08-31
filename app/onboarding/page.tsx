import { redirect } from 'next/navigation';

import LaunchOnboardingFlow from '@/components/onboarding/LaunchOnboardingFlow';
import { getLearnerInterestProfileByUserId } from '@/data/learner-insights';
import { getMarketingSettings } from '@/data/marketing';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  INTEREST_AREA_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from '@/lib/learner-interest-options';

export const metadata = {
  title: 'Onboarding | CSCN',
  description: 'Set up your CSCN learning path.',
};

function filterOptions<T extends readonly string[]>(value: unknown, options: T): T[number][] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(options);
  return value.filter((item): item is T[number] => typeof item === 'string' && allowed.has(item));
}

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect('/signin?callbackUrl=/onboarding');
  }

  const role = user.role || 'USER';

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin');
  }

  if (role === 'INSTRUCTOR') {
    redirect('/dashboard');
  }

  const [marketingSettings, profile, learner] = await Promise.all([
    getMarketingSettings(),
    getLearnerInterestProfileByUserId(user.id),
    db.user.findUnique({
      where: { id: user.id },
      select: {
        learnerProfile: { select: { onboardingCohort: true } },
        instructorProfile: { select: { isEnabled: true, verificationStatus: true } },
      },
    }),
  ]);

  // If user is an instructor or has completed student onboarding or platform is not in launch mode
  const isAlreadyOnboarded =
    Boolean(profile?.onboardingCompletedAt) ||
    Boolean(learner?.instructorProfile?.isEnabled) ||
    learner?.instructorProfile?.verificationStatus === 'PENDING' ||
    learner?.instructorProfile?.verificationStatus === 'VERIFIED' ||
    !marketingSettings.launchMode;

  if (isAlreadyOnboarded) {
    redirect('/dashboard');
  }

  return (
    <LaunchOnboardingFlow
      userName={user.name}
      rolloutDate={marketingSettings.firstCourseRolloutDate}
      isPioneer={Boolean(learner?.learnerProfile?.onboardingCohort)}
      launchMode={marketingSettings.launchMode}
      initialProfile={{
        interestAreas: filterOptions(profile?.interestAreas, INTEREST_AREA_OPTIONS),
        skillLevel: SKILL_LEVEL_OPTIONS.includes(profile?.skillLevel as typeof SKILL_LEVEL_OPTIONS[number])
          ? profile!.skillLevel as typeof SKILL_LEVEL_OPTIONS[number]
          : SKILL_LEVEL_OPTIONS[0],
        primaryGoal: PRIMARY_GOAL_OPTIONS.includes(profile?.primaryGoal as typeof PRIMARY_GOAL_OPTIONS[number])
          ? profile!.primaryGoal as typeof PRIMARY_GOAL_OPTIONS[number]
          : PRIMARY_GOAL_OPTIONS[0],
        learningStyle: filterOptions(profile?.learningStyle, LEARNING_STYLE_OPTIONS),
        note: profile?.note ?? '',
        completed: Boolean(profile?.onboardingCompletedAt),
      }}
    />
  );
}

