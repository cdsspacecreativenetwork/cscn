import React from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import InstructorOnboardingClient from './InstructorOnboardingClient';

export const metadata = {
  title: 'Instructor Onboarding | CSCN',
  description: 'Complete your CSCN instructor profile and teaching preferences.',
};

export default async function InstructorOnboardingPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect('/signin?callbackUrl=/instructor/onboarding');
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      learningFocus: true,
      instructorProfileEnabled: true,
      instructorVerificationStatus: true,
      bio: true,
    },
  });

  const role = dbUser?.role || user.role || 'USER';

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin');
  }

  // If user has ALREADY completed instructor onboarding or is an active instructor
  const isAlreadyInstructorOnboarded =
    role === 'INSTRUCTOR' ||
    dbUser?.instructorVerificationStatus === 'PENDING' ||
    dbUser?.instructorVerificationStatus === 'VERIFIED' ||
    (dbUser?.instructorProfileEnabled && dbUser?.bio);

  if (isAlreadyInstructorOnboarded) {
    redirect('/dashboard');
  }

  return <InstructorOnboardingClient />;
}
