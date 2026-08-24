-- CreateEnum
CREATE TYPE "CommunitySpaceKind" AS ENUM ('GENERAL', 'PROGRAM', 'COHORT', 'TOPIC', 'PROJECT_CRITIQUE', 'STUDY_GROUP', 'ALUMNI');

-- CreateEnum
CREATE TYPE "CommunitySpaceVisibility" AS ENUM ('PUBLIC', 'MEMBERS_ONLY');

-- CreateEnum
CREATE TYPE "CommunitySpaceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommunityMembershipRole" AS ENUM ('MEMBER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "CommunityMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "CommunityPostStatus" AS ENUM ('PUBLISHED', 'REMOVED');

-- CreateEnum
CREATE TYPE "CommunityReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'UNSAFE', 'MISINFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunityReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CareerWorkplaceType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "CareerEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');

-- CreateEnum
CREATE TYPE "CareerOpportunityLevel" AS ENUM ('ENTRY', 'MID', 'SENIOR', 'ANY');

-- CreateEnum
CREATE TYPE "CareerOpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CareerOpportunityInterestStatus" AS ENUM ('STARTED', 'APPLIED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "CommunitySpace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "CommunitySpaceKind" NOT NULL,
    "visibility" "CommunitySpaceVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "CommunitySpaceStatus" NOT NULL DEFAULT 'PUBLISHED',
    "programId" TEXT,
    "cohortId" TEXT,
    "createdById" TEXT,
    "guidelines" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunitySpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMembership" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CommunityMembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "CommunityMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" "CommunityPostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPostReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "CommunityReportReason" NOT NULL,
    "details" TEXT,
    "status" "CommunityReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPostReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerOpportunity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "workplaceType" "CareerWorkplaceType" NOT NULL,
    "employmentType" "CareerEmploymentType" NOT NULL,
    "level" "CareerOpportunityLevel" NOT NULL,
    "skills" JSONB NOT NULL,
    "salaryText" TEXT,
    "applicationUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3) NOT NULL,
    "status" "CareerOpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCareerOpportunity" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCareerOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerOpportunityInterest" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CareerOpportunityInterestStatus" NOT NULL DEFAULT 'STARTED',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerOpportunityInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerTalentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "targetRoles" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "availability" TEXT,
    "preferredWorkplace" "CareerWorkplaceType",
    "cvUrl" TEXT,
    "statement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerTalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunitySpace_slug_key" ON "CommunitySpace"("slug");

-- CreateIndex
CREATE INDEX "CommunitySpace_status_visibility_idx" ON "CommunitySpace"("status", "visibility");

-- CreateIndex
CREATE INDEX "CommunitySpace_programId_idx" ON "CommunitySpace"("programId");

-- CreateIndex
CREATE INDEX "CommunitySpace_cohortId_idx" ON "CommunitySpace"("cohortId");

-- CreateIndex
CREATE INDEX "CommunityMembership_userId_status_idx" ON "CommunityMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMembership_spaceId_userId_key" ON "CommunityMembership"("spaceId", "userId");

-- CreateIndex
CREATE INDEX "CommunityPost_spaceId_status_createdAt_idx" ON "CommunityPost"("spaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_parentId_status_createdAt_idx" ON "CommunityPost"("parentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");

-- CreateIndex
CREATE INDEX "CommunityPostReport_status_createdAt_idx" ON "CommunityPostReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPostReport_postId_reporterId_key" ON "CommunityPostReport"("postId", "reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerOpportunity_slug_key" ON "CareerOpportunity"("slug");

-- CreateIndex
CREATE INDEX "CareerOpportunity_status_postedAt_idx" ON "CareerOpportunity"("status", "postedAt");

-- CreateIndex
CREATE INDEX "CareerOpportunity_workplaceType_employmentType_level_idx" ON "CareerOpportunity"("workplaceType", "employmentType", "level");

-- CreateIndex
CREATE INDEX "SavedCareerOpportunity_userId_createdAt_idx" ON "SavedCareerOpportunity"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCareerOpportunity_opportunityId_userId_key" ON "SavedCareerOpportunity"("opportunityId", "userId");

-- CreateIndex
CREATE INDEX "CareerOpportunityInterest_userId_status_idx" ON "CareerOpportunityInterest"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CareerOpportunityInterest_opportunityId_userId_key" ON "CareerOpportunityInterest"("opportunityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerTalentProfile_userId_key" ON "CareerTalentProfile"("userId");

-- AddForeignKey
ALTER TABLE "CommunitySpace" ADD CONSTRAINT "CommunitySpace_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySpace" ADD CONSTRAINT "CommunitySpace_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySpace" ADD CONSTRAINT "CommunitySpace_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CommunitySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CommunitySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostReport" ADD CONSTRAINT "CommunityPostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostReport" ADD CONSTRAINT "CommunityPostReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostReport" ADD CONSTRAINT "CommunityPostReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCareerOpportunity" ADD CONSTRAINT "SavedCareerOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCareerOpportunity" ADD CONSTRAINT "SavedCareerOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerOpportunityInterest" ADD CONSTRAINT "CareerOpportunityInterest_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerOpportunityInterest" ADD CONSTRAINT "CareerOpportunityInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerTalentProfile" ADD CONSTRAINT "CareerTalentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
