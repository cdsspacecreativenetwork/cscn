import React from 'react';
import { currentUser } from '@/lib/auth';
import { getInstructorDashboardData, getStudentDashboardData } from '@/lib/services/dashboard.service';
import InstructorDashboardClient from '@/components/dashboard/InstructorDashboardClient';
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient';
import { redirect } from 'next/navigation';
import { getCreatorReadinessByUserId } from '@/lib/trust-gates';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Dashboard | CSCN',
  description: 'Your unified learning and teaching dashboard on CSCN.',
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user || !user.id) {
    redirect('/signin');
  }

  // Fetch full user record from DB to check role and instructor status
  const dbUser = await db.user.findUnique({
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
  });

  const role = dbUser?.role || user.role || 'USER';
  const isInstructor =
    role === 'INSTRUCTOR' ||
    dbUser?.learnerProfile?.learningFocus === 'INSTRUCTOR' ||
    dbUser?.instructorProfile?.isEnabled === true;

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin');
  }

  // Instructors ALWAYS get the creator/instructor dashboard view and NEVER go to student /onboarding
  if (isInstructor) {
    const [data, creatorReadiness] = await Promise.all([
      getInstructorDashboardData(user.id, 'INSTRUCTOR'),
      getCreatorReadinessByUserId(user.id),
    ]);
    return <InstructorDashboardClient data={data} user={user} creatorReadiness={creatorReadiness} />;
  }

  // Students ONLY
  const [data, instructorApplication] = await Promise.all([
    getStudentDashboardData(user.id, role),
    db.instructorApplication.findUnique({
      where: { userId: user.id },
      select: { status: true, submittedAt: true, reviewDueAt: true },
    }),
  ]);

  if (data.marketingSettings.launchMode && !data.hasCompletedLearnerOnboarding && !instructorApplication) {
    redirect('/onboarding');
  }

  return (
    <StudentDashboardClient
      data={data}
      user={user}
      instructorApplication={instructorApplication ? {
        status: instructorApplication.status,
        submittedAt: instructorApplication.submittedAt.toISOString(),
        reviewDueAt: instructorApplication.reviewDueAt.toISOString(),
      } : null}
    />
  );
}
