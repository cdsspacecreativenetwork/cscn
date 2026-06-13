"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { CourseLiveSessionForm } from "@/components/dashboard/instructor/CourseLiveSessionForm";
import { LiveSessionList } from "@/components/dashboard/instructor/LiveSessionList";
import type { CalendarIntegrationStatus } from "@/data/integrations";

type InstructorCourseOption = {
  id: string;
  title: string;
  status: string;
};

type InstructorLiveSession = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  meetingUrl: string | null;
  courseTitle: string;
  enrolledStudents: number;
};

function errorMessage(error?: string) {
  if (error === "missing-fields") return "Choose a course, title, and start time before scheduling.";
  if (error === "invalid-url") return "Use a valid meeting link that starts with http:// or https://.";
  if (error === "invalid-time") return "End time must be after the start time.";
  if (error === "lead-time") return "Schedule sessions at least 30 minutes from now so students have enough time to be notified.";
  if (error === "course-access") return "You can only create sessions for courses you own or teach.";
  if (error === "calendar-required") return "Connect Google Calendar before scheduling live sessions so CSCN can generate the Meet link.";
  if (error === "session-access") return "You can only manage sessions for courses you own or teach.";
  if (error === "cancelled-session") return "Cancelled sessions cannot be edited. Create a new session instead.";
  if (error === "completed-session") return "Completed sessions cannot be edited or cancelled.";
  if (error === "started-session") return "A session that has started cannot be edited. End it or create a follow-up session.";
  if (error === "missing-meeting-url") return "Add a meeting link before starting this session.";
  if (error === "start-too-early") return "You can start a session from 15 minutes before the scheduled time.";
  if (error === "session-not-started") return "Only started sessions can be ended manually.";
  return null;
}

export function LiveSessionsManager({
  courses,
  sessions,
  integrations,
  defaultTimezone,
  error,
  created,
  updated,
  cancelled,
  started,
  ended,
}: {
  courses: InstructorCourseOption[];
  sessions: InstructorLiveSession[];
  integrations: CalendarIntegrationStatus;
  defaultTimezone: string;
  error?: string;
  created?: boolean;
  updated?: boolean;
  cancelled?: boolean;
  started?: boolean;
  ended?: boolean;
}) {
  const message = errorMessage(error);
  const successMessage =
    (created && "Live session scheduled. Enrolled students can now see it on their calendar.") ||
    (updated && "Live session updated. Students have been notified.") ||
    (cancelled && "Live session cancelled. Students have been notified.") ||
    (started && "Live session started. Students can now join from their schedule.") ||
    (ended && "Live session ended and moved to completed history.") ||
    null;
  const activeSessionCount = sessions.filter((session) => {
    const endsAt = session.endsAt ? new Date(session.endsAt).getTime() : new Date(session.startsAt).getTime() + 60 * 60 * 1000;
    return session.status !== "CANCELLED" && session.status !== "COMPLETED" && !session.endedAt && endsAt >= Date.now();
  }).length;

  useEffect(() => {
    if (message) toast.error(message);
  }, [message]);

  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, [successMessage]);

  return (
    <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-8 p-[clamp(16px,2.78vw,48px)] pb-24 font-jakarta">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#040B37] lg:text-[32px]">
              Live Sessions
            </h1>
            <p className="mt-2 max-w-[760px] text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
              Schedule course-linked live classes for enrolled students. Students see these sessions automatically on their schedule calendar.
            </p>
          </div>
          <div className="rounded-[14px] border border-[#E3E8F4] bg-white px-5 py-4 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Upcoming sessions</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#040B37]">{activeSessionCount}</p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
        <CourseLiveSessionForm
          courses={courses}
          defaultTimezone={defaultTimezone}
          googleCalendarConnected={integrations.googleCalendar.connected}
        />

        <LiveSessionList sessions={sessions} />
      </div>
    </div>
  );
}
