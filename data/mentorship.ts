import "server-only";

import { db } from "@/lib/db";

export async function getInstructorMentorshipDashboard(userId: string) {
  const [profile, availability, upcomingBookings, latestApplication] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        profile: { select: { timezone: true } },
        instructorProfile: {
          select: {
            isEnabled: true,
            verificationStatus: true,
          },
        },
        mentorProfile: {
          select: {
            isEligible: true,
            isEnabled: true,
            approvedAt: true,
            isFree: true,
            price: true,
            currency: true,
            bio: true,
            topics: true,
            instructions: true,
          },
        },
      },
    }),
    db.mentorAvailability.findMany({
      where: {
        mentorId: userId,
        status: { not: "ARCHIVED" },
      },
      orderBy: [{ type: "asc" }, { weekday: "asc" }, { date: "asc" }, { startTime: "asc" }],
      include: {
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED", "AWAITING_COMPLETION"] },
          },
          select: {
            startsAt: true,
            status: true,
          },
        },
      },
    }),
    db.mentorBooking.findMany({
      where: {
        mentorId: userId,
        status: { in: ["PENDING", "CONFIRMED", "AWAITING_COMPLETION", "RESCHEDULE_REQUESTED", "DISPUTED"] },
        OR: [
          { startsAt: { gte: new Date() } },
          { status: { in: ["AWAITING_COMPLETION", "RESCHEDULE_REQUESTED", "DISPUTED"] } },
        ],
      },
      orderBy: [{ startsAt: "asc" }, { updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        timezone: true,
        topic: true,
        studentNote: true,
        rescheduleRequestedById: true,
        rescheduleRequestedAt: true,
        proposedStartsAt: true,
        proposedEndsAt: true,
        proposedTimezone: true,
        rescheduleNote: true,
        rescheduleRespondedAt: true,
        rescheduleResponseNote: true,
        price: true,
        currency: true,
        meetingUrl: true,
        scheduleEventId: true,
        cohort: { select: { title: true, program: { select: { title: true } } } },
        projectSubmission: { select: { title: true } },
        student: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    db.mentorshipApplication.findFirst({
      where: { instructorId: userId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        pitch: true,
        audience: true,
        topics: true,
        sessionTypes: true,
        mentorshipFree: true,
        proposedPrice: true,
        proposedCurrency: true,
        instructions: true,
        reviewNote: true,
        submittedAt: true,
        reviewedAt: true,
      },
    }),
  ]);

  const mergedProfile = profile
    ? {
        ...profile,
        instructorProfileEnabled: profile.instructorProfile?.isEnabled ?? false,
        instructorVerificationStatus: profile.instructorProfile?.verificationStatus ?? "NOT_STARTED",
        mentorshipEligible: profile.mentorProfile?.isEligible ?? false,
        mentorshipEnabled: profile.mentorProfile?.isEnabled ?? false,
        mentorshipApprovedAt: profile.mentorProfile?.approvedAt ?? null,
        mentorshipFree: profile.mentorProfile?.isFree ?? true,
        mentorshipPrice: profile.mentorProfile?.price ?? null,
        mentorshipCurrency: profile.mentorProfile?.currency ?? "NGN",
        mentorshipBio: profile.mentorProfile?.bio ?? null,
        mentorshipTopics: profile.mentorProfile?.topics ?? null,
        mentorshipInstructions: profile.mentorProfile?.instructions ?? null,
      }
    : null;

  return {
    profile: mergedProfile,
    availability,
    upcomingBookings,
    latestApplication,
  };
}
