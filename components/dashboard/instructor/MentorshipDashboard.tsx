"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  Mail,
  MessageSquareText,
  PauseCircle,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import {
  acceptMentorBookingRescheduleAction,
  cancelMentorBookingAction,
  declineMentorBookingRescheduleAction,
  markMentorBookingCompletedAction,
  requestMentorBookingRescheduleAction,
} from "@/actions/mentor-bookings";
import {
  createMentorAvailabilityAction,
  setMentorAvailabilityStatusAction,
  submitMentorshipApplicationAction,
  updateMentorshipSettingsAction,
  withdrawMentorshipApplicationAction,
} from "@/actions/mentorship";
import Button from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ScheduleDatePicker } from "@/components/dashboard/instructor/ScheduleDatePicker";
import { ScheduleTimeCombobox } from "@/components/dashboard/instructor/ScheduleTimeCombobox";
import {
  buildMentorBookingSlotsForDate,
  hasMentorAvailabilityOnDate,
  mentorBookingDateKey,
  type MentorAvailabilityInput,
} from "@/lib/mentor-booking-slots";
import { WEEKDAYS } from "@/lib/mentorship-constants";
import {
  DEFAULT_SCHEDULE_TIME_ZONE,
  getSupportedScheduleTimeZones,
  normalizeScheduleTimeZone,
} from "@/lib/schedule-time";

type MentorshipProfile = {
  id: string;
  name: string | null;
  timezone: string | null;
  mentorshipEligible: boolean;
  mentorshipEnabled: boolean;
  mentorshipApprovedAt: string | null;
  mentorshipFree: boolean;
  mentorshipPrice: string | null;
  mentorshipCurrency: string;
  mentorshipBio: string | null;
  mentorshipTopics: string[];
  mentorshipInstructions: string | null;
};

type Availability = {
  id: string;
  type: "WEEKLY" | "DATE";
  weekday: number | null;
  date: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  sessionDuration: number;
  bufferMinutes: number;
  maxBookings: number;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  bookings?: Array<{ startsAt: string | Date; status: string }>;
};

type Booking = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  topic: string | null;
  studentNote: string | null;
  rescheduleRequestedById: string | null;
  rescheduleRequestedAt: string | null;
  proposedStartsAt: string | null;
  proposedEndsAt: string | null;
  proposedTimezone: string | null;
  rescheduleNote: string | null;
  rescheduleRespondedAt: string | null;
  rescheduleResponseNote: string | null;
  price: string | null;
  currency: string;
  meetingUrl: string | null;
  scheduleEventId: string | null;
  student: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

