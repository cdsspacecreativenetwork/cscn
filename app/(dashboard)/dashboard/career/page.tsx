import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, Eye, EyeOff } from 'lucide-react';

import { markOpportunityAppliedAction, updateTalentProfileAction } from '@/actions/career';
import { LearnerPageHeader, LearnerSectionHeader } from '@/components/dashboard/learner/LearnerPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { currentUser } from '@/lib/auth';
import { getCareerHub } from '@/lib/services/career.service';

export const metadata: Metadata = { title: 'My Career Hub | CSCN' };

export default async function CareerDashboardPage({ searchParams }: { searchParams: Promise<{ careerError?: string }> }) {
  const [user, query] = await Promise.all([currentUser(), searchParams]);
  if (!user?.id) return null;

  const data = await getCareerHub({}, user.id);
  const tracked = data.opportunities.filter((item) => item.saved || item.interestStatus);
  const profile = data.talentProfile;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <LearnerPageHeader
        compact
        eyebrow="My Career Hub"
        title="Turn evidence into a clearer next step."
        description="Manage your talent visibility, saved roles, and application intent without making employment claims."
      />

      {query.careerError ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {query.careerError}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <LearnerSectionHeader title="Choose what employers can discover." description="Talent profile" />
              {profile?.discoverable ? <Eye className="shrink-0 text-primary" aria-label="Profile discoverable" /> : <EyeOff className="shrink-0 text-text-mute" aria-label="Profile hidden" />}
            </div>
          </CardHeader>
          <CardContent>
            <form action={updateTalentProfileAction} className="flex flex-col gap-4">
              <label className="flex items-start gap-3 rounded-2xl bg-background p-4">
                <input type="checkbox" name="discoverable" defaultChecked={profile?.discoverable} className="mt-1 size-4 accent-primary" />
                <span>
                  <span className="block text-sm font-medium text-navy">Opt into the CSCN talent directory</span>
                  <span className="mt-1 block text-xs font-normal leading-5 text-text-body">Only approved partners should receive access. Turning this off hides your talent profile.</span>
                </span>
              </label>
              <label className="text-sm font-medium text-navy">Target roles<Input name="targetRoles" required defaultValue={profile?.targetRoles.join(', ')} placeholder="Product designer, Frontend engineer" className="mt-2 h-11" /></label>
              <label className="text-sm font-medium text-navy">Skills<Input name="skills" required defaultValue={profile?.skills.join(', ')} placeholder="Figma, Research, React" className="mt-2 h-11" /></label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-navy">Availability<Input name="availability" defaultValue={profile?.availability ?? ''} placeholder="Available from October" className="mt-2 h-11" /></label>
                <label className="text-sm font-medium text-navy">Preferred work mode<select name="preferredWorkplace" defaultValue={profile?.preferredWorkplace ?? ''} className="mt-2 h-11 w-full rounded-xl border border-stroke-ii bg-card-bg px-3 text-sm"><option value="">No preference</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label>
              </div>
              <label className="text-sm font-medium text-navy">CV link<Input type="url" name="cvUrl" defaultValue={profile?.cvUrl ?? ''} placeholder="https://…" className="mt-2 h-11" /></label>
              <label className="text-sm font-medium text-navy">Short career statement<textarea name="statement" maxLength={800} rows={4} defaultValue={profile?.statement ?? ''} className="mt-2 w-full rounded-xl border border-stroke-ii bg-card-bg px-4 py-3 text-sm font-normal leading-6" /></label>
              <button className="min-h-11 self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Save career profile</button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between gap-4"><CardTitle>Tracked opportunities</CardTitle><BriefcaseBusiness className="text-primary" aria-hidden="true" /></div>
          </CardHeader>
          <CardContent>
            {tracked.length > 0 ? (
              <div className="flex flex-col gap-3">
                {tracked.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-stroke p-4">
                    <p className="text-xs font-semibold text-primary">{item.company}</p>
                    <h3 className="mt-1 text-base font-semibold text-navy">{item.role}</h3>
                    <p className="mt-2 text-xs font-medium text-text-body">{item.saved ? 'Saved' : ''}{item.saved && item.interestStatus ? ' · ' : ''}{item.interestStatus ? item.interestStatus.toLowerCase() : ''}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a href={item.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary">Open role <ArrowUpRight size={15} aria-hidden="true" /></a>
                      {item.interestStatus === 'STARTED' ? <form action={markOpportunityAppliedAction}><input type="hidden" name="opportunityId" value={item.id} /><button className="text-sm font-medium text-primary">Mark applied</button></form> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState className="px-4 py-8">
                <EmptyStateIcon><BriefcaseBusiness size={22} aria-hidden="true" /></EmptyStateIcon>
                <EmptyStateTitle>No tracked roles yet</EmptyStateTitle>
                <EmptyStateDescription>Saved roles and application intent will appear here.</EmptyStateDescription>
              </EmptyState>
            )}
            <Link href="/career#opportunities" className="mt-5 inline-flex text-sm font-medium text-primary">Browse opportunity board</Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
