CREATE TYPE "InstructorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "InstructorExperienceLevel" AS ENUM ('LESS_THAN_ONE_YEAR', 'ONE_TO_TWO_YEARS', 'THREE_TO_FIVE_YEARS', 'SIX_TO_TEN_YEARS', 'TEN_PLUS_YEARS');

CREATE TABLE "InstructorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "portfolioUrl" TEXT NOT NULL,
    "experienceLevel" "InstructorExperienceLevel" NOT NULL,
    "status" "InstructorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDueAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstructorApplication_userId_key" ON "InstructorApplication"("userId");
CREATE INDEX "InstructorApplication_status_submittedAt_idx" ON "InstructorApplication"("status", "submittedAt");
CREATE INDEX "InstructorApplication_reviewDueAt_idx" ON "InstructorApplication"("reviewDueAt");
CREATE INDEX "InstructorApplication_reviewedById_idx" ON "InstructorApplication"("reviewedById");

ALTER TABLE "InstructorApplication" ADD CONSTRAINT "InstructorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstructorApplication" ADD CONSTRAINT "InstructorApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
