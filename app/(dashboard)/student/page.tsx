import React from 'react';
import { currentUser } from '@/lib/auth';
import { getStudentDashboardData } from '@/lib/services/dashboard.service';
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Student Dashboard | CSCN',
  description: 'Your learner workspace on CSCN.',
};

export default async function StudentDashboardPage() {
  const user = await currentUser();

  if (!user || !user.id) {
    redirect('/signin');
  }

  const dashboardData = await getStudentDashboardData(user.id);

  return (
    <StudentDashboardClient
      user={user}
      data={dashboardData}
    />
  );
}
