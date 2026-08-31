import Link from 'next/link';
import { ArrowRight, Building2, Plus } from 'lucide-react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { LearnerPageHeader } from '@/components/dashboard/learner/LearnerPageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState, EmptyStateContent, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@/components/ui/EmptyState';
import { formatOrganizationRole } from '@/lib/organizations';
import { getUserOrganizations } from '@/lib/services/organization.service';

export const metadata = { title: 'My organizations | CSCN' };

export default async function OrganizationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');
  const memberships = await getUserOrganizations(session.user.id);

  return (
    <main className="mx-auto flex max-w-[1480px] flex-col gap-7 p-[clamp(16px,2.78vw,48px)] pb-28">
      <LearnerPageHeader
        compact
        eyebrow="Team learning"
        title="My organizations"
        description="Manage approved team workspaces, learning seats, assignments, and privacy-safe reporting."
      />

      {memberships.length > 0 ? (
        <section aria-label="Organization workspaces" className="grid gap-5 lg:grid-cols-2">
          {memberships.map(({ role, organization }) => (
            <Link key={organization.id} href={`/dashboard/organizations/${organization.slug}`} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <Card className="h-full transition-[border-color,transform] group-hover:-translate-y-0.5 group-hover:border-primary/40 motion-reduce:transform-none">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <Badge variant={organization.status === 'ACTIVE' ? 'default' : 'secondary'}>{organization.status.replaceAll('_', ' ')}</Badge>
                    <ArrowRight className="text-text-mute transition-transform group-hover:translate-x-1 group-hover:text-primary motion-reduce:transform-none" size={18} aria-hidden="true" />
                  </div>
                  <CardTitle className="mt-3">{organization.name}</CardTitle>
                </CardHeader>
                <CardContent><p className="line-clamp-2 text-sm font-normal leading-6 text-text-body">{organization.description || 'Organization learning workspace'}</p></CardContent>
                <CardFooter className="flex-wrap gap-x-5 gap-y-2 border-t text-xs font-medium text-text-body"><span>{organization._count.members} members</span><span>{organization._count.teams} teams</span><span>{formatOrganizationRole(role)}</span></CardFooter>
              </Card>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState className="py-12 sm:py-16">
          <EmptyStateIcon><Building2 size={24} aria-hidden="true" /></EmptyStateIcon>
          <EmptyStateTitle>No organization workspace yet</EmptyStateTitle>
          <EmptyStateDescription>Request a team-learning workspace or accept an invitation from an organization administrator.</EmptyStateDescription>
          <EmptyStateContent>
            <Link href="/teams#request-team-plan" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Plus size={17} aria-hidden="true" /> Request workspace</Link>
          </EmptyStateContent>
        </EmptyState>
      )}
    </main>
  );
}
