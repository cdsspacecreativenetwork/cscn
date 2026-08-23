-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'USER');

-- CreateEnum
CREATE TYPE "InstructorVerificationStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PublicProfileStatus" AS ENUM ('DRAFT', 'PUBLIC', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('TEMPLATE', 'STARTER_KIT', 'MOCKUP', 'ASSET', 'GUIDE', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResourceAccessSource" AS ENUM ('FREE_CLAIM', 'PURCHASE', 'GRANT');

-- CreateEnum
CREATE TYPE "ResourceReviewStatus" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('ALL_LEVELS', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('SHORT_COURSE', 'FULL_COURSE', 'PROFESSIONAL_CERTIFICATE');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'ARTICLE', 'QUIZ');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'LINK', 'FILE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('RESOURCE', 'COURSE', 'MENTORSHIP', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL', 'PAYSTACK', 'STRIPE', 'CRYPTO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'REQUESTED', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuizQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('PRACTICE', 'GRADED');

-- CreateEnum
CREATE TYPE "PricingProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MuxVideoStatus" AS ENUM ('NONE', 'UPLOADING', 'PROCESSING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "CourseInstructorRole" AS ENUM ('OWNER', 'CO_INSTRUCTOR', 'TEACHING_ASSISTANT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COURSE_INVITE', 'COURSE_FEEDBACK', 'COURSE_FEEDBACK_RESOLVED', 'COURSE_PUBLISHED', 'COURSE_REJECTED', 'COURSE_CHANGES_REQUESTED', 'NEW_ENROLLMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EmailOutboxType" AS ENUM ('LIVE_SESSION_REMINDER', 'LIVE_SESSION_UPDATE');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD');

-- CreateEnum
CREATE TYPE "NotificationActionStatus" AS ENUM ('PENDING', 'COMPLETED', 'DISMISSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReviewPublishStatus" AS ENUM ('PENDING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'INSTRUCTORS', 'STUDENTS', 'ADMINS');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScheduleEventType" AS ENUM ('LIVE_SESSION', 'MENTORSHIP', 'EXAM', 'DEADLINE', 'PLATFORM_EVENT');

-- CreateEnum
CREATE TYPE "ScheduleEventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleEventAudience" AS ENUM ('ALL_STUDENTS', 'COURSE_ENROLLEES', 'SELECTED_USERS', 'INSTRUCTORS', 'ADMINS');

-- CreateEnum
CREATE TYPE "ScheduleAttendanceStatus" AS ENUM ('INVITED', 'REGISTERED', 'ATTENDED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleReminderKind" AS ENUM ('BEFORE_45_MINUTES', 'JOIN_WINDOW');

-- CreateEnum
CREATE TYPE "ScheduleReminderDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'MICROSOFT', 'ZOOM');

-- CreateEnum
CREATE TYPE "CalendarConnectionStatus" AS ENUM ('CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "ScheduleMeetingProvider" AS ENUM ('MANUAL', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'ZOOM');

-- CreateEnum
CREATE TYPE "ScheduleMeetingStatus" AS ENUM ('NONE', 'PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "CalendarConferenceStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "MentorAvailabilityType" AS ENUM ('WEEKLY', 'DATE');

-- CreateEnum
CREATE TYPE "MentorAvailabilityRecurrence" AS ENUM ('WEEKLY', 'ONCE');

-- CreateEnum
CREATE TYPE "MentorAvailabilityStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MentorBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'AWAITING_COMPLETION', 'RESCHEDULE_REQUESTED', 'RESCHEDULED', 'DISPUTED', 'CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_MENTOR', 'COMPLETED', 'DECLINED');

-- CreateEnum
CREATE TYPE "MentorshipApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CourseRevisionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AchievementTrigger" AS ENUM ('LESSON_COUNT', 'STUDENT_COUNT', 'STREAK_DAYS', 'COURSE_COMPLETE', 'PUBLISH_COURSE', 'ACCOUNT_CREATED');

-- CreateEnum
CREATE TYPE "AchievementRole" AS ENUM ('LEARNER', 'CREATOR', 'HYBRID');

-- CreateEnum
CREATE TYPE "QuestFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "QuestTarget" AS ENUM ('LESSON_WATCH', 'RESOURCE_DOWNLOAD', 'REVIEW_REPLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "bio" TEXT,
    "headline" TEXT,
    "location" TEXT,
    "timezone" TEXT DEFAULT 'Africa/Lagos',
    "socials" JSONB,
    "publicProfileSlug" TEXT,
    "publicProfileStatus" "PublicProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "websiteUrl" TEXT,
    "portfolioUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "githubUrl" TEXT,
    "behanceUrl" TEXT,
    "dribbbleUrl" TEXT,
    "telegramUrl" TEXT,
    "expertise" JSONB,
    "learningFocus" TEXT,
    "yearsExperience" INTEGER,
    "instructorProfileEnabled" BOOLEAN NOT NULL DEFAULT false,
    "instructorVerificationStatus" "InstructorVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "instructorVerifiedAt" TIMESTAMP(3),
    "instructorFeatured" BOOLEAN NOT NULL DEFAULT false,
    "instructorFeaturedOrder" INTEGER,
    "mentorshipEligible" BOOLEAN NOT NULL DEFAULT false,
    "mentorshipEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mentorshipApprovedAt" TIMESTAMP(3),
    "mentorshipPrice" DECIMAL(10,2),
    "mentorshipCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "mentorshipFree" BOOLEAN NOT NULL DEFAULT true,
    "mentorshipBio" TEXT,
    "mentorshipTopics" JSONB,
    "mentorshipInstructions" TEXT,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageCourses" BOOLEAN NOT NULL DEFAULT false,
    "canReviewCourses" BOOLEAN NOT NULL DEFAULT false,
    "canPublishCourses" BOOLEAN NOT NULL DEFAULT false,
    "canManageLearners" BOOLEAN NOT NULL DEFAULT false,
    "canManageInstructors" BOOLEAN NOT NULL DEFAULT false,
    "canVerifyInstructors" BOOLEAN NOT NULL DEFAULT false,
    "canManageInvites" BOOLEAN NOT NULL DEFAULT false,
    "canManageAnnouncements" BOOLEAN NOT NULL DEFAULT false,
    "canManageBilling" BOOLEAN NOT NULL DEFAULT false,
    "canManageMarketing" BOOLEAN NOT NULL DEFAULT false,
    "canManagePermissions" BOOLEAN NOT NULL DEFAULT false,
    "canViewAuditLogs" BOOLEAN NOT NULL DEFAULT false,
    "canManageSettings" BOOLEAN NOT NULL DEFAULT false,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCohort" TEXT,
    "pioneerJoinedAt" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "payoutSetup" BOOLEAN NOT NULL DEFAULT false,
    "payoutMethod" TEXT,
    "payoutDetails" JSONB,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "usedBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDesc" TEXT,
    "thumbnail" TEXT,
    "promoVideo" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
    "courseType" "CourseType" NOT NULL DEFAULT 'FULL_COURSE',
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "previewCount" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2),
    "baseCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "duration" INTEGER,
    "requirements" JSONB,
    "includes" JSONB,
    "certificateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "examGated" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "finalExamId" TEXT,
    "categoryId" TEXT,
    "instructorId" TEXT NOT NULL,
    "featuredOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "position" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "contentType" "ContentType" NOT NULL DEFAULT 'VIDEO',
    "bodyContent" TEXT,
    "duration" INTEGER,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "transcript" TEXT,
    "moduleId" TEXT NOT NULL,
    "muxUploadId" TEXT,
    "muxAssetId" TEXT,
    "muxPlaybackId" TEXT,
    "muxStatus" "MuxVideoStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'LINK',
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceResource" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "thumbnailUrl" TEXT,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "courseId" TEXT,
    "moduleId" TEXT,
    "lessonId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAccess" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "ResourceAccessSource" NOT NULL,
    "orderId" TEXT,
    "grantedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceReview" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ResourceReviewStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceDownload" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "mode" "QuizMode" NOT NULL DEFAULT 'PRACTICE',
    "instructions" TEXT,
    "passingScore" INTEGER,
    "maxAttempts" INTEGER,
    "showAnswers" BOOLEAN NOT NULL DEFAULT true,
    "gateUntilPassed" BOOLEAN NOT NULL DEFAULT false,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "timeLimitMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "QuizQuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionIds" JSONB,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "pointsAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "questionPromptSnapshot" TEXT NOT NULL,
    "optionSnapshots" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lastSeekTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "resourceId" TEXT,
    "mentorBookingId" TEXT,
    "type" "OrderType" NOT NULL DEFAULT 'COURSE',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "provider" "PaymentProvider",
    "providerReference" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "channel" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "providerReference" TEXT,
    "rawPayload" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorEarning" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "courseId" TEXT,
    "resourceId" TEXT,
    "orderId" TEXT,
    "paymentId" TEXT,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "instructorAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "sharePercent" DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "payoutRequestId" TEXT,
    "holdUntil" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "payoutMethod" TEXT,
    "payoutDetails" JSONB,
    "adminNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "payoutRequestId" TEXT,
    "instructorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "provider" "PaymentProvider",
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "providerReference" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rawPayload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "requestedById" TEXT,
    "reviewedById" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "providerReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "interval" TEXT NOT NULL DEFAULT 'MONTH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" "PaymentProvider",
    "providerReference" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonWatchSegment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "segmentIndex" INTEGER NOT NULL,
    "secondsWatched" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonWatchSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePricingProposal" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "proposedPrice" DECIMAL(10,2),
    "currentPriceSnapshot" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PricingProposalStatus" NOT NULL DEFAULT 'PENDING',
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoursePricingProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "seenAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionStatus" "NotificationActionStatus",
    "actionLabel" TEXT,
    "actionUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "emailFailedAt" TIMESTAMP(3),
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "type" "EmailOutboxType" NOT NULL,
    "subject" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "linkUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "HomepageReview" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "avatarUrl" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "source" TEXT,
    "status" "ReviewPublishStatus" NOT NULL DEFAULT 'PENDING',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleEvent" (
    "id" TEXT NOT NULL,
    "type" "ScheduleEventType" NOT NULL,
    "status" "ScheduleEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "audience" "ScheduleEventAudience" NOT NULL DEFAULT 'COURSE_ENROLLEES',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3),
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "meetingUrl" TEXT,
    "meetingProvider" "ScheduleMeetingProvider" NOT NULL DEFAULT 'MANUAL',
    "meetingStatus" "ScheduleMeetingStatus" NOT NULL DEFAULT 'NONE',
    "recordingUrl" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "startedAt" TIMESTAMPTZ(3),
    "startedById" TEXT,
    "endedAt" TIMESTAMPTZ(3),
    "endedById" TEXT,
    "courseId" TEXT,
    "lessonId" TEXT,
    "examId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "providerAccountEmail" TEXT,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "status" "CalendarConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleEventExternalCalendar" (
    "id" TEXT NOT NULL,
    "scheduleEventId" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "externalEventId" TEXT,
    "externalHtmlLink" TEXT,
    "externalICalUid" TEXT,
    "conferenceRequestId" TEXT,
    "conferenceStatus" "CalendarConferenceStatus" NOT NULL DEFAULT 'PENDING',
    "meetingUrl" TEXT,
    "conferenceId" TEXT,
    "syncError" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEventExternalCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAvailability" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "type" "MentorAvailabilityType" NOT NULL DEFAULT 'WEEKLY',
    "weekday" INTEGER,
    "date" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "sessionDuration" INTEGER NOT NULL DEFAULT 45,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 10,
    "maxBookings" INTEGER NOT NULL DEFAULT 1,
    "recurrence" "MentorAvailabilityRecurrence" NOT NULL DEFAULT 'WEEKLY',
    "status" "MentorAvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorBooking" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT,
    "availabilityId" TEXT,
    "status" "MentorBookingStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "topic" TEXT,
    "studentNote" TEXT,
    "mentorNote" TEXT,
    "rescheduleRequestedById" TEXT,
    "rescheduleRequestedAt" TIMESTAMPTZ(3),
    "proposedStartsAt" TIMESTAMPTZ(3),
    "proposedEndsAt" TIMESTAMPTZ(3),
    "proposedTimezone" TEXT,
    "rescheduleNote" TEXT,
    "rescheduleRespondedAt" TIMESTAMPTZ(3),
    "rescheduleResponseNote" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "meetingUrl" TEXT,
    "scheduleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipApplication" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "status" "MentorshipApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "pitch" TEXT,
    "audience" TEXT,
    "sessionTypes" JSONB,
    "topics" JSONB,
    "mentorshipFree" BOOLEAN NOT NULL DEFAULT true,
    "proposedPrice" DECIMAL(10,2),
    "proposedCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "instructions" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleEventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ScheduleAttendanceStatus" NOT NULL DEFAULT 'INVITED',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleReminderDelivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ScheduleReminderKind" NOT NULL,
    "status" "ScheduleReminderDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMPTZ(3) NOT NULL,
    "deliveredAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleReminderDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseReview" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL,
    "comment" TEXT,
    "revisionId" TEXT,
    "addressedAt" TIMESTAMP(3),
    "addressedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRevision" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "CourseRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "liveSnapshot" JSONB,
    "draftSnapshot" JSONB NOT NULL,
    "changeSummary" JSONB,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseInstructor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CourseInstructorRole" NOT NULL DEFAULT 'CO_INSTRUCTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CourseInstructorRole" NOT NULL DEFAULT 'CO_INSTRUCTOR',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFeedbackItem" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseFeedbackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "triggerType" "AchievementTrigger" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "role" "AchievementRole" NOT NULL DEFAULT 'LEARNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" "QuestFrequency" NOT NULL DEFAULT 'DAILY',
    "targetType" "QuestTarget" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRating" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerInterestProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interestAreas" JSONB NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "primaryGoal" TEXT NOT NULL,
    "learningStyle" JSONB,
    "note" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "onboardingVersion" TEXT NOT NULL DEFAULT 'launch-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerInterestProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "retakeCooldownHours" INTEGER NOT NULL DEFAULT 24,
    "schedulingMode" TEXT NOT NULL DEFAULT 'FLEXI',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "codeContext" TEXT,
    "points" INTEGER NOT NULL DEFAULT 5,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_publicProfileSlug_key" ON "User"("publicProfileSlug");

-- CreateIndex
CREATE INDEX "User_publicProfileStatus_idx" ON "User"("publicProfileStatus");

-- CreateIndex
CREATE INDEX "User_instructorProfileEnabled_instructorVerificationStatus_idx" ON "User"("instructorProfileEnabled", "instructorVerificationStatus");

-- CreateIndex
CREATE INDEX "User_instructorFeatured_instructorFeaturedOrder_idx" ON "User"("instructorFeatured", "instructorFeaturedOrder");

-- CreateIndex
CREATE INDEX "User_onboardingCohort_idx" ON "User"("onboardingCohort");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_finalExamId_key" ON "Course"("finalExamId");

-- CreateIndex
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_muxUploadId_key" ON "Lesson"("muxUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_muxAssetId_key" ON "Lesson"("muxAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_muxPlaybackId_key" ON "Lesson"("muxPlaybackId");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceResource_slug_key" ON "MarketplaceResource"("slug");

-- CreateIndex
CREATE INDEX "MarketplaceResource_ownerId_status_idx" ON "MarketplaceResource"("ownerId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceResource_status_publishedAt_idx" ON "MarketplaceResource"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "MarketplaceResource_courseId_idx" ON "MarketplaceResource"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAccess_orderId_key" ON "ResourceAccess"("orderId");

-- CreateIndex
CREATE INDEX "ResourceAccess_userId_revokedAt_idx" ON "ResourceAccess"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAccess_resourceId_userId_key" ON "ResourceAccess"("resourceId", "userId");

-- CreateIndex
CREATE INDEX "ResourceReview_resourceId_createdAt_idx" ON "ResourceReview"("resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceDownload_resourceId_idx" ON "ResourceDownload"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceDownload_userId_idx" ON "ResourceDownload"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_lessonId_key" ON "Quiz"("lessonId");

-- CreateIndex
CREATE INDEX "Quiz_lessonId_idx" ON "Quiz"("lessonId");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_status_idx" ON "QuizAttempt"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_quizId_userId_attemptNumber_key" ON "QuizAttempt"("quizId", "userId", "attemptNumber");

-- CreateIndex
CREATE INDEX "QuizAnswer_attemptId_idx" ON "QuizAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "QuizAnswer_questionId_idx" ON "QuizAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnswer_attemptId_questionId_key" ON "QuizAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "LessonProgress_userId_idx" ON "LessonProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_mentorBookingId_key" ON "PurchaseOrder"("mentorBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_providerReference_key" ON "PurchaseOrder"("providerReference");

-- CreateIndex
CREATE INDEX "PurchaseOrder_userId_idx" ON "PurchaseOrder"("userId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_courseId_idx" ON "PurchaseOrder"("courseId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_resourceId_idx" ON "PurchaseOrder"("resourceId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_mentorBookingId_idx" ON "PurchaseOrder"("mentorBookingId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_provider_status_idx" ON "Payment"("provider", "status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "InstructorEarning_instructorId_idx" ON "InstructorEarning"("instructorId");

-- CreateIndex
CREATE INDEX "InstructorEarning_courseId_idx" ON "InstructorEarning"("courseId");

-- CreateIndex
CREATE INDEX "InstructorEarning_resourceId_idx" ON "InstructorEarning"("resourceId");

-- CreateIndex
CREATE INDEX "InstructorEarning_status_idx" ON "InstructorEarning"("status");

-- CreateIndex
CREATE INDEX "InstructorEarning_payoutRequestId_idx" ON "InstructorEarning"("payoutRequestId");

-- CreateIndex
CREATE INDEX "InstructorEarning_createdAt_idx" ON "InstructorEarning"("createdAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_instructorId_idx" ON "PayoutRequest"("instructorId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX "PayoutRequest_requestedAt_idx" ON "PayoutRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "Payout_payoutRequestId_idx" ON "Payout"("payoutRequestId");

-- CreateIndex
CREATE INDEX "Payout_instructorId_idx" ON "Payout"("instructorId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Payout_createdAt_idx" ON "Payout"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_eventType_idx" ON "WebhookEvent"("provider", "eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "Refund_createdAt_idx" ON "Refund"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_planId_idx" ON "UserSubscription"("planId");

-- CreateIndex
CREATE INDEX "UserSubscription_status_idx" ON "UserSubscription"("status");

-- CreateIndex
CREATE INDEX "LessonNote_userId_lessonId_idx" ON "LessonNote"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "LessonNote_lessonId_idx" ON "LessonNote"("lessonId");

-- CreateIndex
CREATE INDEX "LessonWatchSegment_lessonId_segmentIndex_idx" ON "LessonWatchSegment"("lessonId", "segmentIndex");

-- CreateIndex
CREATE INDEX "LessonWatchSegment_userId_idx" ON "LessonWatchSegment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonWatchSegment_lessonId_userId_segmentIndex_key" ON "LessonWatchSegment"("lessonId", "userId", "segmentIndex");

-- CreateIndex
CREATE INDEX "CoursePricingProposal_courseId_idx" ON "CoursePricingProposal"("courseId");

-- CreateIndex
CREATE INDEX "CoursePricingProposal_status_idx" ON "CoursePricingProposal"("status");

-- CreateIndex
CREATE INDEX "CoursePricingProposal_submittedById_idx" ON "CoursePricingProposal"("submittedById");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_seenAt_idx" ON "Notification"("userId", "seenAt");

-- CreateIndex
CREATE INDEX "Notification_userId_actionRequired_actionStatus_idx" ON "Notification"("userId", "actionRequired", "actionStatus");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_nextAttemptAt_idx" ON "EmailOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_recipientUserId_idx" ON "EmailOutbox"("recipientUserId");

-- CreateIndex
CREATE INDEX "EmailOutbox_type_idx" ON "EmailOutbox"("type");

-- CreateIndex
CREATE INDEX "EmailOutbox_createdAt_idx" ON "EmailOutbox"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "Announcement"("status");

-- CreateIndex
CREATE INDEX "Announcement_audience_publishedAt_idx" ON "Announcement"("audience", "publishedAt");

-- CreateIndex
CREATE INDEX "HomepageReview_status_featured_idx" ON "HomepageReview"("status", "featured");

-- CreateIndex
CREATE INDEX "HomepageReview_createdAt_idx" ON "HomepageReview"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ScheduleEvent_type_idx" ON "ScheduleEvent"("type");

-- CreateIndex
CREATE INDEX "ScheduleEvent_status_idx" ON "ScheduleEvent"("status");

-- CreateIndex
CREATE INDEX "ScheduleEvent_audience_idx" ON "ScheduleEvent"("audience");

-- CreateIndex
CREATE INDEX "ScheduleEvent_startsAt_idx" ON "ScheduleEvent"("startsAt");

-- CreateIndex
CREATE INDEX "ScheduleEvent_courseId_startsAt_idx" ON "ScheduleEvent"("courseId", "startsAt");

-- CreateIndex
CREATE INDEX "ScheduleEvent_createdById_idx" ON "ScheduleEvent"("createdById");

-- CreateIndex
CREATE INDEX "ScheduleEvent_startedById_idx" ON "ScheduleEvent"("startedById");

-- CreateIndex
CREATE INDEX "ScheduleEvent_endedById_idx" ON "ScheduleEvent"("endedById");

-- CreateIndex
CREATE INDEX "CalendarConnection_userId_idx" ON "CalendarConnection"("userId");

-- CreateIndex
CREATE INDEX "CalendarConnection_provider_status_idx" ON "CalendarConnection"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarConnection_userId_provider_key" ON "CalendarConnection"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleEventExternalCalendar_scheduleEventId_key" ON "ScheduleEventExternalCalendar"("scheduleEventId");

-- CreateIndex
CREATE INDEX "ScheduleEventExternalCalendar_calendarConnectionId_idx" ON "ScheduleEventExternalCalendar"("calendarConnectionId");

-- CreateIndex
CREATE INDEX "ScheduleEventExternalCalendar_provider_idx" ON "ScheduleEventExternalCalendar"("provider");

-- CreateIndex
CREATE INDEX "ScheduleEventExternalCalendar_conferenceStatus_idx" ON "ScheduleEventExternalCalendar"("conferenceStatus");

-- CreateIndex
CREATE INDEX "MentorAvailability_mentorId_idx" ON "MentorAvailability"("mentorId");

-- CreateIndex
CREATE INDEX "MentorAvailability_status_idx" ON "MentorAvailability"("status");

-- CreateIndex
CREATE INDEX "MentorAvailability_type_weekday_idx" ON "MentorAvailability"("type", "weekday");

-- CreateIndex
CREATE INDEX "MentorAvailability_date_idx" ON "MentorAvailability"("date");

-- CreateIndex
CREATE INDEX "MentorBooking_mentorId_idx" ON "MentorBooking"("mentorId");

-- CreateIndex
CREATE INDEX "MentorBooking_studentId_idx" ON "MentorBooking"("studentId");

-- CreateIndex
CREATE INDEX "MentorBooking_status_idx" ON "MentorBooking"("status");

-- CreateIndex
CREATE INDEX "MentorBooking_startsAt_idx" ON "MentorBooking"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorBooking_availabilityId_startsAt_key" ON "MentorBooking"("availabilityId", "startsAt");

-- CreateIndex
CREATE INDEX "MentorshipApplication_instructorId_idx" ON "MentorshipApplication"("instructorId");

-- CreateIndex
CREATE INDEX "MentorshipApplication_status_idx" ON "MentorshipApplication"("status");

-- CreateIndex
CREATE INDEX "MentorshipApplication_submittedAt_idx" ON "MentorshipApplication"("submittedAt");

-- CreateIndex
CREATE INDEX "ScheduleEventAttendee_userId_idx" ON "ScheduleEventAttendee"("userId");

-- CreateIndex
CREATE INDEX "ScheduleEventAttendee_eventId_idx" ON "ScheduleEventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "ScheduleEventAttendee_status_idx" ON "ScheduleEventAttendee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleEventAttendee_eventId_userId_key" ON "ScheduleEventAttendee"("eventId", "userId");

-- CreateIndex
CREATE INDEX "ScheduleReminderDelivery_eventId_idx" ON "ScheduleReminderDelivery"("eventId");

-- CreateIndex
CREATE INDEX "ScheduleReminderDelivery_userId_idx" ON "ScheduleReminderDelivery"("userId");

-- CreateIndex
CREATE INDEX "ScheduleReminderDelivery_status_scheduledFor_idx" ON "ScheduleReminderDelivery"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleReminderDelivery_attendeeId_kind_key" ON "ScheduleReminderDelivery"("attendeeId", "kind");

-- CreateIndex
CREATE INDEX "CourseReview_courseId_idx" ON "CourseReview"("courseId");

-- CreateIndex
CREATE INDEX "CourseReview_revisionId_idx" ON "CourseReview"("revisionId");

-- CreateIndex
CREATE INDEX "CourseRevision_courseId_status_idx" ON "CourseRevision"("courseId", "status");

-- CreateIndex
CREATE INDEX "CourseRevision_submittedAt_idx" ON "CourseRevision"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRevision_courseId_version_key" ON "CourseRevision"("courseId", "version");

-- CreateIndex
CREATE INDEX "CourseInstructor_courseId_idx" ON "CourseInstructor"("courseId");

-- CreateIndex
CREATE INDEX "CourseInstructor_userId_idx" ON "CourseInstructor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseInstructor_courseId_userId_key" ON "CourseInstructor"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseInvite_token_key" ON "CourseInvite"("token");

-- CreateIndex
CREATE INDEX "CourseInvite_courseId_idx" ON "CourseInvite"("courseId");

-- CreateIndex
CREATE INDEX "CourseInvite_email_idx" ON "CourseInvite"("email");

-- CreateIndex
CREATE INDEX "CourseFeedbackItem_courseId_idx" ON "CourseFeedbackItem"("courseId");

-- CreateIndex
CREATE INDEX "CourseFeedbackItem_authorId_idx" ON "CourseFeedbackItem"("authorId");

-- CreateIndex
CREATE INDEX "DailyActivity_userId_idx" ON "DailyActivity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyActivity_userId_date_key" ON "DailyActivity"("userId", "date");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_name_key" ON "Achievement"("name");

-- CreateIndex
CREATE INDEX "UserQuestProgress_userId_idx" ON "UserQuestProgress"("userId");

-- CreateIndex
CREATE INDEX "UserQuestProgress_questId_idx" ON "UserQuestProgress"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuestProgress_userId_questId_resetAt_key" ON "UserQuestProgress"("userId", "questId", "resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardCache_userId_key" ON "LeaderboardCache"("userId");

-- CreateIndex
CREATE INDEX "CourseRating_courseId_idx" ON "CourseRating"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRating_studentId_courseId_key" ON "CourseRating"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerInterestProfile_userId_key" ON "LearnerInterestProfile"("userId");

-- CreateIndex
CREATE INDEX "LearnerInterestProfile_skillLevel_idx" ON "LearnerInterestProfile"("skillLevel");

-- CreateIndex
CREATE INDEX "LearnerInterestProfile_primaryGoal_idx" ON "LearnerInterestProfile"("primaryGoal");

-- CreateIndex
CREATE INDEX "LearnerInterestProfile_createdAt_idx" ON "LearnerInterestProfile"("createdAt");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");

-- CreateIndex
CREATE INDEX "ExamAttempt_examId_idx" ON "ExamAttempt"("examId");

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_idx" ON "ExamAttempt"("userId");

-- CreateIndex
CREATE INDEX "ExamAnswer_attemptId_idx" ON "ExamAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "ExamAnswer_questionId_idx" ON "ExamAnswer"("questionId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_finalExamId_fkey" FOREIGN KEY ("finalExamId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonResource" ADD CONSTRAINT "LessonResource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceResource" ADD CONSTRAINT "MarketplaceResource_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceResource" ADD CONSTRAINT "MarketplaceResource_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceResource" ADD CONSTRAINT "MarketplaceResource_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceResource" ADD CONSTRAINT "MarketplaceResource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAccess" ADD CONSTRAINT "ResourceAccess_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "MarketplaceResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAccess" ADD CONSTRAINT "ResourceAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReview" ADD CONSTRAINT "ResourceReview_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "MarketplaceResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReview" ADD CONSTRAINT "ResourceReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceDownload" ADD CONSTRAINT "ResourceDownload_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "MarketplaceResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "MarketplaceResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_mentorBookingId_fkey" FOREIGN KEY ("mentorBookingId") REFERENCES "MentorBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "MarketplaceResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "PayoutRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "PayoutRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonWatchSegment" ADD CONSTRAINT "LessonWatchSegment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonWatchSegment" ADD CONSTRAINT "LessonWatchSegment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePricingProposal" ADD CONSTRAINT "CoursePricingProposal_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePricingProposal" ADD CONSTRAINT "CoursePricingProposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePricingProposal" ADD CONSTRAINT "CoursePricingProposal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEventExternalCalendar" ADD CONSTRAINT "ScheduleEventExternalCalendar_scheduleEventId_fkey" FOREIGN KEY ("scheduleEventId") REFERENCES "ScheduleEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEventExternalCalendar" ADD CONSTRAINT "ScheduleEventExternalCalendar_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAvailability" ADD CONSTRAINT "MentorAvailability_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorBooking" ADD CONSTRAINT "MentorBooking_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorBooking" ADD CONSTRAINT "MentorBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorBooking" ADD CONSTRAINT "MentorBooking_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "MentorAvailability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipApplication" ADD CONSTRAINT "MentorshipApplication_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipApplication" ADD CONSTRAINT "MentorshipApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEventAttendee" ADD CONSTRAINT "ScheduleEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ScheduleEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEventAttendee" ADD CONSTRAINT "ScheduleEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleReminderDelivery" ADD CONSTRAINT "ScheduleReminderDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ScheduleEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleReminderDelivery" ADD CONSTRAINT "ScheduleReminderDelivery_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "ScheduleEventAttendee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "CourseRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRevision" ADD CONSTRAINT "CourseRevision_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInvite" ADD CONSTRAINT "CourseInvite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFeedbackItem" ADD CONSTRAINT "CourseFeedbackItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFeedbackItem" ADD CONSTRAINT "CourseFeedbackItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyActivity" ADD CONSTRAINT "DailyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestProgress" ADD CONSTRAINT "UserQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestProgress" ADD CONSTRAINT "UserQuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardCache" ADD CONSTRAINT "LeaderboardCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRating" ADD CONSTRAINT "CourseRating_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRating" ADD CONSTRAINT "CourseRating_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerInterestProfile" ADD CONSTRAINT "LearnerInterestProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
