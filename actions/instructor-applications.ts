'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { createAuditLog } from '@/data/audit-logs';
import { createNotification } from '@/data/notifications';
import { db } from '@/lib/db';
import { hasAdminPermission } from '@/lib/admin-permissions';
import {
  experienceLevelToYears,
  getInstructorFullName,
  getInstructorReviewDueAt,
  instructorApplicationSchema,
  type InstructorApplicationInput,
} from '@/lib/instructor-applications';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export async function submitInstructorApplicationAction(input: InstructorApplicationInput) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: 'Sign in or create an account to finish your application.' };
  }

  const parsed = instructorApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check your application details.' };
  }

  const accountEmail = session.user.email.trim().toLowerCase();
  if (parsed.data.email !== accountEmail) {
    return { error: 'Your application email must match your signed-in CSCN account.' };
  }

  const rateLimit = await enforceRateLimit(
    'instructor-application',
    session.user.id,
    RATE_LIMITS.instructorApplication
  );
  if (!rateLimit.allowed) {
    return { error: `Too many attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      expertise: true,
      instructorApplication: true,
    },
  });
  if (!user) return { error: 'Your account could not be found.' };
  if (user.role !== 'USER' || user.instructorApplication?.status === 'APPROVED') {
    return { error: 'This account is not eligible to submit an instructor application.' };
  }

  const now = new Date();
  const existingApplication = user.instructorApplication;
  const existingPending = existingApplication?.status === 'PENDING';
  const submittedAt = existingPending && existingApplication ? existingApplication.submittedAt : now;
  const reviewDueAt = existingPending
    && existingApplication
    ? existingApplication.reviewDueAt
    : getInstructorReviewDueAt(now);
  const fullName = getInstructorFullName(parsed.data);
  const expertise = Array.from(new Set([...stringArray(user.expertise), parsed.data.industry]));

  const application = await db.$transaction(async (tx) => {
    const saved = await tx.instructorApplication.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName,
        email: parsed.data.email,
        industry: parsed.data.industry,
        portfolioUrl: parsed.data.portfolioUrl,
        experienceLevel: parsed.data.experienceLevel,
        submittedAt,
        reviewDueAt,
      },
      update: {
        fullName,
        email: parsed.data.email,
        industry: parsed.data.industry,
        portfolioUrl: parsed.data.portfolioUrl,
        experienceLevel: parsed.data.experienceLevel,
        status: 'PENDING',
        submittedAt,
        reviewDueAt,
        reviewedAt: null,
        reviewedById: null,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        name: fullName,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        portfolioUrl: parsed.data.portfolioUrl,
        expertise,
        yearsExperience: experienceLevelToYears(parsed.data.experienceLevel),
        profile: {
          upsert: {
            create: {
              portfolioUrl: parsed.data.portfolioUrl,
              expertise,
            },
            update: {
              portfolioUrl: parsed.data.portfolioUrl,
              expertise,
            },
          },
        },
        instructorProfile: {
          upsert: {
            create: {
              yearsExperience: experienceLevelToYears(parsed.data.experienceLevel),
              expertise,
            },
            update: {
              yearsExperience: experienceLevelToYears(parsed.data.experienceLevel),
              expertise,
            },
          },
        },
      },
    });

    return saved;
  });

  if (!existingPending) {
    const admins = await db.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'ADMIN', canManageInstructors: true },
        ],
      },
      select: { id: true },
    });
    await Promise.allSettled(
      admins.map((admin) =>
        createNotification(
          admin.id,
          'SYSTEM',
          'New instructor application',
          `${fullName} applied to become a CSCN instructor.`,
          { kind: 'INSTRUCTOR_APPLICATION', applicationId: application.id },
          {
            actionRequired: true,
            actionLabel: 'Review application',
            actionUrl: '/dashboard/admin/instructors?tab=applications',
          }
        )
      )
    );
    await createAuditLog({
      actorId: user.id,
      actorName: fullName,
      actorEmail: accountEmail,
      action: 'instructor.application_submitted',
      entityType: 'INSTRUCTOR_APPLICATION',
      entityId: application.id,
      entityName: fullName,
      metadata: { industry: parsed.data.industry, reviewDueAt: reviewDueAt.toISOString() },
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/admin/instructors');
  return { success: true as const, reviewDueAt: reviewDueAt.toISOString() };
}

async function requireInstructorApplicationManager() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: 'Unauthorized.' };
  if (!hasAdminPermission(session.user, 'canManageInstructors')) {
    return { ok: false as const, error: 'You do not have permission to manage instructor applications.' };
  }
  return { ok: true as const, session, userId: session.user.id };
}

export async function approveInstructorApplicationAction(applicationId: string) {
  const manager = await requireInstructorApplicationManager();
  if (!manager.ok) return { error: manager.error };

  const application = await db.instructorApplication.findUnique({
    where: { id: applicationId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!application) return { error: 'Application not found.' };
  if (application.status !== 'PENDING') return { error: 'This application has already been reviewed.' };
  if (application.userId === manager.userId) return { error: 'Another admin must review your application.' };

  const now = new Date();
  const approved = await db.$transaction(async (tx) => {
    const claimed = await tx.instructorApplication.updateMany({
      where: { id: application.id, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedAt: now, reviewedById: manager.userId },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({
      where: { id: application.userId },
      data: {
        role: 'INSTRUCTOR',
        instructorProfileEnabled: true,
        publicProfileStatus: 'DRAFT',
        instructorVerificationStatus: 'NOT_STARTED',
        instructorVerifiedAt: null,
        instructorFeatured: false,
        instructorFeaturedOrder: null,
        profile: {
          upsert: {
            create: { publicProfileStatus: 'DRAFT' },
            update: { publicProfileStatus: 'DRAFT' },
          },
        },
        instructorProfile: {
          upsert: {
            create: {
              isEnabled: true,
              verificationStatus: 'NOT_STARTED',
              verifiedAt: null,
              isFeatured: false,
              featuredOrder: null,
            },
            update: {
              isEnabled: true,
              verificationStatus: 'NOT_STARTED',
              verifiedAt: null,
              isFeatured: false,
              featuredOrder: null,
            },
          },
        },
      },
    });
    return true;
  });
  if (!approved) return { error: 'This application has already been reviewed.' };

  await Promise.all([
    createNotification(
      application.userId,
      'SYSTEM',
      'Your instructor application was approved',
      'Welcome to CSCN’s instructor community. Complete your instructor profile to begin building your teaching presence.',
      { kind: 'INSTRUCTOR_APPLICATION_APPROVED', applicationId: application.id },
      { actionRequired: true, actionLabel: 'Open instructor dashboard', actionUrl: '/dashboard' }
    ),
    createAuditLog({
      actorId: manager.userId,
      actorName: manager.session.user.name,
      actorEmail: manager.session.user.email,
      action: 'instructor.application_approved',
      entityType: 'INSTRUCTOR_APPLICATION',
      entityId: application.id,
      entityName: application.fullName,
      metadata: { applicantUserId: application.userId },
    }),
  ]);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/admin/instructors');
  return { success: 'Instructor application approved.' };
}

export async function rejectInstructorApplicationAction(applicationId: string) {
  const manager = await requireInstructorApplicationManager();
  if (!manager.ok) return { error: manager.error };

  const application = await db.instructorApplication.findUnique({ where: { id: applicationId } });
  if (!application) return { error: 'Application not found.' };
  if (application.status !== 'PENDING') return { error: 'This application has already been reviewed.' };
  if (application.userId === manager.userId) return { error: 'Another admin must review your application.' };

  const rejected = await db.instructorApplication.updateMany({
    where: { id: application.id, status: 'PENDING' },
    data: { status: 'REJECTED', reviewedAt: new Date(), reviewedById: manager.userId },
  });
  if (rejected.count !== 1) return { error: 'This application has already been reviewed.' };

  await Promise.all([
    createNotification(
      application.userId,
      'SYSTEM',
      'Update on your instructor application',
      'Your application was not approved at this time. You can review your details and apply again.',
      { kind: 'INSTRUCTOR_APPLICATION_REJECTED', applicationId: application.id },
      { actionRequired: true, actionLabel: 'Apply again', actionUrl: '/instructors?apply=1' }
    ),
    createAuditLog({
      actorId: manager.userId,
      actorName: manager.session.user.name,
      actorEmail: manager.session.user.email,
      action: 'instructor.application_rejected',
      entityType: 'INSTRUCTOR_APPLICATION',
      entityId: application.id,
      entityName: application.fullName,
      metadata: { applicantUserId: application.userId },
    }),
  ]);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/admin/instructors');
  return { success: 'Instructor application rejected.' };
}