type MentorshipApplication = {
  id: string;
  status: string;
  pitch: string | null;
  audience: string | null;
  topics: string[];
  sessionTypes: string[];
  mentorshipFree: boolean;
  proposedPrice: string | null;
  proposedCurrency: string;
  instructions: string | null;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

type BookingAction = "complete" | "cancel" | "request-reschedule" | "accept-reschedule" | "decline-reschedule";

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function availabilityLabel(slot: Availability) {
  if (slot.type === "DATE" && slot.date) return new Date(`${slot.date}T00:00:00`).toLocaleDateString();
  return WEEKDAYS[slot.weekday ?? 1];
}

function buildTimeOptions() {
  return Array.from({ length: 96 }, (_, index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return { value, label: timeLabel(value) };
  });
}

function bookingDateLabel(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function bookingPriceLabel(booking: Booking) {
  const amount = Number(booking.price ?? 0);
  if (amount <= 0) return "Free";
  return `${booking.currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function bookingTimeRangeLabel(booking: Booking) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: booking.timezone,
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(booking.startsAt))} - ${formatter.format(new Date(booking.endsAt))}`;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMinutesToTime(value: string, minutesToAdd: number) {
  if (!value || !Number.isFinite(minutesToAdd)) return "";
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";
  const date = new Date();
  date.setHours(hour, minute + minutesToAdd, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function bookingStatusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function bookingStatusTone(status: string) {
  if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-700";
  if (status === "AWAITING_COMPLETION") return "bg-amber-50 text-amber-700";
  if (status === "DISPUTED") return "bg-red-50 text-red-600";
  if (status === "RESCHEDULE_REQUESTED") return "bg-[#1C4ED1]/5 text-[#1C4ED1]";
  return "bg-[#F4F6FB] text-[#4B5563]";
}

function studentName(booking: Booking) {
  return booking.student?.name || booking.student?.email || "Learner";
}

function studentInitials(booking: Booking) {
  const source = studentName(booking);
  const parts = source.split(/[.\s@_-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "L").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function SubmitButton({
  children,
  variant = "primary",
  className = "w-full py-3",
}: {
  children: ReactNode;
  variant?: "primary" | "outline" | "secondary";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} rounded="md" loading={pending} disabled={pending} className={className}>
      {children}
    </Button>
  );
}

function IconSubmitButton({
  children,
  label,
  tone = "default",
}: {
  children: ReactNode;
  label: string;
  tone?: "default" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-[10px] border bg-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "border-red-100 text-red-500 hover:border-red-200 hover:bg-red-50"
          : "border-[#D8E0EF] text-[#4B5563] hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
      }`}
    >
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  );
}

export function MentorshipDashboard({
  profile,
  availability,
  upcomingBookings,
  latestApplication,
  error,
  updated,
}: {
  profile: MentorshipProfile;
  availability: Availability[];
  upcomingBookings: Booking[];
  latestApplication: MentorshipApplication | null;
  error?: string;
  updated?: boolean;
}) {
  const router = useRouter();
  const [mentorshipFree, setMentorshipFree] = useState(profile.mentorshipFree);
  const [availabilityType, setAvailabilityType] = useState<"WEEKLY" | "DATE">("WEEKLY");
  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState(() => normalizeScheduleTimeZone(profile.timezone || DEFAULT_SCHEDULE_TIME_ZONE));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingAction, setBookingAction] = useState<Exclude<BookingAction, "complete" | "accept-reschedule"> | null>(null);
  const [bookingNote, setBookingNote] = useState("");
  const [bookingProposedDate, setBookingProposedDate] = useState("");
  const [bookingProposedTime, setBookingProposedTime] = useState("");
  const [actionPending, startBookingActionTransition] = useTransition();
  const timezoneOptions = useMemo(
    () => getSupportedScheduleTimeZones().map((timeZone) => ({ value: timeZone.value, label: timeZone.label })),
    []
  );
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const activeAvailabilityWindows = useMemo(
    () => availability.filter((slot) => slot.status === "ACTIVE") as MentorAvailabilityInput[],
    [availability]
  );
  const bookingRescheduleSlots = useMemo(() => {
    if (!bookingProposedDate) return [];
    return buildMentorBookingSlotsForDate(activeAvailabilityWindows, new Date(`${bookingProposedDate}T00:00:00`));
  }, [activeAvailabilityWindows, bookingProposedDate]);
  const bookingRescheduleTimeOptions = useMemo(
    () => bookingRescheduleSlots.map((slot) => ({ value: slot.timeValue, label: `${slot.timeLabel} (${slot.durationLabel})` })),
    [bookingRescheduleSlots]
  );
  const isBookingProposedTimeAvailable = useMemo(
    () => Boolean(bookingProposedTime && bookingRescheduleTimeOptions.some((option) => option.value === bookingProposedTime)),
    [bookingProposedTime, bookingRescheduleTimeOptions]
  );
  const selectedBookingDurationMinutes = useMemo(() => {
    if (!selectedBooking?.startsAt || !selectedBooking.endsAt) return 0;
    return Math.max(0, Math.round((new Date(selectedBooking.endsAt).getTime() - new Date(selectedBooking.startsAt).getTime()) / 60_000));
  }, [selectedBooking]);

  const activeAvailability = availability.filter((slot) => slot.status === "ACTIVE").length;
  const confirmedBookings = upcomingBookings.filter((booking) =>
    ["CONFIRMED", "AWAITING_COMPLETION", "RESCHEDULE_REQUESTED", "DISPUTED"].includes(booking.status)
  );
  const pendingPaymentBookings = upcomingBookings.filter((booking) => booking.status === "PENDING");

  const runBookingAction = (actionOverride?: BookingAction) => {
    const action = actionOverride ?? bookingAction;
    if (!selectedBooking || !action) return;

    const formData = new FormData();
    formData.set("bookingId", selectedBooking.id);
    if (action === "cancel") formData.set("reason", bookingNote);
    if (action === "request-reschedule") {
      formData.set("note", bookingNote);
      formData.set("proposedDate", bookingProposedDate);
      formData.set("proposedTime", bookingProposedTime);
      formData.set("timezone", selectedBooking.timezone || timezone);
    }
    if (action === "decline-reschedule") formData.set("note", bookingNote);

    startBookingActionTransition(async () => {
      const result =
        action === "complete"
          ? await markMentorBookingCompletedAction(formData)
          : action === "cancel"
            ? await cancelMentorBookingAction(formData)
            : action === "request-reschedule"
              ? await requestMentorBookingRescheduleAction(formData)
              : action === "accept-reschedule"
                ? await acceptMentorBookingRescheduleAction(formData)
                : action === "decline-reschedule"
                  ? await declineMentorBookingRescheduleAction(formData)
                  : await cancelMentorBookingAction(formData);

      if (result.error) return;

      setBookingAction(null);
      setBookingNote("");
      setBookingProposedDate("");
      setBookingProposedTime("");
      setSelectedBooking(null);
      router.refresh();
    });
  };

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingAction(null);
    setBookingNote("");
    setBookingProposedDate("");
    setBookingProposedTime("");
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
    setBookingAction(null);
    setBookingNote("");
    setBookingProposedDate("");
    setBookingProposedTime("");
  };

  const isBookingRescheduleDateAvailable = (date: Date) => {
    if (activeAvailabilityWindows.length === 0) return false;
    if (mentorBookingDateKey(date) < toDateInputValue(new Date())) return false;
    return hasMentorAvailabilityOnDate(activeAvailabilityWindows, date);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {/* <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#1C4ED1]/5 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#1C4ED1]">
            <GraduationCap size={14} strokeWidth={1.9} />
            Mentor workspace
          </span> */}
          <h1 className="mt-3 text-[26px] font-black tracking-[-0.04em] text-[#040B37] lg:text-[32px]">
            Mentorship
          </h1>
          <p className="mt-2 max-w-[760px] text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
            Control your mentorship profile, session pricing, availability windows, and upcoming bookings from one focused workspace.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
          <div className="rounded-[14px] border border-[#E3E8F4] bg-white px-5 py-4 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Active windows</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#040B37]">{activeAvailability}</p>
          </div>
          <div className="rounded-[14px] border border-[#E3E8F4] bg-white px-5 py-4 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Upcoming</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#040B37]">{confirmedBookings.length}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
          {error === "not-eligible"
            ? "Admin needs to approve your profile for mentorship before you can accept bookings."
            : error === "application-required"
              ? "Add your mentorship pitch and at least one topic before submitting."
              : error === "application-pending"
                ? "Your latest mentorship application is already waiting for admin review."
            : "We could not save that mentorship update. Please review the fields and try again."}
        </div>
      )}
      {updated && (
        <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700">
          Mentorship settings updated.
        </div>
      )}

      {!profile.mentorshipEligible ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
          <div className="rounded-[22px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#040B37]">
                Apply to become a mentor
              </h2>
              <p className="mt-2 max-w-[720px] text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
                CSCN reviews mentor applications before instructors can accept 1:1 bookings. Approval gives you eligibility; you still control when you open availability.
              </p>
              {latestApplication && (
                <div className="mt-5 rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${
                      latestApplication.status === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : latestApplication.status === "REJECTED"
                          ? "bg-red-50 text-red-600"
                          : "bg-[#1C4ED1]/5 text-[#1C4ED1]"
                    }`}>
                      {latestApplication.status.replaceAll("_", " ").toLowerCase()}
                    </span>
                    <span className="text-[12px] font-bold text-[#9CA3AF]">
                      Submitted {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(latestApplication.submittedAt))}
                    </span>
                  </div>
                  {latestApplication.reviewNote && (
                    <div className="mt-4 rounded-[12px] border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-amber-700">Admin feedback</p>
                      <p className="mt-1 text-[13px] font-semibold leading-relaxed text-[#4B5563]">{latestApplication.reviewNote}</p>
                    </div>
                  )}
                  {latestApplication.status === "PENDING" && (
                    <form action={withdrawMentorshipApplicationAction} className="mt-4">
                      <input type="hidden" name="applicationId" value={latestApplication.id} />
                      <SubmitButton variant="outline" className="w-full border-red-200 py-3 text-red-600">
                        Withdraw application
                      </SubmitButton>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {latestApplication?.status !== "PENDING" && (
            <form action={submitMentorshipApplicationAction} className="rounded-[22px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
              <h3 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">
                {latestApplication ? "Update and resubmit" : "Mentorship application"}
              </h3>
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Keep this concise. Admin needs to understand who you can help and why learners should trust you.</p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">What can you help learners with?</span>
                  <textarea
                    name="pitch"
                    rows={4}
                    defaultValue={latestApplication?.pitch ?? profile.mentorshipBio ?? ""}
                    placeholder="I help early-stage designers and founders sharpen portfolio storytelling, product strategy, and launch decisions."
                    className="mt-2 min-h-[112px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                </label>
                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">Who is this best for?</span>
                  <input
                    name="audience"
                    defaultValue={latestApplication?.audience ?? ""}
                    placeholder="Beginners, junior designers, founders, career switchers..."
                    className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                </label>
                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">Topics</span>
                  <input
                    name="topics"
                    defaultValue={latestApplication?.topics.join(", ") || profile.mentorshipTopics.join(", ")}
                    placeholder="Portfolio review, Product strategy, Frontend debugging"
                    className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                </label>
                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">Session styles</span>
                  <input
                    name="sessionTypes"
                    defaultValue={latestApplication?.sessionTypes.join(", ") ?? ""}
                    placeholder="Portfolio review, Career advice, Project feedback"
                    className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                </label>
                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">Booking instructions</span>
                  <textarea
                    name="instructions"
                    rows={3}
                    defaultValue={latestApplication?.instructions ?? profile.mentorshipInstructions ?? ""}
                    placeholder="Come with your portfolio link, questions, and current project context."
                    className="mt-2 min-h-[96px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                  <label className="flex items-center gap-3 rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFC] px-4 py-3">
                    <input type="checkbox" name="mentorshipFree" defaultChecked={latestApplication?.mentorshipFree ?? true} className="h-5 w-5 accent-[#1C4ED1]" />
                    <span className="text-[13px] font-black text-[#040B37]">Free</span>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                    <input
                      name="proposedCurrency"
                      maxLength={3}
                      defaultValue={latestApplication?.proposedCurrency ?? profile.mentorshipCurrency}
                      className="h-14 rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold uppercase text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                    />
                    <input
                      name="proposedPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={latestApplication?.proposedPrice ?? profile.mentorshipPrice ?? ""}
                      placeholder="Proposed price"
                      className="h-14 rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                    />
                  </div>
                </div>
                <SubmitButton>
                  Submit application
                </SubmitButton>
              </div>
            </form>
          )}
          {latestApplication?.status === "PENDING" && (
            <div className="rounded-[22px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
              <span className="inline-flex rounded-full bg-amber-50 px-4 py-2 text-[12px] font-black uppercase tracking-[0.08em] text-amber-700">
                Waiting for admin review
              </span>
              <h3 className="mt-4 text-[20px] font-black text-[#040B37]">Your application is in the queue</h3>
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
                You will get an in-app notification when CSCN approves it, requests changes, or rejects it with feedback.
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,560px)_1fr]">
            <form action={updateMentorshipSettingsAction} className="rounded-[22px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Mentorship settings</h2>
                  <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Set what learners need to know before booking you.</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-700">
                  Eligible
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <label className="flex items-center justify-between gap-4 rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFC] px-4 py-3">
                  <span>
                    <span className="block text-[14px] font-black text-[#040B37]">Show me as open for mentorship</span>
                    <span className="text-[12px] font-semibold text-[#9CA3AF]">You only appear publicly when this is on and you have active availability.</span>
                  </span>
                  <input
                    type="checkbox"
                    name="mentorshipEnabled"
                    defaultChecked={profile.mentorshipEnabled}
                    className="h-5 w-5 accent-[#1C4ED1]"
                  />
                </label>

                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">Mentorship intro</span>
                  <textarea
                    name="mentorshipBio"
                    rows={4}
                    defaultValue={profile.mentorshipBio ?? ""}
                    placeholder="Example: I help early-stage designers and founders sharpen product strategy, portfolio storytelling, and launch decisions."
                    className="mt-2 min-h-[112px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                  <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">Your full profile bio still lives on your public profile. This is the short booking-specific promise.</p>
                </label>

                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">Topics</span>
                  <input
                    name="mentorshipTopics"
                    defaultValue={profile.mentorshipTopics.join(", ")}
                    placeholder="Portfolio review, Product strategy, Frontend debugging"
                    className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                  <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">Separate topics with commas.</p>
                </label>

                <label className="block">
                  <span className="text-[14px] font-bold text-[#040B37]">Booking instructions</span>
                  <textarea
                    name="mentorshipInstructions"
                    rows={4}
                    defaultValue={profile.mentorshipInstructions ?? ""}
                    placeholder="Example: Come with your portfolio link, questions, and current project context."
                    className="mt-2 min-h-[110px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFC] px-4 py-3">
                  <span>
                    <span className="block text-[14px] font-black text-[#040B37]">Offer free sessions</span>
                    <span className="text-[12px] font-semibold text-[#9CA3AF]">Disable this to set a paid session price.</span>
                  </span>
                  <input
                    type="checkbox"
                    name="mentorshipFree"
                    checked={mentorshipFree}
                    onChange={(event) => setMentorshipFree(event.target.checked)}
                    className="h-5 w-5 accent-[#1C4ED1]"
                  />
                </label>

                {!mentorshipFree && (
                  <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                    <label className="block">
                      <span className="text-[14px] font-bold text-[#040B37]">Currency</span>
                      <input
                        name="mentorshipCurrency"
                        maxLength={3}
                        defaultValue={profile.mentorshipCurrency}
                        className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold uppercase text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[14px] font-bold text-[#040B37]">Session price</span>
                      <input
                        name="mentorshipPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={profile.mentorshipPrice ?? ""}
                        className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                      />
                    </label>
                  </div>
                )}

                <SubmitButton>
                  Save mentorship settings
                </SubmitButton>
              </div>
            </form>

            <div className="space-y-6">
              <form action={createMentorAvailabilityAction} className="rounded-[22px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
                <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Add availability</h2>
                <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Create windows learners can book from later.</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <span className="text-[14px] font-bold text-[#040B37]">Availability type</span>
                    <CustomSelect
                      options={[
                        { value: "WEEKLY", label: "Weekly recurring" },
                        { value: "DATE", label: "Specific date" },
                      ]}
                      value={availabilityType}
                      onChange={(value) => setAvailabilityType(value as "WEEKLY" | "DATE")}
                      className="mt-2 w-full"
                      triggerClassName="!h-14 !border-[#D8E0EF]"
                    />
                    <input type="hidden" name="type" value={availabilityType} />
                  </div>

                  {availabilityType === "WEEKLY" ? (
                    <div>
                      <span className="text-[14px] font-bold text-[#040B37]">Day of week</span>
                      <CustomSelect
                        options={WEEKDAYS.map((day, index) => ({ value: String(index), label: day }))}
                        value={weekday}
                        onChange={setWeekday}
                        className="mt-2 w-full"
                        triggerClassName="!h-14 !border-[#D8E0EF]"
                      />
                      <input type="hidden" name="weekday" value={weekday} />
                    </div>
                  ) : (
                    <label className="block">
                      <span className="text-[14px] font-bold text-[#040B37]">Date</span>
                      <input
                        name="date"
                        type="date"
                        className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                      />
                    </label>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-[14px] font-bold text-[#040B37]">Start time</span>
                      <ScheduleTimeCombobox
                        value={startTime}
                        onChange={setStartTime}
                        options={timeOptions}
                        placeholder="Select start time"
                      />
                      <input type="hidden" name="startTime" value={startTime} />
                    </div>
                    <div>
                      <span className="text-[14px] font-bold text-[#040B37]">End time</span>
                      <ScheduleTimeCombobox
                        value={endTime}
                        onChange={setEndTime}
                        options={timeOptions}
                        placeholder="Select end time"
                      />
                      <input type="hidden" name="endTime" value={endTime} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[14px] font-bold text-[#040B37]">Timezone</span>
                    <CustomSelect
                      options={timezoneOptions}
                      value={timezone}
                      onChange={setTimezone}
                      searchable
                      className="mt-2 w-full"
                      triggerClassName="!h-14 !border-[#D8E0EF]"
                    />
                    <input type="hidden" name="timezone" value={timezone} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-[13px] font-bold text-[#040B37]">Duration</span>
                      <input name="sessionDuration" type="number" min="15" max="180" defaultValue={45} className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10" />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-[#040B37]">Buffer</span>
                      <input name="bufferMinutes" type="number" min="0" max="60" defaultValue={10} className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10" />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-[#040B37]">Max</span>
                      <input name="maxBookings" type="number" min="1" max="12" defaultValue={1} className="mt-2 h-14 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10" />
                    </label>
                  </div>

                  <SubmitButton>
                    Add availability window
                  </SubmitButton>
                </div>
              </form>

            </div>
          </section>

          <section className="rounded-[22px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Availability windows</h2>
                <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">These windows will power the public booking engine in the next phase.</p>
              </div>
            </div>

            {availability.length === 0 ? (
              <div className="mt-5 rounded-[16px] border border-dashed border-[#D8E0EF] bg-[#F8FAFC] px-4 py-10 text-center">
                <CalendarDays className="mx-auto text-[#1C4ED1]" size={34} strokeWidth={1.8} />
                <p className="mt-3 text-[14px] font-bold text-[#040B37]">No availability yet</p>
                <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">Add your first weekly or one-off availability window.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {availability.map((slot) => (
                  <article key={slot.id} className="rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${slot.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {slot.status}
                        </span>
                        <h3 className="mt-3 text-[16px] font-black text-[#040B37]">{availabilityLabel(slot)}</h3>
                        <p className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-[#4B5563]">
                          <Clock3 size={15} strokeWidth={1.9} />
                          {timeLabel(slot.startTime)} - {timeLabel(slot.endTime)}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                          {slot.sessionDuration} min sessions | {slot.bufferMinutes} min buffer | {slot.maxBookings} max bookings
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <form action={setMentorAvailabilityStatusAction}>
                          <input type="hidden" name="availabilityId" value={slot.id} />
                          <input type="hidden" name="status" value={slot.status === "ACTIVE" ? "PAUSED" : "ACTIVE"} />
                          <IconSubmitButton label={slot.status === "ACTIVE" ? "Pause availability" : "Reactivate availability"}>
                            {slot.status === "ACTIVE" ? <PauseCircle size={17} /> : <CheckCircle2 size={17} />}
                          </IconSubmitButton>
                        </form>
                        <form action={setMentorAvailabilityStatusAction}>
                          <input type="hidden" name="availabilityId" value={slot.id} />
                          <input type="hidden" name="status" value="ARCHIVED" />
                          <IconSubmitButton label="Archive availability" tone="danger">
                            <Trash2 size={17} />
                          </IconSubmitButton>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[22px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Upcoming bookings</h2>
                <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
                  Confirmed sessions, reschedule requests, and sessions awaiting completion review appear here.
                </p>
              </div>
            </div>

            {confirmedBookings.length === 0 ? (
              <div className="mt-5 rounded-[16px] border border-dashed border-[#D8E0EF] bg-[#F8FAFC] px-4 py-8 text-center">
                <p className="text-[14px] font-bold text-[#040B37]">No confirmed mentorship bookings yet</p>
                <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">Confirmed learner bookings will appear here once free sessions are booked or paid sessions are completed.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {confirmedBookings.map((booking) => (
                  <article key={booking.id} className="rounded-[18px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {booking.student?.image ? (
                          <img
                            src={booking.student.image}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#1C4ED1]/10 text-[13px] font-black text-[#1C4ED1] shadow-sm">
                            {studentInitials(booking)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-black text-[#040B37]">{studentName(booking)}</p>
                          {booking.student?.email && (
                            <p className="truncate text-[12px] font-semibold text-[#9CA3AF]">{booking.student.email}</p>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${bookingStatusTone(booking.status)}`}>
                        {bookingStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-[14px] border border-[#E3E8F4] bg-white p-3">
                      <p className="text-[14px] font-black text-[#040B37]">{booking.topic || "Mentorship session"}</p>
                      <div className="mt-2 grid gap-2 text-[12px] font-semibold text-[#4B5563] sm:grid-cols-2">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={14} strokeWidth={1.9} className="text-[#1C4ED1]" />
                          {bookingDateLabel(booking.startsAt, booking.timezone)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={14} strokeWidth={1.9} className="text-[#1C4ED1]" />
                          {bookingTimeRangeLabel(booking)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <WalletCards size={14} strokeWidth={1.9} className="text-[#1C4ED1]" />
                          {bookingPriceLabel(booking)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <ExternalLink size={14} strokeWidth={1.9} className="text-[#1C4ED1]" />
                          {booking.meetingUrl ? "Meeting ready" : "Meeting link pending"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="primary"
                        rounded="md"
                        className="h-10 w-full"
                        onClick={() => openBookingDetails(booking)}
                      >
                        View session
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {pendingPaymentBookings.length > 0 && (
              <div className="mt-6 rounded-[18px] border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.08em] text-amber-700">Payment holds</p>
                <div className="mt-3 space-y-2">
                  {pendingPaymentBookings.map((booking) => (
                    <div key={booking.id} className="rounded-[12px] border border-amber-100 bg-white px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] font-black text-[#040B37]">{booking.topic || "Mentorship session"}</p>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">
                          Pending payment
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                        {bookingDateLabel(booking.startsAt, booking.timezone)} with {booking.student?.name || booking.student?.email || "Learner"} · {bookingPriceLabel(booking)}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-[12px] font-black text-[#1C4ED1] transition hover:text-[#0F3AA9]"
                        onClick={() => openBookingDetails(booking)}
                      >
                        View hold details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {selectedBooking && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#040B37]/45 px-4 py-6 backdrop-blur-sm sm:items-center"
          onMouseDown={closeBookingDetails}
        >
          <div
            className="custom-scrollbar max-h-[calc(100dvh-32px)] w-full max-w-[640px] overflow-y-auto rounded-[22px] border border-[#E3E8F4] bg-white shadow-[0px_24px_70px_rgba(4,11,55,0.22)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E3E8F4] p-5">
              <div>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${
                    bookingStatusTone(selectedBooking.status)
                  }`}
                >
                  {bookingStatusLabel(selectedBooking.status)}
                </span>
                <h3 className="mt-3 text-[22px] font-black leading-tight tracking-[-0.03em] text-[#040B37]">
                  {selectedBooking.topic || "Mentorship session"}
                </h3>
                <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">
                  {bookingDateLabel(selectedBooking.startsAt, selectedBooking.timezone)} · {bookingTimeRangeLabel(selectedBooking)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBookingDetails}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E3E8F4] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
              >
                <X size={18} strokeWidth={1.9} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                <div className="flex items-center gap-3">
                  {selectedBooking.student?.image ? (
                    <img
                      src={selectedBooking.student.image}
                      alt=""
                      className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#1C4ED1]/10 text-[13px] font-black text-[#1C4ED1] shadow-sm">
                      {studentInitials(selectedBooking)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-black text-[#040B37]">{studentName(selectedBooking)}</p>
                    {selectedBooking.student?.email && (
                      <a
                        href={`mailto:${selectedBooking.student.email}`}
                        className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-[#1C4ED1]"
                      >
                        <Mail size={13} strokeWidth={1.9} />
                        {selectedBooking.student.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[14px] bg-[#F4F6FB] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Session value</p>
                  <p className="mt-1 text-[15px] font-black text-[#040B37]">{bookingPriceLabel(selectedBooking)}</p>
                </div>
                <div className="rounded-[14px] bg-[#F4F6FB] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Timezone</p>
                  <p className="mt-1 text-[15px] font-black text-[#040B37]">{selectedBooking.timezone}</p>
                </div>
              </div>

              {selectedBooking.studentNote ? (
                <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-[13px] font-black text-[#040B37]">
                    <MessageSquareText size={15} strokeWidth={1.9} className="text-[#1C4ED1]" />
                    Student note
                  </p>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#4B5563]">{selectedBooking.studentNote}</p>
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-[#D8E0EF] bg-[#F8FAFC] p-4 text-[13px] font-semibold text-[#9CA3AF]">
                  No note was added by this student.
                </div>
              )}

              <div className="rounded-[18px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">
                      Next action
                    </p>
                    <p className="mt-1 text-[15px] font-black text-[#040B37]">
                      {selectedBooking.status === "RESCHEDULE_REQUESTED"
                        ? "Review the proposed time"
                        : ["CONFIRMED", "AWAITING_COMPLETION"].includes(selectedBooking.status)
                          ? "Manage this confirmed session"
                          : "No action needed"}
                    </p>
                  </div>
                  {selectedBooking.meetingUrl && !bookingAction && (
                    <button
                      type="button"
                      onClick={() => window.open(selectedBooking.meetingUrl!, "_blank", "noopener,noreferrer")}
                      className="inline-flex items-center gap-1 text-[12px] font-black text-[#1C4ED1] transition hover:text-[#0F3AA9]"
                    >
                      Open meeting
                      <ExternalLink size={13} strokeWidth={1.9} />
                    </button>
                  )}
                </div>

                {selectedBooking.status === "RESCHEDULE_REQUESTED" && selectedBooking.proposedStartsAt && selectedBooking.proposedEndsAt && (
                  <div className="mt-4 rounded-[16px] border border-[#1C4ED1]/15 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#1C4ED1]">Proposed new time</p>
                    <p className="mt-2 text-[15px] font-black text-[#040B37]">
                      {bookingDateLabel(selectedBooking.proposedStartsAt, selectedBooking.proposedTimezone || selectedBooking.timezone)}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-[#4B5563]">
                      {bookingTimeRangeLabel({
                        ...selectedBooking,
                        startsAt: selectedBooking.proposedStartsAt,
                        endsAt: selectedBooking.proposedEndsAt,
                        timezone: selectedBooking.proposedTimezone || selectedBooking.timezone,
                      })}
                    </p>
                    {selectedBooking.rescheduleNote && (
                      <p className="mt-3 rounded-[12px] bg-[#F4F6FB] px-3 py-2 text-[13px] font-semibold leading-relaxed text-[#4B5563]">
                        {selectedBooking.rescheduleNote}
                      </p>
                    )}
                    {!bookingAction && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="primary"
                          rounded="md"
                          className="h-11"
                          onClick={() => runBookingAction("accept-reschedule")}
                          loading={actionPending}
                          disabled={actionPending}
                        >
                          Accept new time
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          rounded="md"
                          className="h-11 border-[#D8E0EF] text-[#040B37]"
                          onClick={() => setBookingAction("decline-reschedule")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!bookingAction && ["CONFIRMED", "AWAITING_COMPLETION"].includes(selectedBooking.status) && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="primary"
                      rounded="md"
                      className="h-11"
                      onClick={() => runBookingAction("complete")}
                      loading={actionPending}
                      disabled={actionPending}
                    >
                      Mark completed
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      rounded="md"
                      className="h-11 border-[#D8E0EF] text-[#040B37]"
                      onClick={() => {
                        setBookingAction("request-reschedule");
                        setBookingProposedDate("");
                        setBookingProposedTime("");
                      }}
                    >
                      Propose new time
                    </Button>
                  </div>
                )}

                {!bookingAction && !["COMPLETED", "CANCELLED", "CANCELLED_BY_STUDENT", "CANCELLED_BY_MENTOR", "DISPUTED"].includes(selectedBooking.status) && (
                  <button
                    type="button"
                    onClick={() => setBookingAction("cancel")}
                    className="mt-3 text-[12px] font-black text-red-500 transition hover:text-red-600"
                  >
                    Cancel session
                  </button>
                )}

                {bookingAction && (
                  <div className="mt-4 rounded-[16px] border border-[#D8E0EF] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-black text-[#040B37]">
                          {bookingAction === "cancel"
                            ? "Cancel this session"
                            : bookingAction === "request-reschedule"
                              ? "Propose a new time"
                              : "Decline this proposal"}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#9CA3AF]">
                          {bookingAction === "cancel"
                            ? "The student will be notified and finance can review any paid refund."
                            : bookingAction === "request-reschedule"
                              ? "Choose one of your open availability windows."
                              : "The original session time stays active."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingAction(null);
                          setBookingNote("");
                          setBookingProposedDate("");
                          setBookingProposedTime("");
                        }}
                        className="text-[12px] font-black text-[#9CA3AF] transition hover:text-[#040B37]"
                      >
                        Back
                      </button>
                    </div>

                    {bookingAction === "request-reschedule" && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Date</span>
                          <ScheduleDatePicker
                            value={bookingProposedDate}
                            onChange={(value) => {
                              setBookingProposedDate(value);
                              setBookingProposedTime("");
                            }}
                            minDate={new Date()}
                            isDateAvailable={isBookingRescheduleDateAvailable}
                          />
                        </label>
                        <label className="block">
                          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Time</span>
                          <ScheduleTimeCombobox
                            value={bookingProposedTime}
                            onChange={setBookingProposedTime}
                            options={bookingRescheduleTimeOptions}
                            placeholder={bookingProposedDate ? "Select an available time" : "Choose a date first"}
                          />
                        </label>
                        {bookingProposedDate && bookingRescheduleTimeOptions.length === 0 && (
                          <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-semibold leading-relaxed text-amber-700 sm:col-span-2">
                            No open slots are available for this date.
                          </div>
                        )}
                        {bookingProposedDate && bookingProposedTime && selectedBookingDurationMinutes > 0 && (
                          <div className="rounded-[14px] border border-[#E3E8F4] bg-[#F4F6FB] px-4 py-3 text-[12px] font-semibold leading-relaxed text-[#4B5563] sm:col-span-2">
                            Proposed session: {timeLabel(bookingProposedTime)} - {addMinutesToTime(bookingProposedTime, selectedBookingDurationMinutes)}
                          </div>
                        )}
                      </div>
                    )}

                    <textarea
                      value={bookingNote}
                      onChange={(event) => setBookingNote(event.target.value)}
                      placeholder={
                        bookingAction === "cancel"
                          ? "Add a short cancellation reason."
                          : bookingAction === "decline-reschedule"
                            ? "Add a short reason."
                            : "Add a short note for the student."
                      }
                      className="mt-3 min-h-[88px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                    />

                    <Button
                      type="button"
                      variant={bookingAction === "cancel" ? "outline" : "primary"}
                      rounded="md"
                      loading={actionPending}
                      disabled={
                        actionPending ||
                        (bookingAction === "request-reschedule" && (!bookingProposedDate || !isBookingProposedTimeAvailable))
                      }
                      className={`mt-3 h-11 w-full ${bookingAction === "cancel" ? "border-red-200 text-red-600 hover:border-red-300 hover:text-red-700" : ""}`}
                      onClick={() => runBookingAction()}
                    >
                      {bookingAction === "cancel"
                        ? "Cancel session"
                        : bookingAction === "request-reschedule"
                          ? "Send proposal"
                          : "Decline request"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedBooking.meetingUrl ? (
                  <Button
                    type="button"
                    variant="primary"
                    rounded="md"
                    className="h-11 flex-1 gap-2"
                    onClick={() => window.open(selectedBooking.meetingUrl!, "_blank", "noopener,noreferrer")}
                  >
                    Open meeting link
                    <ExternalLink size={15} strokeWidth={1.9} />
                  </Button>
                ) : (
                  <div className="flex-1 rounded-[12px] border border-amber-100 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-700">
                    Meeting link is not ready yet. Connect Calendar or add a meeting link before the session.
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  rounded="md"
                  className="h-11 flex-1 border-[#D8E0EF] text-[#040B37]"
                  onClick={closeBookingDetails}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
