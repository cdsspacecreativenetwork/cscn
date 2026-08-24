# CSCN

CSCN is the CDS Space Creative Network learning platform. The existing product includes courses, progress tracking, payments, mentorship, scheduling, and administration. New work must extend those systems instead of replacing them.

## Implementation documentation

- [`docs/IMPLEMENTATION_AND_REVIEW_GUIDE.md`](docs/IMPLEMENTATION_AND_REVIEW_GUIDE.md) — complete feature inventory, route map, data migrations, access boundaries, QA workflow, verification checklist, production configuration, and known limitations.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — deployment, migration, scheduler, authentication, and storage-transfer runbook.

## Local requirements

- Node.js 20+
- pnpm 10.34.5 (Corepack is recommended)
- PostgreSQL 17

## First-time setup

```bash
corepack enable
pnpm install --frozen-lockfile
createdb cscn_dev
createdb cscn_test
cp .env.example .env.local
```

Configure `.env.local` for direct local PostgreSQL:

```env
DATABASE_ADAPTER="pg"
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/cscn_dev?schema=public"
DIRECT_URL="postgresql://YOUR_USER@localhost:5432/cscn_dev?schema=public"
TEST_DATABASE_URL="postgresql://YOUR_USER@localhost:5432/cscn_test?schema=public"
APP_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
AUTH_URL="http://localhost:3001"
AUTH_SECRET="a-local-secret-at-least-32-characters-long"
```

Then initialize the development database and run the app:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev -- -p 3001
```

Production uses the Neon adapter. Local development and CI use the PostgreSQL driver adapter. Never place production credentials in `.env.local`, run local fixtures against a remote database, or apply an unreviewed migration to production.

## Local QA fixtures

The opt-in QA seed creates clearly labelled local-only learner, free-course, and paid-course fixtures. It refuses non-local hosts and databases not named `cscn_dev`.

```bash
ALLOW_QA_SEED=true pnpm db:seed:qa
```

These records are interface test data, not production content or credibility claims. Do not use `prisma/seed.qa.ts` for staging or production.

## Verification

```bash
pnpm db:reset:test
pnpm test
pnpm typecheck
pnpm lint:baseline
pnpm build
```

ESLint errors block CI. Remaining migration warnings are tracked in `eslint-baseline.json`; the baseline gate fails if either errors or warnings increase. Files changed in a review batch must not introduce new warnings.

## Database commands

| Command | Purpose |
| --- | --- |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate:dev` | Create/apply a migration during local schema development |
| `pnpm db:migrate:deploy` | Apply existing migrations without creating new ones |
| `pnpm db:migrate:status` | Compare the database with migration history |
| `pnpm db:reset:test` | Destructively rebuild only local `cscn_test` |

See `DEPLOYMENT.md` for migration promotion, rollback, service configuration, and operational jobs.

## Review workflow

Each implementation batch follows: implement locally, verify, open in the in-app browser, receive approval, then create a local checkpoint commit. No remote push, production database access, or deployment occurs without explicit approval.
