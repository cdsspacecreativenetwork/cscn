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
        timezone: true,
        instructorProfileEnabled: true,
        instructorVerificationStatus: true,
        mentorshipEligible: true,
        mentorshipEnabled: true,
        mentorshipApprovedAt: true,
        mentorshipFree: true,
        mentorshipPrice: true,
        mentorshipCurrency: true,
        mentorshipBio: true,
        mentorshipTopics: true,
        mentorshipInstructions: true,
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

  return {
    profile,
    availability,
    upcomingBookings,
    latestApplication,
  };
}
