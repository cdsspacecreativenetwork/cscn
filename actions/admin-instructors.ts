"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertEmailVerifiedByUserId } from "@/lib/trust-gates";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { createNotification } from "@/data/notifications";

async function requireInstructorManager() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" as const };
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: "Forbidden" as const };
  }
  if (session.user.role !== "SUPER_ADMIN" && !hasAdminPermission(session.user, "canManageInstructors")) {
    return { error: "You do not have permission to manage instructors." as const };
  }
  try {
    await assertEmailVerifiedByUserId(session.user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Verify your email before using this feature.",
    };
  }
  return { userId: session.user.id };
}

export async function toggleInstructorMentorshipAction(instructorId: string, enabled: boolean) {
  const admin = await requireInstructorManager();
  if ("error" in admin) return admin;

  const instructor = await db.user.findUnique({
    where: { id: instructorId },
    select: {
      id: true,
      instructorProfile: {
        select: {
          isEnabled: true,
          verificationStatus: true,
        },
      },
      mentorProfile: {
        select: {
          isEligible: true,
        },
      },
    },
  });

  if (!instructor?.instructorProfile?.isEnabled) {
    return { error: "Instructor profile is not active." };
  }

  if (enabled && instructor.instructorProfile.verificationStatus !== "VERIFIED") {
    return { error: "Only verified instructors can be approved for mentorship." };
  }

  const wasEligible = instructor.mentorProfile?.isEligible ?? false;

  await db.mentorProfile.upsert({
    where: { userId: instructorId },
    create: {
      userId: instructorId,
      isEligible: enabled,
      approvedAt: enabled ? new Date() : null,
      ...(enabled ? {} : { isEnabled: false }),
    },
    update: {
      isEligible: enabled,
      approvedAt: enabled ? new Date() : null,
      ...(enabled ? {} : { isEnabled: false }),
    },
  });

  if (enabled && !wasEligible) {
    await createNotification(
      instructorId,
      "SYSTEM",
      "You are eligible for mentorship",
      "CSCN has approved you to mentor learners. Turn on mentorship and add availability windows to appear publicly.",
      { kind: "MENTORSHIP_ELIGIBILITY_APPROVED" },
      {
        actionRequired: true,
        actionLabel: "Set availability",
        actionUrl: "/dashboard/instructor/mentorship",
      }
    );
  }

  revalidatePath("/dashboard/admin/instructors");
  revalidatePath("/dashboard/admin/mentorship");
  revalidatePath("/mentorship");
  return { success: enabled ? "Mentorship eligibility approved." : "Mentorship eligibility removed." };
}
