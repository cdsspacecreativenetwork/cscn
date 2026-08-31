import { currentUser } from '@/lib/auth';
import { resolveSmartPostLoginRedirect } from '@/actions/workspace';
import { redirect } from 'next/navigation';

export default async function DashboardLegacyPage() {
  const user = await currentUser();

  if (!user || !user.id || !user.email) {
    redirect('/signin');
  }

  const target = await resolveSmartPostLoginRedirect(user.email);
  redirect(target);
}
