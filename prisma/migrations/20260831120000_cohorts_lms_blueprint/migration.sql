ALTER TABLE "User" ADD COLUMN "canManageCohorts" BOOLEAN NOT NULL DEFAULT false;

ALTER TYPE "CohortStatus" ADD VALUE 'ARCHIVED';

ALTER TABLE "Cohort" ADD COLUMN "completionPolicy" JSONB;

CREATE TYPE "CohortAssignmentType" AS ENUM ('PRACTICE', 'PROJECT', 'REFLECTION', 'CAPSTONE');
CREATE TYPE "CohortAssignmentLatePolicy" AS ENUM ('ALLOW', 'MARK_LATE', 'BLOCK');
CREATE TYPE "PeerReviewStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'OVERDUE', 'EXCUSED');

ALTER TABLE "CohortProject"
  ADD COLUMN "releaseAt" TIMESTAMP(3),
  ADD COLUMN "assignmentType" "CohortAssignmentType" NOT NULL DEFAULT 'PROJECT',
  ADD COLUMN "latePolicy" "CohortAssignmentLatePolicy" NOT NULL DEFAULT 'MARK_LATE',
  ADD COLUMN "maxScore" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "acceptedSubmissionFormats" JSONB,
  ADD COLUMN "peerReviewEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "peerReviewsPerLearner" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "peerReviewDueAt" TIMESTAMP(3);

ALTER TABLE "ProjectSubmission"
  ADD COLUMN "submissionText" TEXT,
  ADD COLUMN "attachments" JSONB,
  ADD COLUMN "isLate" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProjectSubmissionVersion"
  ADD COLUMN "submissionText" TEXT,
  ADD COLUMN "attachments" JSONB;

CREATE TABLE "PeerReviewAssignment" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "revieweeId" TEXT NOT NULL,
  "status" "PeerReviewStatus" NOT NULL DEFAULT 'ASSIGNED',
  "dueAt" TIMESTAMP(3),
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "excusedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PeerReviewAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerReviewResponse" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "overallNote" TEXT NOT NULL,
  "totalScore" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "moderationNote" TEXT,
  "moderatedById" TEXT,
  "moderatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PeerReviewResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerReviewCriterionScore" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "note" TEXT,
  CONSTRAINT "PeerReviewCriterionScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PeerReviewAssignment_submissionId_reviewerId_key" ON "PeerReviewAssignment"("submissionId", "reviewerId");
CREATE INDEX "PeerReviewAssignment_reviewerId_status_dueAt_idx" ON "PeerReviewAssignment"("reviewerId", "status", "dueAt");
CREATE INDEX "PeerReviewAssignment_revieweeId_status_idx" ON "PeerReviewAssignment"("revieweeId", "status");
CREATE INDEX "PeerReviewAssignment_projectId_status_idx" ON "PeerReviewAssignment"("projectId", "status");
CREATE UNIQUE INDEX "PeerReviewResponse_assignmentId_key" ON "PeerReviewResponse"("assignmentId");
CREATE INDEX "PeerReviewResponse_moderatedById_idx" ON "PeerReviewResponse"("moderatedById");
CREATE UNIQUE INDEX "PeerReviewCriterionScore_responseId_criterionId_key" ON "PeerReviewCriterionScore"("responseId", "criterionId");
CREATE INDEX "PeerReviewCriterionScore_criterionId_idx" ON "PeerReviewCriterionScore"("criterionId");

ALTER TABLE "PeerReviewAssignment" ADD CONSTRAINT "PeerReviewAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CohortProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerReviewAssignment" ADD CONSTRAINT "PeerReviewAssignment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerReviewAssignment" ADD CONSTRAINT "PeerReviewAssignment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerReviewAssignment" ADD CONSTRAINT "PeerReviewAssignment_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerReviewResponse" ADD CONSTRAINT "PeerReviewResponse_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "PeerReviewAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerReviewResponse" ADD CONSTRAINT "PeerReviewResponse_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PeerReviewCriterionScore" ADD CONSTRAINT "PeerReviewCriterionScore_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "PeerReviewResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerReviewCriterionScore" ADD CONSTRAINT "PeerReviewCriterionScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "ProjectRubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
