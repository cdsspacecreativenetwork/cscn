"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertEmailVerifiedByUserId } from "@/lib/trust-gates";
import { isInstructorFeatureEligible } from "@/lib/profile-eligibility";

async function requireFeaturedInstructorAdmin() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role as string | undefined;

  if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return { error: "Unauthorized" as const };
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
      headline: true,
      bio: true,
      firstName: true,
      lastName: true,
      yearsExperience: true,
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
      instructorProfileEnabled: true,
      instructorVerificationStatus: true,
    },
  });

  if (!instructor || instructor.role !== "INSTRUCTOR" || !instructor.instructorProfileEnabled) {
    return { error: "Only active instructors can be featured." };
  }

  if (!isInstructorFeatureEligible(instructor)) {
    return { error: "This instructor must be verified and profile-complete before featuring." };
  }

  await db.user.updateMany({
    where: { instructorFeaturedOrder: slot },
    data: { instructorFeatured: false, instructorFeaturedOrder: null },
  });
  await db.user.updateMany({
    where: { id: instructorId },
    data: { instructorFeatured: false, instructorFeaturedOrder: null },
  });
  await db.user.update({
    where: { id: instructorId },
    data: { instructorFeatured: true, instructorFeaturedOrder: slot },
  });

  revalidatePath("/");
  revalidatePath("/dashboard/admin/featured-instructors");
  return { success: true };
}

export async function removeFeaturedInstructorAction(instructorId: string) {
  const admin = await requireFeaturedInstructorAdmin();
  if ("error" in admin) return admin;

  await db.user.update({
    where: { id: instructorId },
    data: { instructorFeatured: false, instructorFeaturedOrder: null },
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
      headline: true,
      bio: true,
      firstName: true,
      lastName: true,
      yearsExperience: true,
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
      instructorProfileEnabled: true,
      instructorVerificationStatus: true,
      instructorFeatured: true,
    },
  });

  if (!instructor || instructor.role !== "INSTRUCTOR") {
    return { error: "Only instructors can be featured." };
  }

  if (instructor.instructorFeatured) {
    return removeFeaturedInstructorAction(instructorId);
  }

  if (!isInstructorFeatureEligible(instructor)) {
    return { error: "This instructor must be verified and profile-complete before featuring." };
  }

  const featured = await db.user.findMany({
    where: { instructorFeatured: true, instructorFeaturedOrder: { not: null } },
    select: { instructorFeaturedOrder: true },
  });
  const usedSlots = new Set(featured.map((user) => user.instructorFeaturedOrder).filter(Boolean));
  const slot = [1, 2, 3, 4].find((value) => !usedSlots.has(value));

  if (!slot) {
    return { error: "All 4 homepage featured slots are filled. Remove or replace one first." };
  }

  return assignFeaturedInstructorAction(instructorId, slot);
}
