# CSCN implementation and review guide

This document describes the feature work implemented on `codex/phase-0-safety-baseline`, based on audited commit `2e921aa4`. It is the reviewer map for the security baseline, cohort learning lifecycle, community and career features, team learning, public design-system alignment, and release controls included in the branch.

The branch extends the existing LMS, payments, mentorship, scheduling, and administration systems. It does not replace them, deploy the application, or modify a production database.

## Product principles

- Published database records are the source of truth for public and dashboard experiences.
- Local QA records are explicitly labelled `[QA]` or `[Preview]` and are never production claims.
- Paid access is granted only after verified payment fulfillment or authorized organization seat allocation.
- Empty states are truthful. Missing data or third-party credentials never trigger fabricated integrations or outcomes.
- Public feature pages use the existing CSCN marketing system: Inter typography, CSCN blue and navy, cool borders, pill-shaped CTAs, and the established responsive spacing scale.
- Admin, instructor, and learner tools continue to use the existing dashboard system.

## Feature inventory

### 1. Local safety and enrollment access

- Added PostgreSQL driver-adapter support through `@prisma/adapter-pg` while retaining the Neon adapter for production.
- Added isolated `cscn_dev` and `cscn_test` workflows, Prisma generation commands, a guarded test reset script, and safe environment examples.
- Centralized enrollment creation in `lib/services/enrollment-access.service.ts`.
- Free enrollment requires a published free course.
- Paid enrollment requires a matching paid purchase order, successful payment, learner, course, amount, and currency.
- Existing enrollments are idempotent.
- Direct paid-course enrollment returns payment-required instead of bypassing checkout.
- Payment fulfillment uses the same enrollment access service.
- Added authenticated avatar upload and replacement with MIME validation, a 5 MB limit, user-owned object paths, and best-effort cleanup after the profile update.

### 2. CI and local operations

- Added GitHub Actions verification with PostgreSQL 17.
- Added Vitest and focused domain/service tests.
- Added an ESLint baseline gate: errors fail immediately and warnings may not exceed the reviewed baseline.
- Added `.env.example`, local setup guidance, deployment guidance, and a guarded QA seed.
- Added Prisma migration and test-reset commands.

### 3. Cohort discovery and applications

Public routes:

- `/cohorts`
- `/cohorts/[slug]`
- `/cohorts/[slug]/apply`

Capabilities:

- Database-backed Schools, Programs, Program Courses, Cohorts, applications, and memberships.
- Published upcoming cohort discovery with dates, tuition, workload, capacity, prerequisites, and application status.
- Multi-step learner application with draft saving, readiness answers, schedule confirmation, and idempotent submission.
- Clearly labelled local preview cohorts supplied only by the guarded QA seed.
- Homepage upcoming-cohort integration and empty states.

### 4. Admissions, decisions, payment, and membership

Admin route:

- `/dashboard/admin/admissions`

Capabilities:

- Application review queues and detail panels.
- Review notes and status transitions.
- Accept, reject, and waitlist decisions with transition validation.
- Accepted-learner offer/payment flow.
- Paid cohort membership is created only after successful fulfillment.
- Free accepted offers can create membership without a payment record.
- Duplicate membership and duplicate fulfillment paths are idempotent.

### 5. Cohort learner dashboard

Learner routes:

- `/dashboard/cohorts`
- `/dashboard/cohorts/[slug]`
- `/dashboard/cohorts/[slug]/projects/[projectId]`

Capabilities:

- Active cohort membership list and cohort workspace.
- Program/course context, weekly schedule, announcements, milestones, and progress aggregation.
- Existing course progress and scheduling systems are reused rather than duplicated.
- Membership checks protect cohort content.

### 6. Projects, rubric review, showcase, and credentials

Learner and public routes:

- `/dashboard/cohorts/[slug]/projects/[projectId]`
- `/showcase`
- `/showcase/[slug]`
- `/credentials`
- `/credentials/[code]`

Admin route:

- `/dashboard/admin/project-reviews`

Capabilities:

- Project briefs, rubric criteria, draft submissions, revision history, and immutable submitted versions.
- Attributable rubric scoring, reviewer notes, revision requests, approval, and rejection.
- Showcase publication requires approved work, learner publication consent, and an active credential.
- Credentials include stable verification codes and a SHA-256 evidence fingerprint tied to the reviewed submission version and rubric result.
- Revoked credentials remain inspectable and are clearly marked invalid.

### 7. Cohort mentorship

