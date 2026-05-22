import React from 'react';
import { currentUser } from '@/lib/auth';
import { getInstructorDashboardData, getStudentDashboardData } from '@/lib/services/dashboard.service';
import InstructorDashboardClient from '@/components/dashboard/InstructorDashboardClient';
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient';
import { redirect } from 'next/navigation';
import { getCreatorReadinessByUserId } from '@/lib/trust-gates';

export const metadata = {
  title: 'Dashboard | CSCN',
  description: 'Your unified learning and teaching dashboard on CSCN.',
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = user.role || 'USER';

  // Role-aware dispatch: Instructors, Admins, and Super Admins get the creator-first view
  if (role === 'INSTRUCTOR' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    const [data, creatorReadiness] = await Promise.all([
      getInstructorDashboardData(user.id || '1'),
      getCreatorReadinessByUserId(user.id || '1'),
    ]);
    return <InstructorDashboardClient data={data} user={user} creatorReadiness={creatorReadiness} />;
  } else {
    const data = await getStudentDashboardData(user.id || '1');
    return <StudentDashboardClient data={data} user={user} />;
  }
}
