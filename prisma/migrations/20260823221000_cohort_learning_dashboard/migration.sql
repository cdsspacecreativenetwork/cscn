-- Link cohort delivery to the existing announcement and scheduling systems.
ALTER TYPE "ScheduleEventAudience" ADD VALUE 'COHORT_MEMBERS';

ALTER TABLE "Announcement"
ADD COLUMN "cohortId" TEXT;

ALTER TABLE "ScheduleEvent"
ADD COLUMN "cohortId" TEXT;

CREATE INDEX "Announcement_cohortId_status_publishedAt_idx"
ON "Announcement"("cohortId", "status", "publishedAt");

CREATE INDEX "ScheduleEvent_cohortId_startsAt_idx"
ON "ScheduleEvent"("cohortId", "startsAt");

ALTER TABLE "Announcement"
ADD CONSTRAINT "Announcement_cohortId_fkey"
FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleEvent"
ADD CONSTRAINT "ScheduleEvent_cohortId_fkey"
FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
