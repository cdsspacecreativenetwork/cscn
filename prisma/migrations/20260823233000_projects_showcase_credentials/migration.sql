CREATE TYPE "CohortProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProjectSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'WITHDRAWN');
CREATE TYPE "ProjectReviewDecision" AS ENUM ('CHANGES_REQUESTED', 'APPROVED');
CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "CohortProject" (
  "id" TEXT NOT NULL, "cohortId" TEXT NOT NULL, "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "brief" TEXT NOT NULL,
  "deliverables" JSONB NOT NULL, "dueAt" TIMESTAMP(3),
  "status" "CohortProjectStatus" NOT NULL DEFAULT 'DRAFT',
  "showcaseEligible" BOOLEAN NOT NULL DEFAULT true, "credentialTitle" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CohortProject_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectRubricCriterion" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "key" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL, "maxScore" INTEGER NOT NULL DEFAULT 5, "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectRubricCriterion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectSubmission" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "status" "ProjectSubmissionStatus" NOT NULL DEFAULT 'DRAFT', "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL, "artifactUrl" TEXT, "repositoryUrl" TEXT, "demoUrl" TEXT,
  "coverImageUrl" TEXT, "showcaseConsent" BOOLEAN NOT NULL DEFAULT false,
  "currentVersion" INTEGER NOT NULL DEFAULT 0, "submittedAt" TIMESTAMP(3), "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT, "approvedAt" TIMESTAMP(3), "showcaseSlug" TEXT, "showcasePublishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectSubmissionVersion" (
  "id" TEXT NOT NULL, "submissionId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL, "summary" TEXT NOT NULL, "artifactUrl" TEXT, "repositoryUrl" TEXT,
  "demoUrl" TEXT, "coverImageUrl" TEXT, "submittedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectSubmissionVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectSubmissionReview" (
  "id" TEXT NOT NULL, "submissionId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "reviewerId" TEXT NOT NULL, "decision" "ProjectReviewDecision" NOT NULL,
  "overallNote" TEXT NOT NULL, "totalScore" INTEGER NOT NULL, "maxScore" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectSubmissionReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectSubmissionCriterionScore" (
  "id" TEXT NOT NULL, "reviewId" TEXT NOT NULL, "criterionId" TEXT NOT NULL,
  "score" INTEGER NOT NULL, "note" TEXT,
  CONSTRAINT "ProjectSubmissionCriterionScore_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Credential" (
  "id" TEXT NOT NULL, "verificationCode" TEXT NOT NULL, "evidenceHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL, "cohortId" TEXT NOT NULL, "submissionId" TEXT NOT NULL,
  "title" TEXT NOT NULL, "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revokedAt" TIMESTAMP(3),
  "revocationReason" TEXT, "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CohortProject_cohortId_slug_key" ON "CohortProject"("cohortId", "slug");
CREATE INDEX "CohortProject_cohortId_status_dueAt_idx" ON "CohortProject"("cohortId", "status", "dueAt");
CREATE UNIQUE INDEX "ProjectRubricCriterion_projectId_key_key" ON "ProjectRubricCriterion"("projectId", "key");
CREATE UNIQUE INDEX "ProjectRubricCriterion_projectId_position_key" ON "ProjectRubricCriterion"("projectId", "position");
CREATE UNIQUE INDEX "ProjectSubmission_projectId_userId_key" ON "ProjectSubmission"("projectId", "userId");
CREATE UNIQUE INDEX "ProjectSubmission_showcaseSlug_key" ON "ProjectSubmission"("showcaseSlug");
CREATE INDEX "ProjectSubmission_projectId_status_submittedAt_idx" ON "ProjectSubmission"("projectId", "status", "submittedAt");
CREATE INDEX "ProjectSubmission_userId_status_idx" ON "ProjectSubmission"("userId", "status");
CREATE INDEX "ProjectSubmission_showcasePublishedAt_idx" ON "ProjectSubmission"("showcasePublishedAt");
CREATE UNIQUE INDEX "ProjectSubmissionVersion_submissionId_version_key" ON "ProjectSubmissionVersion"("submissionId", "version");
CREATE INDEX "ProjectSubmissionVersion_submissionId_submittedAt_idx" ON "ProjectSubmissionVersion"("submissionId", "submittedAt");
CREATE UNIQUE INDEX "ProjectSubmissionReview_submissionId_version_key" ON "ProjectSubmissionReview"("submissionId", "version");
CREATE INDEX "ProjectSubmissionReview_reviewerId_createdAt_idx" ON "ProjectSubmissionReview"("reviewerId", "createdAt");
CREATE UNIQUE INDEX "ProjectSubmissionCriterionScore_reviewId_criterionId_key" ON "ProjectSubmissionCriterionScore"("reviewId", "criterionId");
CREATE INDEX "ProjectSubmissionCriterionScore_criterionId_idx" ON "ProjectSubmissionCriterionScore"("criterionId");
CREATE UNIQUE INDEX "Credential_verificationCode_key" ON "Credential"("verificationCode");
CREATE UNIQUE INDEX "Credential_evidenceHash_key" ON "Credential"("evidenceHash");
CREATE UNIQUE INDEX "Credential_submissionId_key" ON "Credential"("submissionId");
CREATE INDEX "Credential_userId_issuedAt_idx" ON "Credential"("userId", "issuedAt");
CREATE INDEX "Credential_cohortId_issuedAt_idx" ON "Credential"("cohortId", "issuedAt");
CREATE INDEX "Credential_status_idx" ON "Credential"("status");

ALTER TABLE "CohortProject" ADD CONSTRAINT "CohortProject_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortProject" ADD CONSTRAINT "CohortProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectRubricCriterion" ADD CONSTRAINT "ProjectRubricCriterion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CohortProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CohortProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmissionVersion" ADD CONSTRAINT "ProjectSubmissionVersion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmissionReview" ADD CONSTRAINT "ProjectSubmissionReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmissionReview" ADD CONSTRAINT "ProjectSubmissionReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmissionCriterionScore" ADD CONSTRAINT "ProjectSubmissionCriterionScore_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ProjectSubmissionReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmissionCriterionScore" ADD CONSTRAINT "ProjectSubmissionCriterionScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "ProjectRubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
