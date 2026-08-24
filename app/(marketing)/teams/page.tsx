import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Check, FileText, ShieldCheck, UsersRound } from "lucide-react";

import { requestOrganizationAction } from "@/actions/organizations";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Team Training & Workforce Learning | CSCN for Teams",
  description: "Train teams with CSCN learning paths, private cohorts, practical projects, expert instructors, and progress reporting.",
};

const capabilities = [
  { icon: UsersRound, title: "Seats with purpose", copy: "Purchase only the seats you need, invite learners, and allocate access after your package is active." },
  { icon: Building2, title: "Private learning spaces", copy: "Organize people into teams and connect them to structured programs or private cohorts." },
  { icon: BarChart3, title: "Useful reporting", copy: "See activation, aggregate completion, credentials, and capacity without exposing private learner work." },
  { icon: FileText, title: "Invoice-led billing", copy: "Review a clear seat quote and invoice before access is activated. No hidden or fabricated checkout flow." },
];

const workspaceFeatures = [
  "Organization account", "Teams and administrators", "Seat packages", "Private cohorts", "Member invitations", "Learning assignments",
  "Aggregate progress", "Completion reporting", "Credentials", "Invoices", "Audit-ready access", "Truthful empty states",
];

const fieldLabel = "grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-navy";
const inputClass = "cscn-form-field h-12 px-4 text-sm font-medium normal-case tracking-normal";

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ teamError?: string }> }) {
  const [user, query] = await Promise.all([currentUser(), searchParams]);

  return (
    <main className="cscn-marketing-page">
      <section className="relative overflow-hidden border-b border-stroke pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(28,78,209,0.13),transparent_32%)]" />
        <div className="cscn-marketing-shell relative grid gap-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="cscn-marketing-eyebrow">CSCN for teams</p>
            <h1 className="cscn-marketing-display mt-5 max-w-[13ch]">Build the skills your team needs next.</h1>
            <p className="cscn-marketing-copy mt-7 max-w-2xl text-lg">Create practical learning programs for your organization with curated courses, private cohorts, expert facilitators, projects, and progress reporting.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#request-team-plan" className="cscn-button-primary">Talk to CSCN <ArrowRight size={17} /></a>
              <a href="#team-learning" className="cscn-button-secondary">Explore team learning</a>
            </div>
          </div>
          <div className="cscn-marketing-card p-7 md:p-9">
            <p className="text-sm font-bold text-navy">The team learning loop</p>
            <ol className="mt-6 space-y-5">
              {["Choose a practical program", "Confirm seats and invoice", "Invite and allocate access", "Review aggregate progress"].map((item, index) => (
                <li key={item} className="flex items-center gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] text-sm font-bold text-primary">{index + 1}</span>
                  <span className="font-semibold text-navy">{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-7 border-t border-stroke pt-5 text-xs font-medium leading-5 text-text-body">CSCN does not promise performance outcomes or create learner access before a seat package is confirmed.</p>
          </div>
        </div>
      </section>

      <section id="team-learning" className="cscn-marketing-shell py-20 md:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><p className="cscn-marketing-eyebrow">A real operating workspace</p><h2 className="cscn-marketing-heading mt-3 max-w-3xl">From seat request to visible learning progress.</h2></div>
          <p className="cscn-marketing-copy max-w-sm text-sm">Organization membership never bypasses course or cohort payment rules. Authorized seat allocation is the access boundary.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="cscn-marketing-card flex min-h-72 flex-col p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0FF] text-primary"><Icon size={24} strokeWidth={1.8} /></span>
              <h3 className="mt-auto pt-12 text-xl font-semibold tracking-[-0.025em] text-navy">{title}</h3><p className="mt-3 text-sm leading-6 text-text-body">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-navy py-20 text-white md:py-28">
        <div className="cscn-marketing-shell grid gap-12 lg:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#AFC3FF]">Included in the workspace</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">Training operations without spreadsheet guesswork.</h2></div>
          <div className="grid gap-x-8 sm:grid-cols-2">{workspaceFeatures.map((item) => <div key={item} className="flex items-center gap-3 border-b border-white/15 py-3 text-sm font-semibold"><Check size={16} className="text-[#AFC3FF]" />{item}</div>)}</div>
        </div>
      </section>

      <section id="request-team-plan" className="cscn-marketing-shell py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0FF] text-primary"><ShieldCheck size={25} /></span>
            <h2 className="cscn-marketing-heading mt-6">Request an organization workspace.</h2>
            <p className="cscn-marketing-copy mt-5 text-sm">The workspace begins in review. CSCN must approve it before invitations, seat requests, or learning assignments can be used.</p>
            {!user && <Link href="/signin?callbackUrl=%2Fteams%23request-team-plan" className="mt-7 inline-flex items-center gap-2 font-bold text-primary">Sign in to start <ArrowRight size={16} /></Link>}
          </div>
          {user && (
            <form action={requestOrganizationAction} className="cscn-marketing-card grid gap-5 p-6 md:grid-cols-2 md:p-9">
              {query.teamError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 md:col-span-2">{query.teamError}</p>}
              <label className={fieldLabel}>Organization name<input name="name" required minLength={2} maxLength={120} className={inputClass} /></label>
              <label className={fieldLabel}>Workspace URL<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="northstar-studio" className={inputClass} /></label>
              <label className={fieldLabel}>Organization type<select name="type" className={inputClass}><option value="COMPANY">Company</option><option value="NONPROFIT">Nonprofit</option><option value="SCHOOL">School</option><option value="AGENCY">Agency</option><option value="COMMUNITY">Community</option><option value="OTHER">Other</option></select></label>
              <label className={fieldLabel}>Country<input name="country" required defaultValue="Nigeria" className={inputClass} /></label>
              <label className={fieldLabel}>Website (optional)<input name="websiteUrl" type="url" placeholder="https://…" className={inputClass} /></label>
              <label className={fieldLabel}>Official domain (optional)<input name="officialDomain" placeholder="company.com" className={inputClass} /></label>
              <label className={`${fieldLabel} md:col-span-2`}>What should your team learn?<textarea name="description" required minLength={30} maxLength={2000} rows={5} className="cscn-form-field p-4 text-sm font-medium leading-6 normal-case tracking-normal" /></label>
              <button className="cscn-button-primary md:col-span-2">Request workspace review</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
