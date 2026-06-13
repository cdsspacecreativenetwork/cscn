"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { queueLiveSessionUpdateEmail } from "@/data/email-outbox";
import { createNotification } from "@/data/notifications";
import { cancelEventScheduleReminders, queueScheduleReminders } from "@/data/schedule-reminders";
import { db } from "@/lib/db";
import {
  createGoogleMeetForScheduleEvent,
  getConnectedGoogleCalendar,
} from "@/lib/integrations/google-calendar";
import {
  DEFAULT_SCHEDULE_TIME_ZONE,
  formatScheduleDateTime,
  normalizeScheduleTimeZone,
  parseLocalDateTimeInZone,
} from "@/lib/schedule-time";

const MIN_SESSION_LEAD_TIME_MS = 30 * 60 * 1000;
const JOIN_WINDOW_BEFORE_MS = 15 * 60 * 1000;

export type CourseLiveSessionFormState = {
  status: "idle" | "error";
  error?: "missing-fields" | "invalid-time" | "lead-time" | "course-access" | "calendar-required";
};

function isPrivilegedInstructorRole(role?: string) {
  return role === "INSTRUCTOR" || role === "ADMIN" || role === "SUPER_ADMIN";
}

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseUtcDateTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseSubmittedDateTime(formData: FormData, localKey: string, utcKey: string, timezone: string) {
  return parseUtcDateTime(requireString(formData, utcKey)) ?? parseLocalDateTimeInZone(requireString(formData, localKey), timezone);
}

function isTooSoon(date: Date) {
  return date.getTime() < Date.now() + MIN_SESSION_LEAD_TIME_MS;
}

function formError(error: NonNullable<CourseLiveSessionFormState["error"]>): CourseLiveSessionFormState {
  return { status: "error", error };
}

async function ensureScheduleAttendee(eventId: string, userId: string) {
  const attendee = await db.scheduleEventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { id: true },
  });

  if (attendee) return attendee;

  return db.scheduleEventAttendee.create({
    data: { eventId, userId, status: "INVITED" },
    select: { id: true },
  });
}

async function requireEditableLiveSession(sessionId: string, userId: string) {
  return db.scheduleEvent.findFirst({
    where: {
      id: sessionId,
      type: "LIVE_SESSION",
      OR: [
        { createdById: userId },
        { course: { instructorId: userId } },
        { course: { instructors: { some: { userId } } } },
      ],
    },
    select: {
      id: true,
      status: true,
      courseId: true,
      title: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      meetingUrl: true,
      meetingProvider: true,
      meetingStatus: true,
      startedAt: true,
      startedById: true,
      endedAt: true,
      endedById: true,
      course: { select: { title: true } },
    },
  });
}

function isSessionEnded(session: { status: string; endedAt?: Date | null; endsAt?: Date | null }) {
  return session.status === "COMPLETED" || Boolean(session.endedAt) || Boolean(session.endsAt && session.endsAt < new Date());
}

async function notifyCourseStudents({
  courseId,
  eventId,
  title,
  body,
  email,
}: {
  courseId: string | null;
  eventId: string;
  title: string;
  body: string;
  email?: {
    updateLabel: string;
    sessionTitle: string;
    message: string;
  };
}) {
  if (!courseId) return;

  const enrollments = await db.enrollment.findMany({
    where: { courseId, status: "ACTIVE" },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  const userIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.userId)));
  if (userIds.length === 0) return;

  for (const enrollment of enrollments) {
    const userId = enrollment.userId;
    await ensureScheduleAttendee(eventId, userId);

    await createNotification(userId, "SYSTEM", title, body, {
      href: "/dashboard/schedule",
      eventId,
      courseId,
      kind: "LIVE_SESSION",
    });

    if (email && enrollment.user.email) {
      await queueLiveSessionUpdateEmail({
        recipientUserId: userId,
        recipientEmail: enrollment.user.email,
        recipientName: enrollment.user.name,
        updateLabel: email.updateLabel,
        sessionTitle: email.sessionTitle,
        message: email.message,
      });
    }
  }
}

