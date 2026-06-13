import "server-only";

import { subDays } from "date-fns";

import { db } from "@/lib/db";

function completionRate(completed: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((completed / total) * 100)}%`;
}

function hasMentorshipReadiness(user: {
  mentorshipTopics: unknown;
  mentorAvailabilities: unknown[];
  payoutSetup: boolean;
  mentorshipBio: string | null;
}) {
  const topics = Array.isArray(user.mentorshipTopics) ? user.mentorshipTopics : [];

  return {
    hasTopics: topics.length > 0,
    hasAvailability: user.mentorAvailabilities.length > 0,
    hasPayout: user.payoutSetup,
    hasBio: Boolean(user.mentorshipBio?.trim()),
  };
}

export async function getAdminMentorshipConsole() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [
    eligibleMentors,
    activeMentors,
    mentorsMissingAvailability,
    totalBookings,
    bookings30d,
    confirmedBookings,
    completedBookings,
    pendingPaymentBookings,
    cancelledBookings,
    paidBookings,
    freeBookings,
    applications,
    requests,
    activeMentorRows,
    recentBookings,
  ] = await Promise.all([
    db.user.count({ where: { mentorshipEligible: true } }),
    db.user.count({ where: { mentorshipEligible: true, mentorshipEnabled: true } }),
    db.user.count({
      where: {
        mentorshipEligible: true,
        mentorshipEnabled: true,
        mentorAvailabilities: { none: { status: "ACTIVE" } },
      },
    }),
    db.mentorBooking.count(),
    db.mentorBooking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.mentorBooking.count({ where: { status: "CONFIRMED" } }),
    db.mentorBooking.count({ where: { status: "COMPLETED" } }),
    db.mentorBooking.count({ where: { status: "PENDING" } }),
    db.mentorBooking.count({ where: { status: "CANCELLED" } }),
    db.mentorBooking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] }, price: { gt: 0 } } }),
    db.mentorBooking.count({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        OR: [{ price: null }, { price: { lte: 0 } }],
      },
    }),
    db.mentorshipApplication.findMany({
      where: { status: { in: ["PENDING", "CHANGES_REQUESTED", "APPROVED", "REJECTED"] } },
      orderBy: [{ submittedAt: "desc" }],
      take: 40,
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
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            headline: true,
            instructorVerificationStatus: true,
            publicProfileSlug: true,
            payoutSetup: true,
            mentorAvailabilities: {
              where: { status: "ACTIVE" },
              select: { id: true },
            },
            _count: {
              select: {
                taughtCourses: true,
                mentorBookings: true,
              },
            },
          },
        },
      },
    }),
    db.user.findMany({
      where: {
        instructorProfileEnabled: true,
        instructorVerificationStatus: "VERIFIED",
        mentorshipEligible: false,
      },
      orderBy: [{ instructorVerifiedAt: "desc" }, { updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        mentorshipBio: true,
        mentorshipTopics: true,
        payoutSetup: true,
        mentorAvailabilities: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
        _count: {
          select: {
            taughtCourses: true,
            mentorBookings: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: { mentorshipEligible: true },
      orderBy: [{ mentorshipEnabled: "desc" }, { mentorshipApprovedAt: "desc" }, { updatedAt: "desc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        mentorshipEligible: true,
        mentorshipEnabled: true,
        mentorshipFree: true,
        mentorshipPrice: true,
        mentorshipCurrency: true,
        mentorshipTopics: true,
        payoutSetup: true,
        mentorAvailabilities: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
        mentorBookings: {
          select: { id: true, status: true, price: true },
        },
      },
    }),
    db.mentorBooking.findMany({
      orderBy: { startsAt: "asc" },
      where: {
        startsAt: { gte: subDays(now, 7) },
      },
      take: 12,
      select: {
        id: true,
        status: true,
        topic: true,
        startsAt: true,
        endsAt: true,
        timezone: true,
        price: true,
        currency: true,
        mentor: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const issues = [
    {
      label: "Mentors with no availability",
      value: mentorsMissingAvailability,
      tone: mentorsMissingAvailability > 0 ? "warning" : "neutral",
      description: "Eligible mentors who are public/open but have no active booking windows.",
    },
    {
      label: "Pending payment holds",
      value: pendingPaymentBookings,
      tone: pendingPaymentBookings > 0 ? "warning" : "neutral",
      description: "Mentorship slots temporarily reserved while learners finish payment.",
    },
    {
      label: "Cancelled bookings",
      value: cancelledBookings,
      tone: cancelledBookings > 0 ? "danger" : "neutral",
      description: "Cancelled mentorship sessions. Later this becomes cancellation/no-show quality tracking.",
    },
  ];

  return {
    stats: [
      { label: "Eligible mentors", value: eligibleMentors },
      { label: "Active mentors", value: activeMentors },
      { label: "Bookings in 30 days", value: bookings30d },
      { label: "Completion rate", value: completionRate(completedBookings, confirmedBookings + completedBookings) },
    ],
    bookingMix: {
      total: totalBookings,
      paid: paidBookings,
      free: freeBookings,
      pending: pendingPaymentBookings,
      cancelled: cancelledBookings,
    },
    issues,
    applications: applications.map((application) => ({
      ...application,
      proposedPrice: application.proposedPrice?.toString() ?? null,
      topics: Array.isArray(application.topics) ? application.topics : [],
      sessionTypes: Array.isArray(application.sessionTypes) ? application.sessionTypes : [],
      submittedAt: application.submittedAt.toISOString(),
      instructor: {
        ...application.instructor,
        activeAvailability: application.instructor.mentorAvailabilities.length,
      },
    })),
    requests: requests.map((mentor) => ({
      ...mentor,
      readiness: hasMentorshipReadiness(mentor),
      mentorshipTopics: Array.isArray(mentor.mentorshipTopics) ? mentor.mentorshipTopics : [],
    })),
    activeMentors: activeMentorRows.map((mentor) => {
      const confirmed = mentor.mentorBookings.filter((booking) => booking.status === "CONFIRMED").length;
      const completed = mentor.mentorBookings.filter((booking) => booking.status === "COMPLETED").length;
      const paid = mentor.mentorBookings.filter(
        (booking) => ["CONFIRMED", "COMPLETED"].includes(booking.status) && Number(booking.price ?? 0) > 0
      ).length;

      return {
        ...mentor,
        mentorshipPrice: mentor.mentorshipPrice?.toString() ?? null,
        mentorshipTopics: Array.isArray(mentor.mentorshipTopics) ? mentor.mentorshipTopics : [],
        activeAvailability: mentor.mentorAvailabilities.length,
        bookings: mentor.mentorBookings.length,
        confirmed,
        completed,
        paid,
      };
    }),
    recentBookings: recentBookings.map((booking) => ({
      ...booking,
      price: booking.price?.toString() ?? null,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
    })),
  };
}
