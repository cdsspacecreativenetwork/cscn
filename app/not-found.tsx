import { auth } from '@/auth';
import NotFoundClient from '@/components/404/NotFoundClient';

export default async function NotFound() {
  const session = await auth();
  return <NotFoundClient userEmail={session?.user?.email ?? null} />;
}
