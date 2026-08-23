# Deployment and migration runbook

CSCN is a Next.js application backed by PostgreSQL/Neon and external storage, media, payment, email, OAuth, and scheduling services. This file documents the intended release process; it does not authorize a deployment.

## Release gates

Before promoting a release:

1. Run the GitHub CI workflow against an isolated PostgreSQL 17 database.
2. Review every SQL file added under `prisma/migrations`.
3. Verify authentication, payment, upload, and webhook changes in a non-production environment.
4. Confirm that no QA fixture, placeholder credential, or fabricated public record is included.
5. Take a database backup and record the restore point before applying migrations.
6. Apply migrations with `pnpm db:migrate:deploy`; never use `migrate dev` or `migrate reset` against staging or production.

The initial migration in `prisma/migrations/20260823171716_baseline` represents the schema audited at commit `2e921aa`. It is intended to initialize fresh databases. An existing production database must be baselined deliberately before migration deployment; blindly applying the initial migration to populated production would fail or conflict with existing objects.

## Environment separation

- Local development: PostgreSQL with `DATABASE_ADAPTER=pg` and database `cscn_dev`.
- Automated tests: isolated PostgreSQL with `DATABASE_ADAPTER=pg` and database `cscn_test`.
- Production: Neon with `DATABASE_ADAPTER=neon`.

`DATABASE_URL` is used by the runtime adapter. `DIRECT_URL` is used by Prisma CLI operations. Scope credentials separately per environment and keep them out of source control.

Required production secrets vary by enabled feature and include Auth.js, Neon, Supabase Storage, Paystack, Mux, email/OAuth, cron authorization, setup protection, and calendar token encryption. Missing third-party credentials must produce an explicit unavailable state rather than silently using test data.

## Migration procedure

For a schema change:

1. Update `prisma/schema.prisma` locally.
2. Create a named migration with `pnpm db:migrate:dev -- --name descriptive_change` against `cscn_dev`.
3. Inspect the generated SQL for locks, destructive operations, backfills, and required application ordering.
4. Rebuild `cscn_test` with `pnpm db:reset:test`, then run all release gates.
5. Test backup restoration and a forward-fix or rollback procedure in a non-production environment.
6. Promote the exact reviewed migration files with `pnpm db:migrate:deploy`.

Prisma migrations are normally rolled forward. If a release fails, first decide whether reverting application code is compatible with the migrated schema. For destructive or data-transforming migrations, write and rehearse an explicit restoration/forward-fix plan before approval.

## Background jobs

Vercel Hobby supports only daily cron jobs. CSCN requires more frequent work for schedule reminders, queued email delivery, expired sessions, and expired mentorship payment holds. If the hosting plan cannot meet that cadence, configure an approved external scheduler to call:

```text
GET https://YOUR_DOMAIN.com/api/cron/schedule-reminders
GET https://YOUR_DOMAIN.com/api/cron/email-outbox
```

Both requests must use:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

Do not enable operational cron routes until fail-closed secret validation has been reviewed in the target environment.

## Supabase Storage migration

1. Create matching buckets in the client-owned Supabase project.
2. Copy objects while preserving paths and ownership prefixes.
3. Determine whether database records contain relative paths or full Supabase URLs.
4. If full URLs are stored, update only the old project host after taking a backup.
5. Verify avatars, course thumbnails, lesson resources, and marketplace files.

For a large transfer, use the S3-compatible endpoint with a reviewed manifest and checksum comparison. Never delete the source bucket until the target has been verified and the rollback window has passed.
