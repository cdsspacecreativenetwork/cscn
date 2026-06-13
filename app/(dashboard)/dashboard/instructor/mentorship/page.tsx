import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MentorshipDashboard } from "@/components/dashboard/instructor/MentorshipDashboard";
import { getInstructorMentorshipDashboard } from "@/data/mentorship";
import { shouldRedirectInstructorToOnboarding } from "@/lib/instructor-onboarding";

type SearchParams = Promise<{
  error?: string;
  updated?: string;
  availability?: string;
  application?: string;
}>;

export const metadata = { title: "Mentorship | CSCN Instructor" };

export default async function InstructorMentorshipPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const role = session.user.role;
  if (role !== "INSTRUCTOR" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  if (role === "INSTRUCTOR" && await shouldRedirectInstructorToOnboarding(session.user.id)) {
    redirect("/dashboard/profile?setup=instructor");
  }

  const params = await searchParams;
  const { profile, availability, upcomingBookings, latestApplication } = await getInstructorMentorshipDashboard(session.user.id);

  if (!profile) redirect("/dashboard");

  const normalizedTopics = Array.isArray(profile.mentorshipTopics)
    ? profile.mentorshipTopics.filter((topic): topic is string => typeof topic === "string")
    : [];

  return (
    <MentorshipDashboard
      profile={{
        id: profile.id,
        name: profile.name,
        timezone: profile.timezone,
        mentorshipEligible: profile.mentorshipEligible,
        mentorshipEnabled: profile.mentorshipEnabled,
        mentorshipApprovedAt: profile.mentorshipApprovedAt?.toISOString() ?? null,
        mentorshipFree: profile.mentorshipFree,
        mentorshipPrice: profile.mentorshipPrice?.toString() ?? null,
        mentorshipCurrency: profile.mentorshipCurrency,
        mentorshipBio: profile.mentorshipBio,
        mentorshipTopics: normalizedTopics,
        mentorshipInstructions: profile.mentorshipInstructions,
      }}
      availability={availability.map((slot) => ({
        id: slot.id,
        type: slot.type,
        weekday: slot.weekday,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone: slot.timezone,
        sessionDuration: slot.sessionDuration,
        bufferMinutes: slot.bufferMinutes,
        maxBookings: slot.maxBookings,
        status: slot.status,
      }))}
      upcomingBookings={upcomingBookings.map((booking) => ({
        id: booking.id,
        status: booking.status,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        timezone: booking.timezone,
        topic: booking.topic,
        studentNote: booking.studentNote,
        rescheduleRequestedById: booking.rescheduleRequestedById,
        rescheduleRequestedAt: booking.rescheduleRequestedAt?.toISOString() ?? null,
        proposedStartsAt: booking.proposedStartsAt?.toISOString() ?? null,
        proposedEndsAt: booking.proposedEndsAt?.toISOString() ?? null,
        proposedTimezone: booking.proposedTimezone,
        rescheduleNote: booking.rescheduleNote,
        rescheduleRespondedAt: booking.rescheduleRespondedAt?.toISOString() ?? null,
        rescheduleResponseNote: booking.rescheduleResponseNote,
        price: booking.price?.toString() ?? null,
        currency: booking.currency,
        meetingUrl: booking.meetingUrl,
        scheduleEventId: booking.scheduleEventId,
        student: booking.student,
      }))}
      latestApplication={latestApplication ? {
        id: latestApplication.id,
        status: latestApplication.status,
        pitch: latestApplication.pitch,
        audience: latestApplication.audience,
        topics: Array.isArray(latestApplication.topics)
          ? latestApplication.topics.filter((topic): topic is string => typeof topic === "string")
          : [],
        sessionTypes: Array.isArray(latestApplication.sessionTypes)
          ? latestApplication.sessionTypes.filter((type): type is string => typeof type === "string")
          : [],
        mentorshipFree: latestApplication.mentorshipFree,
        proposedPrice: latestApplication.proposedPrice?.toString() ?? null,
        proposedCurrency: latestApplication.proposedCurrency,
        instructions: latestApplication.instructions,
        reviewNote: latestApplication.reviewNote,
        submittedAt: latestApplication.submittedAt.toISOString(),
        reviewedAt: latestApplication.reviewedAt?.toISOString() ?? null,
      } : null}
      error={params.error}
      updated={
        params.updated === "1" ||
        params.availability === "created" ||
        params.availability === "updated" ||
        params.application === "submitted" ||
        params.application === "withdrawn"
      }
    />
  );
}
