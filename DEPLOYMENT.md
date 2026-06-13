# Deployment and Handover Notes

This project is built with Next.js and uses external services for database, storage, media, payments, email, OAuth, and background maintenance.

## Background Jobs on Vercel Hobby

Vercel Hobby only supports daily cron jobs. CSCN needs more frequent background work for:

- schedule reminders
- queued email delivery
- expired sessions
- expired mentorship payment holds

For the MVP handover, do not configure frequent jobs in `vercel.json`. Instead, use an external scheduler such as cron-job.org to call the existing API routes.

### Required Environment Variable

```env
CRON_SECRET="generate-a-long-random-secret"
```

### External Cron Jobs

Create two jobs that run every 5 minutes:

```txt
GET https://YOUR_DOMAIN.com/api/cron/schedule-reminders
GET https://YOUR_DOMAIN.com/api/cron/email-outbox
```

Add this request header to both jobs:

```txt
Authorization: Bearer YOUR_CRON_SECRET
```

The routes reject unauthorized requests when `CRON_SECRET` is configured.

## Supabase Bucket Migration

Supabase Storage is used for uploaded assets such as profile images, course thumbnails, resources, and other user/course files.

Recommended migration flow:

1. Create matching buckets in the client-owned Supabase project.
2. Copy files from the old project buckets to the new project buckets, preserving paths.
3. Check whether database records store relative object paths or full Supabase URLs.
4. If full URLs are stored, replace the old Supabase project host with the new project host in the database.
5. Verify profile images, course thumbnails, lesson resources, and uploaded files in the app.

For larger bucket transfers, use Supabase's S3-compatible storage with a tool such as `rclone`.

### URL Migration Warning

If records store values like:

```txt
https://OLD_PROJECT_REF.supabase.co/storage/v1/object/public/...
```

then those records must be updated after copying files to:

```txt
https://NEW_PROJECT_REF.supabase.co/storage/v1/object/public/...
```

If records store only object paths, no database URL rewrite is needed as long as bucket names and paths are preserved.
