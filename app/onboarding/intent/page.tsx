import React from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getLearnerInterestProfileByUserId } from '@/data/learner-insights';
import OnboardingIntentClient from './OnboardingIntentClient';

export const metadata = {
  title: 'Welcome | Select Account Role',
  description: 'Select how you would like to use your CSCN account.',
};

export default async function OnboardingIntentPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect('/signin?callbackUrl=/onboarding/intent');
  }

  const [dbUser, learnerProfile] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        learnerProfile: {
          select: {
            learningFocus: true,
          },
        },
        instructorProfile: {
          select: {
            isEnabled: true,
            verificationStatus: true,
          },
        },
      },
    }),
    getLearnerInterestProfileByUserId(user.id),
  ]);

  const role = dbUser?.role || user.role || 'USER';

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin');
  }

  // If user has ALREADY completed onboarding as instructor or student, block access to /onboarding/intent
  const isInstructor =
    role === 'INSTRUCTOR' ||
    dbUser?.learnerProfile?.learningFocus === 'INSTRUCTOR' ||
    dbUser?.instructorProfile?.isEnabled === true ||
    dbUser?.instructorProfile?.verificationStatus === 'PENDING' ||
    dbUser?.instructorProfile?.verificationStatus === 'VERIFIED';

  const isStudentOnboarded = Boolean(learnerProfile?.onboardingCompletedAt);

  if (isInstructor || isStudentOnboarded) {
    redirect('/dashboard');
  }

  return <OnboardingIntentClient />;
}
