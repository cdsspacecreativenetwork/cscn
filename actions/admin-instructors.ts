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
      mentorshipEligible: true,
      instructorProfileEnabled: true,
      instructorVerificationStatus: true,
    },
  });

  if (!instructor?.instructorProfileEnabled) {
    return { error: "Instructor profile is not active." };
  }

  if (enabled && instructor.instructorVerificationStatus !== "VERIFIED") {
    return { error: "Only verified instructors can be approved for mentorship." };
  }

  await db.user.update({
    where: { id: instructorId },
    data: {
      mentorshipEligible: enabled,
      mentorshipApprovedAt: enabled ? new Date() : null,
      ...(enabled ? {} : { mentorshipEnabled: false }),
    },
  });

  if (enabled && !instructor.mentorshipEligible) {
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