- Cohorts can receive explicit mentor assignments without replacing the existing mentorship marketplace.
- Eligible cohort members can book assigned mentors for project and portfolio support.
- Booking context can reference an active cohort submission.
- Capacity, availability, payment hold, and booking validation continue to use the existing mentorship scheduling services.
- Admin mentor-assignment controls are integrated into the mentorship workspace.

### 8. Community and Career Hub

Public routes:

- `/community`
- `/community/[slug]`
- `/career`
- `/career/opportunities` (redirects to the opportunity board)

Learner route:

- `/dashboard/career`

Admin route:

- `/dashboard/admin/community-career`

Community capabilities:

- Published learning spaces for programs, cohorts, topics, study groups, project critique, and alumni.
- Membership and restricted-space access checks.
- Discussions, replies, pinned content, reporting, and admin moderation.
- The public Community destination remains in website navigation; it was intentionally removed from the learner dashboard sidebar because it leaves the dashboard shell.

Career capabilities:

- Database-backed opportunities with company, role, source, skills, work mode, employment type, seniority, and deadline.
- Filtering, saved opportunities, application-interest tracking, workshops, and learner career profiles.
- CSCN does not claim or guarantee employment outcomes.

### 9. Organizations and team learning

Public routes:

- `/teams`
- `/teams/invite/[token]`

Dashboard and API routes:

- `/dashboard/organizations`
- `/dashboard/organizations/[slug]`
- `/dashboard/admin/organizations`
- `/api/organizations/[slug]/reports/progress`

Capabilities:

- Organization workspace requests and admin review.
- Organizations, teams, members, roles, invitations, and invitation expiry.
- Invoice-led seat-package requests.
- Authorized seat allocation to courses, programs, or cohorts.
- Learning assignments and aggregate progress reporting without exposing private learner work.
- Organization membership alone never bypasses course or cohort payment/access rules.

### 10. Public navigation and visual-system alignment

- Added the top-level `Explore` menu with Courses, Cohorts, Showcase, and Career Hub routes.
- Added the same expandable group to mobile navigation with keyboard, Escape, focus, and active-route states.
- Preserved Community, For Teams, Resources, and Mentorship as direct public links.
- Added shared CSCN public-page primitives in `app/globals.css`.
- Restyled Teams, Career, Community, Showcase, Credentials, and team invitations to match the homepage.
- Standardized CSCN gradient pill buttons, Inter typography, navy headings, cool-blue borders, responsive spacing, and focus states.

### 11. Routing and local preview isolation

- The documented local preview origin is `http://localhost:3001`.
- `APP_URL`, `NEXT_PUBLIC_APP_URL`, and `AUTH_URL` must use the same origin locally.
- Local payment callback construction prefers the incoming localhost host and port so another app on port 3000 cannot capture the flow.
- Auth continuation, Auth.js callbacks, email fallbacks, and payment fallbacks use port 3001 in the local review environment.
- CI remains isolated on port 3000 and does not serve the reviewer preview.

### 12. Release safety controls

- Added request-size and upload limits.
- Added HTML sanitization for rendered article content.
- Added rate limits for sensitive authentication and mutation paths.
- Added fail-closed authorization for cron and operational routes in production.
- Added Paystack and Mux webhook validation and idempotency controls.
- Added email outbox and schedule-reminder operational routes.
- Replaced deprecated Next.js `middleware.ts` with `proxy.ts`.
- Added Next.js workspace-root configuration for deterministic local and CI builds.
- Cleaned all ESLint errors. The remaining 181 warnings are tracked and baseline-gated.

## Data model and migrations

Migrations must be reviewed in order:

1. `20260823171716_baseline` — schema audited at `2e921aa4`; for fresh databases only.
2. `20260823175138_cohorts_foundation` — Schools, Programs, Cohorts, applications, and memberships.
3. `20260823210000_cohort_admissions_and_payments` — admissions decisions and payment linkage.
4. `20260823221000_cohort_learning_dashboard` — learner cohort workspace data.
5. `20260823233000_projects_showcase_credentials` — projects, rubric review, versions, showcase, and credentials.
6. `20260824000000_cohort_mentorship_integration` — cohort mentor assignments and booking context.
7. `20260824041933_community_career_hub_mvp` — community spaces, reports, opportunities, and talent profiles.
8. `20260824044314_organizations_team_learning` — organizations, teams, invitations, seats, assignments, and invoices.
9. `20260824053154_release_safety_controls` — rate-limit and webhook/release-safety persistence.

The baseline migration must not be blindly applied to an existing populated production database. Follow `DEPLOYMENT.md` to record the existing production state and deliberately baseline it before applying incremental migrations.

