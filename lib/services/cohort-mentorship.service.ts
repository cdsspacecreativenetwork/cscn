import { generateTapbackAvatar } from "@/lib/avatar";
import { buildMentorBookingSlots } from "@/lib/mentor-booking-slots";
import { db } from "@/lib/db";

const activeMembershipStatuses = ["ACTIVE", "COMPLETED"] as const;

export async function getCohortMentorshipForLearner(cohortId: string, userId: string) {
  const membership = await db.cohortMembership.findFirst({
    where: { cohortId, userId, role: "LEARNER", status: { in: [...activeMembershipStatuses] } },
    select: { id: true },
  });
  if (!membership) return null;

  const [assignments, submissions, upcomingBookings] = await Promise.all([
    db.cohortMentorAssignment.findMany({
      where: {
        cohortId,
        status: "ACTIVE",
        mentor: {
          mentorProfile: { isEligible: true, isEnabled: true },
          profile: { publicProfileStatus: "PUBLIC" },
        },
      },
      orderBy: [{ assignedAt: "asc" }],
      select: {
        id: true,
        role: true,
        focusAreas: true,
        mentor: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: { select: { headline: true, publicProfileSlug: true } },
            mentorProfile: {
              select: {
                isFree: true,
                price: true,
                currency: true,
                bio: true,
                topics: true,
                instructions: true,
              },
            },
            mentorAvailabilities: {
              where: { status: "ACTIVE" },
              orderBy: [{ type: "asc" }, { weekday: "asc" }, { date: "asc" }, { startTime: "asc" }],
              select: { id: true, type: true, weekday: true, date: true, startTime: true, endTime: true, timezone: true, sessionDuration: true, bufferMinutes: true, maxBookings: true, bookings: { where: { status: { in: ["PENDING", "CONFIRMED"] } }, select: { startsAt: true, status: true } } },
            },
          },
        },
      },
    }),
    db.projectSubmission.findMany({
      where: { userId, project: { cohortId }, status: { not: "WITHDRAWN" } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, project: { select: { title: true } } },
    }),
    db.mentorBooking.findMany({
      where: { cohortId, studentId: userId, status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED", "AWAITING_COMPLETION"] } },
      orderBy: { startsAt: "asc" },
      take: 4,
      select: { id: true, status: true, startsAt: true, timezone: true, topic: true, mentor: { select: { name: true } }, projectSubmission: { select: { title: true } } },
    }),
  ]);

  return {
    mentors: assignments.map((assignment) => {
      const mentor = assignment.mentor;
      const name = mentor.name ?? "CSCN mentor";
      const mentorProfile = mentor.mentorProfile;
      const topics = Array.isArray(mentorProfile?.topics) ? mentorProfile.topics.filter((item): item is string => typeof item === "string") : [];
      return {
        assignmentId: assignment.id,
        id: mentor.id,
        slug: mentor.profile?.publicProfileSlug ?? mentor.id,
        name,
        role: assignment.role || mentor.profile?.headline || "Cohort mentor",
        image: mentor.image ?? generateTapbackAvatar(name),
        courses: 0,
        students: "Cohort",
        priceLabel: mentorProfile?.isFree ? "Included" : mentorProfile?.price ? `${mentorProfile.currency} ${mentorProfile.price.toString()}` : "Paid",
        intro: mentorProfile?.bio,
        instructions: mentorProfile?.instructions,
        topics,
        focusAreas: Array.isArray(assignment.focusAreas) ? assignment.focusAreas.filter((item): item is string => typeof item === "string") : [],
        availability: mentor.mentorAvailabilities,
        slots: buildMentorBookingSlots(mentor.mentorAvailabilities, 12),
      };
    }),
    submissions,
    upcomingBookings,
  };
}

export async function validateCohortMentorshipBookingContext({ cohortId, mentorId, studentId, projectSubmissionId }: { cohortId: string; mentorId: string; studentId: string; projectSubmissionId?: string | null }) {
  const assignment = await db.cohortMentorAssignment.findFirst({
    where: { cohortId, mentorId, status: "ACTIVE", cohort: { memberships: { some: { userId: studentId, role: "LEARNER", status: { in: [...activeMembershipStatuses] } } } } },
    select: { id: true },
  });
  if (!assignment) return { success: false as const, error: "This mentor is not assigned to your active cohort." };
  if (projectSubmissionId) {
    const submission = await db.projectSubmission.findFirst({ where: { id: projectSubmissionId, userId: studentId, project: { cohortId } }, select: { id: true } });
    if (!submission) return { success: false as const, error: "That project is not available in this cohort." };
  }
  return { success: true as const, assignmentId: assignment.id };
}

export async function getAdminCohortMentorship() {
  const [cohorts, mentors, assignments] = await Promise.all([
    db.cohort.findMany({ orderBy: { startsAt: "desc" }, take: 40, select: { id: true, title: true, slug: true, startsAt: true, program: { select: { title: true } } } }),
    db.user.findMany({
      where: {
        mentorProfile: { isEligible: true, isEnabled: true },
        profile: { publicProfileStatus: "PUBLIC" },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        profile: { select: { headline: true } },
        mentorProfile: { select: { topics: true } },
        mentorAvailabilities: { where: { status: "ACTIVE" }, select: { id: true } },
      },
    }),
    db.cohortMentorAssignment.findMany({
      orderBy: { assignedAt: "desc" },
      select: {
        id: true,
        status: true,
        role: true,
        focusAreas: true,
        assignedAt: true,
        cohort: { select: { id: true, title: true, slug: true, program: { select: { title: true } } } },
        mentor: { select: { id: true, name: true, email: true, profile: { select: { headline: true } } } },
      },
    }),
  ]);
  return { cohorts, mentors, assignments };
}
