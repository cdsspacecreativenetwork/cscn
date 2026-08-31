import React from 'react';
import { currentUser } from '@/lib/auth';
import { getInstructorDashboardData } from '@/lib/services/dashboard.service';
import InstructorDashboardClient from '@/components/dashboard/InstructorDashboardClient';
import { redirect } from 'next/navigation';
import { getCreatorReadinessByUserId } from '@/lib/trust-gates';

export const metadata = {
  title: 'Instructor Studio | CSCN',
  description: 'Your instructor workspace on CSCN.',
};

export default async function InstructorDashboardPage() {
  const user = await currentUser();

  if (!user || !user.id) {
    redirect('/signin');
  }

  const [dashboardData, creatorReadiness] = await Promise.all([
    getInstructorDashboardData(user.id),
    getCreatorReadinessByUserId(user.id),
  ]);

  return (
    <InstructorDashboardClient
      user={user}
      data={dashboardData}
      creatorReadiness={creatorReadiness}
    />
  );
}