## Roles and access boundaries

- Learner: own applications, accepted offers, cohort memberships, submissions, career profile, saved opportunities, and organization memberships.
- Instructor/mentor: existing instructor studio plus explicitly assigned cohort mentorship.
- Admin: permission-gated admissions, reviews, community/career operations, organization review, billing, and platform operations.
- Public visitor: published cohort discovery, approved showcase evidence, active credential verification, published community spaces, and published opportunities.

Every server action and domain service rechecks identity and ownership. Client visibility is not treated as authorization.

## Local setup

Prerequisites: Node.js 20+, pnpm 10.34.5, and PostgreSQL 17.

```bash
corepack enable
pnpm install --frozen-lockfile
createdb cscn_dev
createdb cscn_test
cp .env.example .env.local
```

Configure `.env.local` with local PostgreSQL, an Auth.js secret, and the port-3001 origins documented in `.env.example`. Then run:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev -- -p 3001
```

Production preview build:

```bash
pnpm build
pnpm start -p 3001
```

## Local QA fixtures

The QA seed refuses remote databases and databases not named `cscn_dev`.

```bash
ALLOW_QA_SEED=true pnpm db:seed:qa
```

Fixtures cover learner/admin review, one free and one paid course, preview cohorts, admissions, membership, project review, credential verification, community, career, mentorship, and organization flows. They are interface-review data only and must not be run against production or used as public credibility claims.

## Verification commands

```bash
pnpm db:generate
pnpm db:reset:test
pnpm test
pnpm typecheck
pnpm lint:baseline
pnpm build
```

Expected reviewed baseline:

- 20 test files.
- 65 focused tests.
- 0 TypeScript errors.
- 0 ESLint errors.
- 181 baseline-gated ESLint warnings.
- Successful Next.js production build.

## Manual review map

1. Homepage and `Explore` navigation at desktop and mobile widths.
2. Cohort catalog, cohort detail, and application draft/submission.
3. Admin admissions decision and accepted learner offer.
4. Free membership creation and paid membership fulfillment.
5. Learner cohort workspace, schedule, announcements, and progress.
6. Project draft, submitted version, admin rubric review, revision, and approval.
7. Showcase publication and credential verification/revocation state.
8. Assigned cohort mentor availability and booking.
9. Community membership, restricted room, discussion, report, and moderation.
10. Career filtering, save/apply intent, workshop, and career profile.
11. Organization request, approval, invitation, seats, assignment, and progress export.
12. Direct paid-course enrollment refusal and payment-only acquisition.
13. Avatar validation and authenticated replacement.
14. Auth continuation and callbacks remaining on port 3001 locally.

## Required production configuration

Production configuration is environment-specific. Review at minimum:

- Neon runtime and direct database URLs.
- `DATABASE_ADAPTER=neon`.
- `AUTH_SECRET`, canonical `NEXT_PUBLIC_APP_URL`, and approved OAuth callbacks.
- Supabase Storage URL and service-role key.
- Paystack secret and webhook configuration.
- Mux tokens, signing keys, and webhook secret.
- Email provider credentials.
- `CRON_SECRET`, `SETUP_SECRET`, and `SEED_ADMIN_SECRET`.
- Calendar OAuth and token-encryption secrets.

Missing integrations must remain unavailable rather than falling back to QA data.

## Known limitations and deferred work

- No production deployment or production database migration is included in this branch.
- Existing production databases require deliberate Prisma baselining before incremental migrations.
- External payment, storage, Mux, email, OAuth, and calendar flows require client-owned credentials and target-environment verification.
- Organization billing is invoice-led; a self-service organization checkout is not fabricated.
- Community is a public website module and is not shown in the student dashboard sidebar.
- Career opportunity interest tracking does not imply an employer-side ATS integration or job guarantee.
- The tracked 181-warning ESLint backlog remains for later cleanup; the branch introduces no ESLint errors and the baseline cannot increase.

## Release and rollback notes

- Review all migration SQL before promotion and take a database backup.
- Apply migrations only with `pnpm db:migrate:deploy` in the target environment.
- Do not run `migrate dev`, `migrate reset`, or the QA seed against production.
- Prisma schema migrations are expected to roll forward. Confirm application rollback compatibility before reverting code after a migration.
- Keep webhook and cron routes disabled until their secrets and provider signatures are verified.
- Follow `DEPLOYMENT.md` for the complete deployment, migration, scheduler, and storage-transfer runbook.
