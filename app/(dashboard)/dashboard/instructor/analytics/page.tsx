import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BarChart2 } from 'lucide-react';

export default async function InstructorAnalyticsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
        <BarChart2 size={28} className="text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-navy">Instructor Analytics</h1>
      <p className="text-text-mute max-w-sm text-sm">
        Aggregate analytics across all your courses — coming soon. View per-course analytics from each course studio.
      </p>
    </div>
  );
}
