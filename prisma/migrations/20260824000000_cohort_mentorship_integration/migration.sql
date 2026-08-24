CREATE TYPE "CohortMentorAssignmentStatus" AS ENUM ('ACTIVE', 'PAUSED');

CREATE TABLE "CohortMentorAssignment" (
  "id" TEXT NOT NULL,
  "cohortId" TEXT NOT NULL,
  "mentorId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'Cohort mentor',
  "focusAreas" JSONB NOT NULL,
  "status" "CohortMentorAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CohortMentorAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MentorBooking" ADD COLUMN "cohortId" TEXT;
ALTER TABLE "MentorBooking" ADD COLUMN "projectSubmissionId" TEXT;

CREATE UNIQUE INDEX "CohortMentorAssignment_cohortId_mentorId_key" ON "CohortMentorAssignment"("cohortId", "mentorId");
CREATE INDEX "CohortMentorAssignment_cohortId_status_idx" ON "CohortMentorAssignment"("cohortId", "status");
CREATE INDEX "CohortMentorAssignment_mentorId_status_idx" ON "CohortMentorAssignment"("mentorId", "status");
CREATE INDEX "MentorBooking_cohortId_startsAt_idx" ON "MentorBooking"("cohortId", "startsAt");
CREATE INDEX "MentorBooking_projectSubmissionId_idx" ON "MentorBooking"("projectSubmissionId");

ALTER TABLE "CohortMentorAssignment" ADD CONSTRAINT "CohortMentorAssignment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortMentorAssignment" ADD CONSTRAINT "CohortMentorAssignment_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MentorBooking" ADD CONSTRAINT "MentorBooking_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MentorBooking" ADD CONSTRAINT "MentorBooking_projectSubmissionId_fkey" FOREIGN KEY ("projectSubmissionId") REFERENCES "ProjectSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
