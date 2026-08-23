-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ProgramDeliveryMode" AS ENUM ('ONLINE_LIVE', 'ONLINE_HYBRID', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('DRAFT', 'APPLICATIONS_OPEN', 'APPLICATIONS_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CohortApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CohortMembershipRole" AS ENUM ('LEARNER', 'INSTRUCTOR', 'MENTOR', 'TEACHING_ASSISTANT');

-- CreateEnum
CREATE TYPE "CohortMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'DRAFT',
    "featuredOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "ProgramLevel" NOT NULL DEFAULT 'BEGINNER',
    "estimatedDurationWeeks" INTEGER NOT NULL,
    "weeklyCommitmentHours" INTEGER,
    "deliveryMode" "ProgramDeliveryMode" NOT NULL DEFAULT 'ONLINE_LIVE',
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "outcomes" JSONB NOT NULL,
    "requirements" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "thumbnail" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCourse" (
    "programId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "minimumCompletionPercentage" INTEGER NOT NULL DEFAULT 80,

    CONSTRAINT "ProgramCourse_pkey" PRIMARY KEY ("programId","courseId")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "CohortStatus" NOT NULL DEFAULT 'DRAFT',
    "applicationOpenAt" TIMESTAMP(3) NOT NULL,
    "applicationCloseAt" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "applicationRequired" BOOLEAN NOT NULL DEFAULT true,
    "graduationRules" JSONB NOT NULL,
    "scheduleSummary" TEXT NOT NULL,
    "weeklySchedule" JSONB,
    "leadInstructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortApplication" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CohortApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "background" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "prerequisites" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohortApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortMembership" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CohortMembershipRole" NOT NULL DEFAULT 'LEARNER',
    "status" "CohortMembershipStatus" NOT NULL DEFAULT 'INVITED',
    "joinedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "graduatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohortMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE INDEX "School_status_featuredOrder_idx" ON "School"("status", "featuredOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE INDEX "Program_schoolId_status_idx" ON "Program"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCourse_programId_position_key" ON "ProgramCourse"("programId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Cohort_slug_key" ON "Cohort"("slug");

-- CreateIndex
CREATE INDEX "Cohort_programId_status_startsAt_idx" ON "Cohort"("programId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Cohort_applicationOpenAt_applicationCloseAt_idx" ON "Cohort"("applicationOpenAt", "applicationCloseAt");

-- CreateIndex
CREATE INDEX "CohortApplication_cohortId_status_submittedAt_idx" ON "CohortApplication"("cohortId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "CohortApplication_userId_status_idx" ON "CohortApplication"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CohortApplication_cohortId_userId_key" ON "CohortApplication"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "CohortMembership_userId_status_idx" ON "CohortMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CohortMembership_cohortId_userId_key" ON "CohortMembership"("cohortId", "userId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCourse" ADD CONSTRAINT "ProgramCourse_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCourse" ADD CONSTRAINT "ProgramCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_leadInstructorId_fkey" FOREIGN KEY ("leadInstructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortApplication" ADD CONSTRAINT "CohortApplication_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortApplication" ADD CONSTRAINT "CohortApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortApplication" ADD CONSTRAINT "CohortApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