export async function createCourseLiveSessionAction(
  _previousState: CourseLiveSessionFormState,
  formData: FormData
): Promise<CourseLiveSessionFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!isPrivilegedInstructorRole(session.user.role)) redirect("/dashboard");

  const courseId = requireString(formData, "courseId");
  const title = requireString(formData, "title");
  const description = requireString(formData, "description");
  const timezone = normalizeScheduleTimeZone(requireString(formData, "timezone") || DEFAULT_SCHEDULE_TIME_ZONE);
  const startsAt = parseSubmittedDateTime(formData, "startsAt", "startsAtUtc", timezone);
  const endsAt = parseSubmittedDateTime(formData, "endsAt", "endsAtUtc", timezone);
  const shouldGenerateMeet = requireString(formData, "autoGenerateMeet") === "1";

  if (!courseId || !title || !startsAt) return formError("missing-fields");

  if (!shouldGenerateMeet) return formError("calendar-required");

  if (endsAt && endsAt <= startsAt) return formError("invalid-time");

  if (isTooSoon(startsAt)) return formError("lead-time");

  const course = await db.course.findFirst({
    where: {
      id: courseId,
      OR: [
        { instructorId: session.user.id },
        { instructors: { some: { userId: session.user.id } } },
      ],
    },
    select: { id: true, title: true },
  });

  if (!course) return formError("course-access");

  const liveSession = await db.scheduleEvent.create({
    data: {
      type: "LIVE_SESSION",
      title,
      description: description || null,
      startsAt,
      endsAt,
      timezone,
      meetingProvider: "GOOGLE_MEET",
      meetingStatus: "PENDING",
      status: "SCHEDULED",
      audience: "COURSE_ENROLLEES",
      courseId: course.id,
      createdById: session.user.id,
    },
    select: { id: true, title: true, description: true, startsAt: true, endsAt: true, timezone: true, courseId: true },
  });

  if (shouldGenerateMeet) {
    const googleConnection = await getConnectedGoogleCalendar(session.user.id);
    if (googleConnection) {
      await createGoogleMeetForScheduleEvent({
        connection: googleConnection,
        event: liveSession,
        courseTitle: course.title,
      }).catch(async (error) => {
        await db.scheduleEvent.update({
          where: { id: liveSession.id },
          data: {
            meetingProvider: "GOOGLE_MEET",
            meetingStatus: "FAILED",
            metadata: {
              googleMeetError: error instanceof Error ? error.message : "Unable to generate Google Meet link.",
            },
          },
        });
      });
    } else {
      await db.scheduleEvent.update({
        where: { id: liveSession.id },
        data: {
          meetingProvider: "GOOGLE_MEET",
          meetingStatus: "FAILED",
          metadata: {
            googleMeetError: "Google Calendar is not connected.",
          },
        },
      });
    }
  }

  await notifyCourseStudents({
    courseId: liveSession.courseId,
    eventId: liveSession.id,
    title: "New live session scheduled",
    body: `${liveSession.title} starts ${formatScheduleDateTime(liveSession.startsAt, liveSession.timezone)}.`,
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/instructor/live-sessions");
  redirect("/dashboard/instructor/live-sessions?created=1");
}

export async function updateCourseLiveSessionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!isPrivilegedInstructorRole(session.user.role)) redirect("/dashboard");

  const sessionId = requireString(formData, "sessionId");
  const title = requireString(formData, "title");
  const description = requireString(formData, "description");
  const timezone = normalizeScheduleTimeZone(requireString(formData, "timezone") || DEFAULT_SCHEDULE_TIME_ZONE);
  const startsAt = parseSubmittedDateTime(formData, "startsAt", "startsAtUtc", timezone);
  const endsAt = parseSubmittedDateTime(formData, "endsAt", "endsAtUtc", timezone);
  const meetingUrlInput = requireString(formData, "meetingUrl");
  const meetingUrl = parseOptionalUrl(meetingUrlInput);

  if (!sessionId || !title || !startsAt) {
    redirect("/dashboard/instructor/live-sessions?error=missing-fields");
  }

  if (meetingUrlInput && !meetingUrl) {
    redirect("/dashboard/instructor/live-sessions?error=invalid-url");
  }

  if (endsAt && endsAt <= startsAt) {
    redirect("/dashboard/instructor/live-sessions?error=invalid-time");
  }

  if (isTooSoon(startsAt)) {
    redirect("/dashboard/instructor/live-sessions?error=lead-time");
  }

  const liveSession = await requireEditableLiveSession(sessionId, session.user.id);
  if (!liveSession) redirect("/dashboard/instructor/live-sessions?error=session-access");
  if (liveSession.status === "CANCELLED") redirect("/dashboard/instructor/live-sessions?error=cancelled-session");
  if (isSessionEnded(liveSession)) redirect("/dashboard/instructor/live-sessions?error=completed-session");
  if (liveSession.startedAt) redirect("/dashboard/instructor/live-sessions?error=started-session");

  const startsChanged = liveSession.startsAt.getTime() !== startsAt.getTime();
  const endsChanged = (liveSession.endsAt?.getTime() ?? null) !== (endsAt?.getTime() ?? null);
  const meetingUrlChanged = Boolean(meetingUrlInput) && liveSession.meetingUrl !== meetingUrl;
  const shouldEmailStudents = startsChanged || endsChanged || meetingUrlChanged;
  const formattedStart = formatScheduleDateTime(startsAt, timezone);

  const updatedSession = await db.scheduleEvent.update({
    where: { id: liveSession.id },
    data: {
      title,
      description: description || null,
      startsAt,
      endsAt,
      timezone,
      meetingUrl,
      meetingProvider: meetingUrl ? "MANUAL" : liveSession.meetingProvider,
      meetingStatus: meetingUrl ? "READY" : liveSession.meetingStatus,
      status: "SCHEDULED",
    },
    select: { id: true, title: true, startsAt: true, timezone: true, courseId: true },
  });

  const reminderAttendees = await db.scheduleEventAttendee.findMany({
    where: {
      eventId: updatedSession.id,
      reminderEnabled: true,
      status: { not: "CANCELLED" },
    },
    select: { id: true },
  });

  for (const attendee of reminderAttendees) {
    await queueScheduleReminders(attendee.id);
  }

  await notifyCourseStudents({
    courseId: updatedSession.courseId,
    eventId: updatedSession.id,
    title: "Live session updated",
    body: shouldEmailStudents
      ? `${updatedSession.title} now starts ${formatScheduleDateTime(updatedSession.startsAt, updatedSession.timezone)}.`
      : `Details for ${updatedSession.title} have been updated.`,
    email: shouldEmailStudents
      ? {
          updateLabel: "Live session updated",
          sessionTitle: updatedSession.title,
          message: `it now starts ${formattedStart}.`,
        }
      : undefined,
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/instructor/live-sessions");
  redirect("/dashboard/instructor/live-sessions?updated=1");
}

export async function cancelCourseLiveSessionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!isPrivilegedInstructorRole(session.user.role)) redirect("/dashboard");

  const sessionId = requireString(formData, "sessionId");
  if (!sessionId) redirect("/dashboard/instructor/live-sessions?error=missing-fields");

  const liveSession = await requireEditableLiveSession(sessionId, session.user.id);
  if (!liveSession) redirect("/dashboard/instructor/live-sessions?error=session-access");
  if (isSessionEnded(liveSession)) redirect("/dashboard/instructor/live-sessions?error=completed-session");

  const cancelledSession = await db.scheduleEvent.update({
    where: { id: liveSession.id },
    data: { status: "CANCELLED" },
    select: { id: true, title: true, courseId: true },
  });

  await cancelEventScheduleReminders(cancelledSession.id);

  await notifyCourseStudents({
    courseId: cancelledSession.courseId,
    eventId: cancelledSession.id,
    title: "Live session cancelled",
    body: `${cancelledSession.title} has been cancelled by the instructor.`,
    email: {
      updateLabel: "Live session cancelled",
      sessionTitle: cancelledSession.title,
      message: "the instructor has cancelled this session.",
    },
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/instructor/live-sessions");
  redirect("/dashboard/instructor/live-sessions?cancelled=1");
}

export async function startCourseLiveSessionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!isPrivilegedInstructorRole(session.user.role)) redirect("/dashboard");

  const sessionId = requireString(formData, "sessionId");
  if (!sessionId) redirect("/dashboard/instructor/live-sessions?error=missing-fields");

  const liveSession = await requireEditableLiveSession(sessionId, session.user.id);
  if (!liveSession) redirect("/dashboard/instructor/live-sessions?error=session-access");
  if (liveSession.status === "CANCELLED") redirect("/dashboard/instructor/live-sessions?error=cancelled-session");
  if (isSessionEnded(liveSession)) redirect("/dashboard/instructor/live-sessions?error=completed-session");
  if (!liveSession.meetingUrl) redirect("/dashboard/instructor/live-sessions?error=missing-meeting-url");
  if (liveSession.startsAt.getTime() > Date.now() + JOIN_WINDOW_BEFORE_MS) {
    redirect("/dashboard/instructor/live-sessions?error=start-too-early");
  }

  const startedSession = await db.scheduleEvent.update({
    where: { id: liveSession.id },
    data: {
      startedAt: liveSession.startedAt ?? new Date(),
      startedById: liveSession.startedById ?? session.user.id,
      endedAt: null,
      endedById: null,
    },
    select: { id: true, title: true, courseId: true, meetingUrl: true },
  });

  await notifyCourseStudents({
    courseId: startedSession.courseId,
    eventId: startedSession.id,
    title: "Live session has started",
    body: `${startedSession.title} is live now. Open your schedule to join the session.`,
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/instructor/live-sessions");
  redirect("/dashboard/instructor/live-sessions?started=1");
}

export async function endCourseLiveSessionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!isPrivilegedInstructorRole(session.user.role)) redirect("/dashboard");

  const sessionId = requireString(formData, "sessionId");
  if (!sessionId) redirect("/dashboard/instructor/live-sessions?error=missing-fields");

  const liveSession = await requireEditableLiveSession(sessionId, session.user.id);
  if (!liveSession) redirect("/dashboard/instructor/live-sessions?error=session-access");
  if (liveSession.status === "CANCELLED") redirect("/dashboard/instructor/live-sessions?error=cancelled-session");
  if (!liveSession.startedAt) redirect("/dashboard/instructor/live-sessions?error=session-not-started");
  if (isSessionEnded(liveSession)) redirect("/dashboard/instructor/live-sessions?error=completed-session");

  await db.scheduleEvent.update({
    where: { id: liveSession.id },
    data: {
      status: "COMPLETED",
      endedAt: liveSession.endedAt ?? new Date(),
      endedById: liveSession.endedById ?? session.user.id,
    },
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/instructor/live-sessions");
  redirect("/dashboard/instructor/live-sessions?ended=1");
}
