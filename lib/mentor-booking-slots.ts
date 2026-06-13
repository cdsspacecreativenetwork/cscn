export type MentorAvailabilityInput = {
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
  bookings?: Array<{ startsAt: Date | string; status: string }>;
};

export type MentorBookingSlot = {
  key: string;
  availabilityId: string;
  dateKey: string;
  dateLabel: string;
  dayLabel: string;
  timeValue: string;
  timeLabel: string;
  durationLabel: string;
  timezone: string;
};

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
}

function minutesToTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function mentorBookingDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function timeLabel(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

export function buildMentorBookingSlotsForDate(availability: MentorAvailabilityInput[], date: Date) {
  const currentDateKey = mentorBookingDateKey(date);
  const today = new Date();
  const todayKey = mentorBookingDateKey(today);
  const currentMinutes = today.getHours() * 60 + today.getMinutes();

  if (currentDateKey < todayKey) return [];

  const currentWeekday = date.getDay();
  const slots: MentorBookingSlot[] = [];
  const activeBookingStatuses = new Set(["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED", "AWAITING_COMPLETION"]);

  availability.forEach((window) => {
    const matchesWindow =
      (window.type === "WEEKLY" && window.weekday === currentWeekday) ||
      (window.type === "DATE" && window.date === currentDateKey);

    if (!matchesWindow) return;

    const startMinutes = timeToMinutes(window.startTime);
    const endMinutes = timeToMinutes(window.endTime);
    const step = Math.max(15, window.sessionDuration + window.bufferMinutes);

    for (let slotStart = startMinutes; slotStart + window.sessionDuration <= endMinutes; slotStart += step) {
      if (currentDateKey === todayKey && slotStart <= currentMinutes) continue;

      const existingBookings = window.bookings ?? [];
      const bookingCount = existingBookings.filter((booking) => {
        if (!activeBookingStatuses.has(booking.status)) return false;
        const bookingDate = new Date(booking.startsAt);
        const bookingMinutes = bookingDate.getHours() * 60 + bookingDate.getMinutes();
        return mentorBookingDateKey(bookingDate) === currentDateKey && bookingMinutes === slotStart;
      }).length;

      if (bookingCount >= window.maxBookings) continue;

      slots.push({
        key: `${window.id}-${currentDateKey}-${slotStart}`,
        availabilityId: window.id,
        dateKey: currentDateKey,
        dateLabel: dateLabel(date),
        dayLabel: dayLabel(date),
        timeValue: minutesToTime(slotStart),
        timeLabel: timeLabel(slotStart),
        durationLabel: `${window.sessionDuration} min`,
        timezone: window.timezone,
      });
    }
  });

  return slots;
}

export function hasMentorAvailabilityOnDate(availability: MentorAvailabilityInput[], date: Date) {
  return buildMentorBookingSlotsForDate(availability, date).length > 0;
}

export function buildMentorBookingSlots(availability: MentorAvailabilityInput[], limit = 12) {
  const today = new Date();
  const slots: MentorBookingSlot[] = [];
  for (let dayOffset = 0; dayOffset < 28 && slots.length < limit; dayOffset += 1) {
    const currentDate = addDays(today, dayOffset);
    const daySlots = buildMentorBookingSlotsForDate(availability, currentDate);
    slots.push(...daySlots.slice(0, Math.max(0, limit - slots.length)));
  }

  return slots;
}
