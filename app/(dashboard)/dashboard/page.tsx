import React from 'react';
import { currentUser } from '@/lib/auth';
import { getInstructorDashboardData, getStudentDashboardData } from '@/lib/services/dashboard.service';
import InstructorDashboardClient from '@/components/dashboard/InstructorDashboardClient';
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient';
import { redirect } from 'next/navigation';
import { getCreatorReadinessByUserId } from '@/lib/trust-gates';
import { shouldRedirectInstructorToOnboarding } from '@/lib/instructor-onboarding';

export const metadata = {
  title: 'Dashboard | CSCN',
  description: 'Your unified learning and teaching dashboard on CSCN.',
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/login');
  }
  if (!user.id) {
    redirect('/auth/login');
  }

  const role = user.role || 'USER';

  if (role === 'INSTRUCTOR' && await shouldRedirectInstructorToOnboarding(user.id)) {
    redirect('/dashboard/profile?setup=instructor');
  }

  // Role-aware dispatch: Instructors, Admins, and Super Admins get the creator-first view
  if (role === 'INSTRUCTOR' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    const [data, creatorReadiness] = await Promise.all([
      getInstructorDashboardData(user.id),
      getCreatorReadinessByUserId(user.id),
    ]);
    return <InstructorDashboardClient data={data} user={user} creatorReadiness={creatorReadiness} />;
  } else {
    const data = await getStudentDashboardData(user.id);
    return <StudentDashboardClient data={data} user={user} />;
  }
}
