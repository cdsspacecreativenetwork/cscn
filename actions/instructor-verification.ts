"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCreatorReadinessByUserId } from "@/lib/trust-gates";
import { getInstructorPublicProfileEligibility } from "@/lib/profile-eligibility";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { createAuditLog } from "@/data/audit-logs";

function toPublicSlug(user: { publicProfileSlug: string | null; id: string; name: string | null }) {
  return (
    user.publicProfileSlug ||
    user.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    user.id
  );
}

async function requireCurrentUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return { userId, role: session.user.role };
}

export async function activateInstructorProfileAction() {
  const { userId, role } = await requireCurrentUser();

  if (role !== "SUPER_ADMIN") {
    return { error: "Only super admins can self-activate an instructor profile." };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const eligibility = getInstructorPublicProfileEligibility(user);

  await db.user.update({
    where: { id: userId },
    data: {
      instructorProfileEnabled: true,
      publicProfileStatus: eligibility.eligible ? "PUBLIC" : "DRAFT",
      instructorVerificationStatus: "VERIFIED",
      instructorVerifiedAt: new Date(),
    },
  });
  const session = await auth();
  await createAuditLog({
    actorId: userId,
    actorName: session?.user?.name,
    actorEmail: session?.user?.email,
    action: "instructor.profile_activated",
    entityType: "USER",
    entityId: userId,
    entityName: user.name ?? user.email,
    metadata: { verificationStatus: "VERIFIED" },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");

  return { success: "Instructor profile activated." };
}

export async function submitInstructorVerificationAction() {
  const { userId } = await requireCurrentUser();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      publicProfileSlug: true,
      instructorProfileEnabled: true,
      instructorVerificationStatus: true,
    },
  });

  if (!user?.instructorProfileEnabled) {
    return { error: "Activate your instructor profile first." };
  }

  if (user.instructorVerificationStatus === "VERIFIED") {
    return { error: "Your instructor profile is already verified." };
  }

  const readiness = await getCreatorReadinessByUserId(userId);
  if (!readiness.canSubmitForReview) {
    return { error: `Complete these items first: ${readiness.missingLabels.join(", ")}.` };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      instructorVerificationStatus: "PENDING",
      publicProfileStatus: "PUBLIC",
    },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/instructor/${toPublicSlug(user)}`);

  return { success: "Your profile has been sent for admin verification." };
}

export async function approveInstructorVerificationAction(targetUserId: string) {
  const { userId, role } = await requireCurrentUser();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") return { error: "Forbidden." };
  const session = await auth();
  if (role !== "SUPER_ADMIN" && !hasAdminPermission(session?.user, "canVerifyInstructors")) {
    return { error: "You do not have permission to verify instructors." };
  }
  if (targetUserId === userId) return { error: "Another admin must verify your instructor profile." };

  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target?.instructorProfileEnabled) return { error: "Instructor profile is not active." };

  const readiness = await getCreatorReadinessByUserId(targetUserId);
  if (!readiness.canSubmitForReview) {
    return { error: `Profile is incomplete: ${readiness.missingLabels.join(", ")}.` };
  }

  const updated = await db.user.update({
    where: { id: targetUserId },
    data: {
      instructorVerificationStatus: "VERIFIED",
      instructorVerifiedAt: new Date(),
      publicProfileStatus: "PUBLIC",
    },
    select: { id: true, name: true, email: true },
  });
  await createAuditLog({
    actorId: userId,
    actorName: session?.user?.name,
    actorEmail: session?.user?.email,
    action: "instructor.verified",
    entityType: "USER",
    entityId: updated.id,
    entityName: updated.name ?? updated.email,
    metadata: { verificationStatus: "VERIFIED" },
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/instructors");
  revalidatePath(`/instructor/${toPublicSlug(target)}`);

  return { success: "Instructor verified." };
}

export async function rejectInstructorVerificationAction(targetUserId: string) {
  const { userId, role } = await requireCurrentUser();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") return { error: "Forbidden." };
  const session = await auth();
  if (role !== "SUPER_ADMIN" && !hasAdminPermission(session?.user, "canVerifyInstructors")) {
    return { error: "You do not have permission to verify instructors." };
  }
  if (targetUserId === userId) return { error: "Another admin must review your instructor profile." };

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, publicProfileSlug: true, instructorProfileEnabled: true },
  });
  if (!target?.instructorProfileEnabled) return { error: "Instructor profile is not active." };

  const updated = await db.user.update({
    where: { id: targetUserId },
    data: {
      instructorVerificationStatus: "REJECTED",
      instructorVerifiedAt: null,
      instructorFeatured: false,
      instructorFeaturedOrder: null,
    },
    select: { id: true, name: true, email: true },
  });
  await createAuditLog({
    actorId: userId,
    actorName: session?.user?.name,
    actorEmail: session?.user?.email,
    action: "instructor.rejected",
    entityType: "USER",
    entityId: updated.id,
    entityName: updated.name ?? updated.email,
    metadata: { verificationStatus: "REJECTED" },
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/instructors");
  revalidatePath(`/instructor/${toPublicSlug(target)}`);

  return { success: "Instructor verification rejected." };
}
