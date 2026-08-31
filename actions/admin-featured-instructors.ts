"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertEmailVerifiedByUserId } from "@/lib/trust-gates";
import { isInstructorFeatureEligible } from "@/lib/profile-eligibility";
import { hasAdminPermission } from "@/lib/admin-permissions";

async function requireFeaturedInstructorAdmin() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role as string | undefined;

  if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return { error: "Unauthorized" as const };
  }
  if (role !== "SUPER_ADMIN" && !hasAdminPermission(session.user, "canManageMarketing")) {
    return { error: "You do not have permission to manage featured instructors." as const };
  }

  try {
    await assertEmailVerifiedByUserId(userId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Verify your email before using this feature.",
    };
  }

  return { userId };
}

function normalizeSlot(slot: number) {
  if (!Number.isInteger(slot) || slot < 1 || slot > 4) {
    throw new Error("Featured instructor slot must be between 1 and 4.");
  }
  return slot;
}

export async function assignFeaturedInstructorAction(instructorId: string, slotValue: number) {
  const admin = await requireFeaturedInstructorAdmin();
  if ("error" in admin) return admin;

  const slot = normalizeSlot(slotValue);
  const instructor = await db.user.findUnique({
    where: { id: instructorId },
    select: {
      id: true,
      role: true,
      name: true,
      image: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          headline: true,
          bio: true,
          expertise: true,
          websiteUrl: true,
          portfolioUrl: true,
          linkedinUrl: true,
          twitterUrl: true,
          instagramUrl: true,
          youtubeUrl: true,
          githubUrl: true,
          behanceUrl: true,
          dribbbleUrl: true,
          telegramUrl: true,
        },
      },
      instructorProfile: {
        select: {
          isEnabled: true,
          verificationStatus: true,
          yearsExperience: true,
          expertise: true,
          bio: true,
        },
      },
    },
  });

  if (!instructor || !instructor.instructorProfile?.isEnabled) {
    return { error: "Only active instructor profiles can be featured." };
  }

  const mergedInstructor = {
    ...instructor,
    headline: instructor.profile?.headline,
    bio: instructor.profile?.bio ?? instructor.instructorProfile?.bio,
    yearsExperience: instructor.instructorProfile?.yearsExperience,
    expertise: instructor.instructorProfile?.expertise ?? instructor.profile?.expertise,
    websiteUrl: instructor.profile?.websiteUrl,
    portfolioUrl: instructor.profile?.portfolioUrl,
    linkedinUrl: instructor.profile?.linkedinUrl,
    twitterUrl: instructor.profile?.twitterUrl,
    instagramUrl: instructor.profile?.instagramUrl,
    youtubeUrl: instructor.profile?.youtubeUrl,
    githubUrl: instructor.profile?.githubUrl,
    behanceUrl: instructor.profile?.behanceUrl,
    dribbbleUrl: instructor.profile?.dribbbleUrl,
    telegramUrl: instructor.profile?.telegramUrl,
    instructorVerificationStatus: instructor.instructorProfile?.verificationStatus ?? "NOT_STARTED",
  };

  if (!isInstructorFeatureEligible(mergedInstructor)) {
    return { error: "This instructor must be verified and profile-complete before featuring." };
  }

  await db.instructorProfile.updateMany({
    where: { featuredOrder: slot },
    data: { isFeatured: false, featuredOrder: null },
  });
  await db.instructorProfile.updateMany({
    where: { userId: instructorId },
    data: { isFeatured: false, featuredOrder: null },
  });
  await db.instructorProfile.update({
    where: { userId: instructorId },
    data: { isFeatured: true, featuredOrder: slot },
  });

  revalidatePath("/");
  revalidatePath("/dashboard/admin/featured-instructors");
  return { success: true };
}

export async function removeFeaturedInstructorAction(instructorId: string) {
  const admin = await requireFeaturedInstructorAdmin();
  if ("error" in admin) return admin;

  await db.instructorProfile.update({
    where: { userId: instructorId },
    data: { isFeatured: false, featuredOrder: null },
  });

  revalidatePath("/");
  revalidatePath("/dashboard/admin/featured-instructors");
  return { success: true };
}

export async function toggleFeaturedInstructorAction(instructorId: string) {
  const admin = await requireFeaturedInstructorAdmin();
  if ("error" in admin) return admin;

  const instructor = await db.user.findUnique({
    where: { id: instructorId },
    select: {
      id: true,
      role: true,
      name: true,
      image: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          headline: true,
          bio: true,
          expertise: true,
          websiteUrl: true,
          portfolioUrl: true,
          linkedinUrl: true,
          twitterUrl: true,
          instagramUrl: true,
          youtubeUrl: true,
          githubUrl: true,
          behanceUrl: true,
          dribbbleUrl: true,
          telegramUrl: true,
        },
      },
      instructorProfile: {
        select: {
          isEnabled: true,
          verificationStatus: true,
          isFeatured: true,
          yearsExperience: true,
          expertise: true,
          bio: true,
        },
      },
    },
  });

  if (!instructor || !instructor.instructorProfile?.isEnabled) {
    return { error: "Only active instructor profiles can be featured." };
  }

  if (instructor.instructorProfile.isFeatured) {
    return removeFeaturedInstructorAction(instructorId);
  }

  const mergedInstructor = {
    ...instructor,
    headline: instructor.profile?.headline,
    bio: instructor.profile?.bio ?? instructor.instructorProfile?.bio,
    yearsExperience: instructor.instructorProfile?.yearsExperience,
    expertise: instructor.instructorProfile?.expertise ?? instructor.profile?.expertise,
    websiteUrl: instructor.profile?.websiteUrl,
    portfolioUrl: instructor.profile?.portfolioUrl,
    linkedinUrl: instructor.profile?.linkedinUrl,
    twitterUrl: instructor.profile?.twitterUrl,
    instagramUrl: instructor.profile?.instagramUrl,
    youtubeUrl: instructor.profile?.youtubeUrl,
    githubUrl: instructor.profile?.githubUrl,
    behanceUrl: instructor.profile?.behanceUrl,
    dribbbleUrl: instructor.profile?.dribbbleUrl,
    telegramUrl: instructor.profile?.telegramUrl,
    instructorVerificationStatus: instructor.instructorProfile?.verificationStatus ?? "NOT_STARTED",
  };

  if (!isInstructorFeatureEligible(mergedInstructor)) {
    return { error: "This instructor must be verified and profile-complete before featuring." };
  }

  const featured = await db.instructorProfile.findMany({
    where: { isFeatured: true, featuredOrder: { not: null } },
    select: { featuredOrder: true },
  });
  const usedSlots = new Set(featured.map((prof) => prof.featuredOrder).filter(Boolean));
  const slot = [1, 2, 3, 4].find((value) => !usedSlots.has(value));

  if (!slot) {
    return { error: "All 4 homepage featured slots are filled. Remove or replace one first." };
  }

  return assignFeaturedInstructorAction(instructorId, slot);
}
