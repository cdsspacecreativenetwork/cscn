import React from 'react';
import { currentUser } from '@/lib/auth';
import { getInstructorDashboardData, getStudentDashboardData } from '@/lib/services/dashboard.service';
import InstructorDashboardClient from '@/components/dashboard/InstructorDashboardClient';
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient';
import { redirect } from 'next/navigation';
import { getCreatorReadinessByUserId } from '@/lib/trust-gates';
import { shouldRedirectInstructorToOnboarding } from '@/lib/instructor-onboarding';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Dashboard | CSCN',
  description: 'Your unified learning and teaching dashboard on CSCN.',
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/signin');
  }
  if (!user.id) {
    redirect('/signin');
  }

  const role = user.role || 'USER';

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin');
  }

  if (role === 'INSTRUCTOR' && await shouldRedirectInstructorToOnboarding(user.id)) {
    redirect('/dashboard/profile?setup=instructor');
  }

  // Role-aware dispatch: instructors get the creator-first view.
  if (role === 'INSTRUCTOR') {
    const [data, creatorReadiness] = await Promise.all([
      getInstructorDashboardData(user.id, role),
      getCreatorReadinessByUserId(user.id),
    ]);
    return <InstructorDashboardClient data={data} user={user} creatorReadiness={creatorReadiness} />;
  } else {
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
}
