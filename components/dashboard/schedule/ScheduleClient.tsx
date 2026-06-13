'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarClock, CalendarPlus, BookOpenCheck, ExternalLink, Globe2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { MiniCalendar } from '@/components/dashboard/schedule/MiniCalendar';
import { EventCard, type ScheduleEvent } from '@/components/dashboard/schedule/EventCard';
import { ScheduleDatePicker } from '@/components/dashboard/instructor/ScheduleDatePicker';
import { ScheduleTimeCombobox } from '@/components/dashboard/instructor/ScheduleTimeCombobox';
import Button from '@/components/ui/Button';
import {
  buildMentorBookingSlotsForDate,
  hasMentorAvailabilityOnDate,
  mentorBookingDateKey,
} from '@/lib/mentor-booking-slots';
import { addScheduleEventToGoogleCalendarAction, setScheduleReminderAction } from '@/actions/schedule';
import {
  acceptMentorBookingRescheduleAction,
  cancelMentorBookingAction,
  declineMentorBookingRescheduleAction,
  reportMentorBookingIssueAction,
  requestMentorBookingRescheduleAction,
} from '@/actions/mentor-bookings';

const FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Live Sessions', value: 'LIVE_SESSION' },
  { label: 'Mentorship', value: 'MENTORSHIP' },
  { label: 'Exams', value: 'EXAM' },
  { label: 'Deadlines', value: 'DEADLINE' },
] as const;

type FilterValue = (typeof FILTERS)[number]['value'];
type CalendarView = 'Week' | 'Month';

function dateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function eventCalendarDate(event: ScheduleEvent) {
  return parseISO(`${event.dateKey ?? dateKey(parseISO(event.startsAt))}T00:00:00`);
}

function getInitialScheduleDate(events: ScheduleEvent[]) {
  const now = Date.now();
  const nextEvent = events
    .filter((event) => event.status !== 'ENDED' && event.status !== 'LOCKED')
    .filter((event) => parseISO(event.endsAt ?? event.startsAt).getTime() >= now)
    .sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime())[0];

  return nextEvent ? eventCalendarDate(nextEvent) : new Date();
}

function eventDisplayWeight(event: ScheduleEvent) {
  if (event.status === 'LIVE') return 0;
  if (event.status === 'WAITING') return 1;
  if (event.status === 'ACTION_REQUIRED') return 2;
  if (event.status === 'UPCOMING') return 3;
  if (event.status === 'ENDED') return 3;
  if (event.status === 'LOCKED') return 4;
  return 2;
}

function formatSelectedDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeLabel(value: string) {
  if (!value) return '';
  const [hour, minute] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function addMinutesToTime(value: string, minutesToAdd: number) {
  if (!value || !Number.isFinite(minutesToAdd)) return '';
  const [hour, minute] = value.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return '';
  const date = new Date();
  date.setHours(hour, minute + minutesToAdd, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDateTimeInZone(value: string, timeZone?: string | null) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'Africa/Lagos',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ScheduleClient({
  scheduleEvents,
  googleCalendarConnected,
}: {
  scheduleEvents: ScheduleEvent[];
  googleCalendarConnected: boolean;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => getInitialScheduleDate(scheduleEvents));
  const [activeFilter, setActiveFilter] = useState<FilterValue>('ALL');
  const [activeView, setActiveView] = useState<CalendarView>('Week');
  const [eventsState, setEventsState] = useState(scheduleEvents);
  const [pendingReminderId, setPendingReminderId] = useState<string | null>(null);
  const [pendingCalendarId, setPendingCalendarId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [mentorshipAction, setMentorshipAction] = useState<'cancel' | 'reschedule' | 'accept-reschedule' | 'decline-reschedule' | 'issue' | null>(null);
  const [mentorshipNote, setMentorshipNote] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [isPending, startTransition] = useTransition();

  const visibleRange = useMemo(() => {
    if (activeView === 'Month') {
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      };
    }

    return {
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    };
  }, [activeView, selectedDate]);

  const markedDates = useMemo(() => {
    return new Set(eventsState.map((event) => event.dateKey ?? dateKey(parseISO(event.startsAt))));
  }, [eventsState]);

  const events = useMemo(() => {
    return eventsState
      .filter((event) => activeFilter === 'ALL' || event.type === activeFilter)
      .filter((event) => isWithinInterval(eventCalendarDate(event), visibleRange))
      .sort((a, b) => {
        const statusOrder = eventDisplayWeight(a) - eventDisplayWeight(b);
        if (statusOrder !== 0) return statusOrder;
        return parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime();
      });
  }, [activeFilter, eventsState, visibleRange]);

  const selectedMentorAvailability = selectedEvent?.mentorAvailability ?? [];
  const rescheduleSlots = useMemo(() => {
    if (!proposedDate || selectedMentorAvailability.length === 0) return [];
    return buildMentorBookingSlotsForDate(selectedMentorAvailability, new Date(`${proposedDate}T00:00:00`));
  }, [proposedDate, selectedMentorAvailability]);
  const rescheduleTimeOptions = useMemo(
    () => rescheduleSlots.map((slot) => ({ value: slot.timeValue, label: `${slot.timeLabel} (${slot.durationLabel})` })),
    [rescheduleSlots]
  );
  const isProposedTimeAvailable = useMemo(
    () => Boolean(proposedTime && rescheduleTimeOptions.some((option) => option.value === proposedTime)),
    [proposedTime, rescheduleTimeOptions]
  );
  const selectedEventDurationMinutes = useMemo(() => {
    if (!selectedEvent?.startsAt || !selectedEvent.endsAt) return 0;
    return Math.max(0, Math.round((parseISO(selectedEvent.endsAt).getTime() - parseISO(selectedEvent.startsAt).getTime()) / 60_000));
  }, [selectedEvent]);

  const stats = useMemo(() => {
    const todayKey = dateKey(new Date());
    return [
      { label: "Today's events", value: eventsState.filter((event) => (event.dateKey ?? dateKey(parseISO(event.startsAt))) === todayKey).length },
      { label: 'Live sessions', value: eventsState.filter((event) => event.type === 'LIVE_SESSION').length },
      { label: 'Upcoming exams', value: eventsState.filter((event) => event.type === 'EXAM').length },
      { label: 'Deadlines', value: eventsState.filter((event) => event.type === 'DEADLINE').length },
    ];
  }, [eventsState]);

  const handleAction = (event: ScheduleEvent) => {
    if ((event.type === 'LIVE_SESSION' || event.type === 'MENTORSHIP') && event.meetingUrl && event.status === 'LIVE') {
      window.open(event.meetingUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelectedEvent(event);
  };

  const handleNotify = (event: ScheduleEvent) => {
    const nextValue = !event.reminderEnabled;
    setPendingReminderId(event.id);
    startTransition(async () => {
      const result = await setScheduleReminderAction(event.id, nextValue);
      setPendingReminderId(null);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setEventsState((current) =>
        current.map((item) => (item.id === event.id ? { ...item, reminderEnabled: nextValue } : item))
      );
      setSelectedEvent((current) => (current?.id === event.id ? { ...current, reminderEnabled: nextValue } : current));
      toast.success(result.success);
    });
  };

  const handleGoogleCalendarSave = (event: ScheduleEvent) => {
    if (!googleCalendarConnected) {
      window.location.href = `/api/integrations/google-calendar/connect?returnTo=${encodeURIComponent('/dashboard/schedule')}`;
      return;
    }

    setPendingCalendarId(event.id);
    startTransition(async () => {
      const result = await addScheduleEventToGoogleCalendarAction(event.id);
      setPendingCalendarId(null);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  };

  const handleMentorshipAction = (actionOverride?: NonNullable<typeof mentorshipAction>) => {
    const action = actionOverride ?? mentorshipAction;
    if (!selectedEvent?.mentorBookingId || !action) return;

    const formData = new FormData();
    formData.set('bookingId', selectedEvent.mentorBookingId);
    if (action === 'cancel') formData.set('reason', mentorshipNote);
    if (action === 'decline-reschedule') formData.set('note', mentorshipNote);
    if (action === 'reschedule') {
      formData.set('note', mentorshipNote);
      formData.set('proposedDate', proposedDate);
      formData.set('proposedTime', proposedTime);
      formData.set('timezone', selectedEvent.timezone || 'Africa/Lagos');
    }
    if (action === 'issue') formData.set('note', mentorshipNote);

    startTransition(async () => {
      let result: { error?: string; success?: string };
      if (action === 'cancel') {
        result = await cancelMentorBookingAction(formData);
      } else if (action === 'accept-reschedule') {
        result = await acceptMentorBookingRescheduleAction(formData);
      } else if (action === 'decline-reschedule') {
        result = await declineMentorBookingRescheduleAction(formData);
      } else if (action === 'reschedule') {
        result = await requestMentorBookingRescheduleAction(formData);
      } else {
        result = await reportMentorBookingIssueAction(formData);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
      setMentorshipAction(null);
      setMentorshipNote('');
      setProposedDate('');
      setProposedTime('');
      setSelectedEvent(null);
      router.refresh();
    });
  };

  const isRescheduleDateAvailable = (date: Date) => {
    if (selectedMentorAvailability.length === 0) return false;
    if (mentorBookingDateKey(date) < toDateInputValue(new Date())) return false;
    return hasMentorAvailabilityOnDate(selectedMentorAvailability, date);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-8 p-[clamp(16px,2.78vw,48px)] pb-24 font-jakarta">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-[720px] flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#1C4ED1]/5 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#1C4ED1]">
            <CalendarClock size={14} strokeWidth={1.9} />
            Learning calendar
          </span>
          <h1 className="text-[24px] font-bold tracking-tight text-[#040B37] lg:text-[28px]">
            Schedule
          </h1>
          <p className="text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
            Your live sessions, mentorship bookings, certification exams, and course deadlines appear here when they are scheduled by instructors or admins.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-[12px] bg-[#E3E8F4] p-1">
            {(['Week', 'Month'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`min-w-[112px] rounded-[8px] px-5 py-2.5 text-[13px] font-semibold transition-all ${
                  activeView === view
                    ? 'bg-white text-[#040B37] shadow-[0px_3px_8px_rgba(159,173,205,0.35)]'
                    : 'text-[#9CA3AF] hover:text-[#4B5563]'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[14px] border border-[#E3E8F4] bg-white p-5 shadow-sm">
            <p className="text-[13px] font-semibold text-[#9CA3AF]">{item.label}</p>
            <p className="mt-5 text-[30px] font-bold leading-none text-[#040B37]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full lg:w-fit lg:shrink-0">
          <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} markedDates={markedDates} />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-[16px] border border-[#E3E8F4] bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-bold tracking-tight text-[#040B37]">
                {activeView === 'Week' ? `Week of ${formatRange(visibleRange.start, visibleRange.end)}` : format(selectedDate, 'MMMM yyyy')}
              </h2>
              <p className="text-[13px] font-medium text-[#9CA3AF]">
                {activeView === 'Week'
                  ? `Selected date: ${formatSelectedDate(selectedDate)}. Showing events in this week.`
                  : 'Showing all scheduled learning activities in the selected month.'}
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto rounded-[12px] bg-[#E3E8F4] p-1">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`shrink-0 rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-all ${
                    activeFilter === filter.value
                      ? 'bg-white text-[#1C4ED1] shadow-[0px_3px_8px_rgba(159,173,205,0.35)]'
                      : 'text-[#9CA3AF] hover:text-[#4B5563]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {events.length > 0 ? (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onAction={handleAction}
                onDetails={setSelectedEvent}
              />
            ))
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-[16px] border border-dashed border-[#C8D1E0] bg-white p-8 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C4ED1]/5">
                <BookOpenCheck size={32} className="text-[#1C4ED1]" strokeWidth={1.8} />
              </div>
              <div className="flex max-w-[520px] flex-col gap-2">
                <h3 className="text-[20px] font-bold text-[#040B37]">
                  No scheduled learning activities yet
                </h3>
                <p className="text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
                  When instructors schedule live classes, mentors confirm bookings, admins open certification exams, or course deadlines are published, they will appear here automatically.
                </p>
              </div>
              <Button variant="primary" rounded="md" onClick={() => window.location.href = '/courses'}>
                Browse courses
              </Button>
            </div>
          )}
        </section>
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#040B37]/45 px-4 py-6 backdrop-blur-sm sm:items-center"
          onMouseDown={() => setSelectedEvent(null)}
        >
          <div
            className="custom-scrollbar max-h-[calc(100dvh-32px)] w-full max-w-[620px] overflow-y-auto rounded-[22px] border border-[#E3E8F4] bg-white shadow-[0px_24px_70px_rgba(4,11,55,0.22)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E3E8F4] p-5">
              <div>
                <span className="inline-flex w-fit rounded-full bg-[#1C4ED1]/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1C4ED1]">
                  {selectedEvent.type.replaceAll('_', ' ').toLowerCase()}
                </span>
                <h3 className="mt-3 text-[22px] font-bold leading-tight text-[#040B37]">{selectedEvent.title}</h3>
                {selectedEvent.subtitle && (
                  <p className="mt-1 text-[14px] font-semibold text-[#4B5563]">{selectedEvent.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E3E8F4] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
              >
                <X size={18} strokeWidth={1.9} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[14px] bg-[#F4F6FB] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Date</p>
                  <p className="mt-1 text-[14px] font-bold text-[#040B37]">{selectedEvent.date}</p>
                </div>
                <div className="rounded-[14px] bg-[#F4F6FB] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Time</p>
                  <p className="mt-1 text-[14px] font-bold text-[#040B37]">
                    {selectedEvent.time}
                    {selectedEvent.timezone && (
                      <span className="mt-1 block text-[11px] font-semibold text-[#9CA3AF]">
                        Your timezone: {selectedEvent.timezone}
                        {selectedEvent.hostTimezone && selectedEvent.hostTimezone !== selectedEvent.timezone
                          ? ` - Hosted from ${selectedEvent.hostTimezone}`
                          : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {selectedEvent.description &&
                selectedEvent.description !== selectedEvent.subtitle &&
                selectedEvent.description !== selectedEvent.title && (
                  <div>
                    <p className="text-[13px] font-bold text-[#040B37]">About this event</p>
                    <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#4B5563]">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

              {selectedEvent.meetingUrl && selectedEvent.status === 'LIVE' && (
                <a
                  href={selectedEvent.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-[#D8E0EF] px-4 py-3 text-[14px] font-bold text-[#1C4ED1] transition hover:border-[#1C4ED1]"
                >
                  Open meeting link
                  <ExternalLink size={16} strokeWidth={1.9} />
                </a>
              )}

              {selectedEvent.meetingUrl && selectedEvent.status === 'WAITING' && (
                <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-700">
                  The scheduled window is open, but the host has not started this session yet.
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {selectedEvent.status !== 'ENDED' && selectedEvent.status !== 'LOCKED' ? (
                  <Button
                    variant="outline"
                    rounded="md"
                    className="gap-2 border-[#D8E0EF] text-[#040B37]"
                    onClick={() => handleNotify(selectedEvent)}
                    disabled={isPending && pendingReminderId === selectedEvent.id}
                  >
                    <Bell size={16} strokeWidth={1.9} />
                    {selectedEvent.reminderEnabled ? 'Turn reminder off' : 'Notify me'}
                  </Button>
                ) : (
                  <div className="rounded-[10px] border border-[#E3E8F4] px-4 py-3 text-[12px] font-bold text-[#9CA3AF]">
                    {selectedEvent.status === 'LOCKED' ? 'Cancelled' : 'Completed'}
                  </div>
                )}
                <Button
                  variant="primary"
                  rounded="md"
                  className="gap-2"
                  onClick={() => handleGoogleCalendarSave(selectedEvent)}
                  loading={isPending && pendingCalendarId === selectedEvent.id}
                  disabled={isPending && pendingCalendarId === selectedEvent.id}
                >
                  <Globe2 size={16} strokeWidth={1.9} />
                  {googleCalendarConnected ? 'Save to Google' : 'Connect Google'}
                </Button>
              </div>

              {selectedEvent.type === 'MENTORSHIP' && selectedEvent.mentorBookingId && (
                <div className="">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {selectedEvent.status !== 'LOCKED' && selectedEvent.status !== 'ENDED' && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          rounded="md"
                          className="flex-1 border-[#D8E0EF] text-[#040B37]"
                          onClick={() => setMentorshipAction('reschedule')}
                        >
                          Request reschedule
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          rounded="md"
                          className="flex-1 border-red-200 text-red-600 hover:border-red-300 hover:text-red-700"
                          onClick={() => setMentorshipAction('cancel')}
                        >
                          Cancel session
                        </Button>
                      </>
                    )}
                    {selectedEvent.status === 'ACTION_REQUIRED' || selectedEvent.status === 'ENDED' ? (
                      <Button
                        type="button"
                        variant="outline"
                        rounded="md"
                        className="flex-1 border-amber-200 text-amber-700 hover:border-amber-300"
                        onClick={() => setMentorshipAction('issue')}
                      >
                        Report issue
                      </Button>
                    ) : null}
                  </div>
                  {selectedEvent.status === 'ACTION_REQUIRED' && (
                    <p className="mt-3 text-[12px] font-semibold leading-relaxed text-amber-700">
                      This session window has passed and is waiting for completion confirmation. Report an issue if the session did not hold.
                    </p>
                  )}
                  {selectedEvent.mentorBookingStatus === 'RESCHEDULE_REQUESTED' && selectedEvent.proposedStartsAt && selectedEvent.proposedEndsAt && (
                    <div className="mt-3 rounded-[14px] border border-[#1C4ED1]/15 bg-[#1C4ED1]/5 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#1C4ED1]">
                        {selectedEvent.rescheduleRequestedByViewer ? 'Waiting for mentor response' : 'Mentor proposed a new time'}
                      </p>
                      <p className="mt-2 text-[14px] font-black text-[#040B37]">
                        {formatDateTimeInZone(selectedEvent.proposedStartsAt, selectedEvent.proposedTimezone || selectedEvent.timezone)}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-[#4B5563]">
                        {formatDateTimeInZone(selectedEvent.proposedEndsAt, selectedEvent.proposedTimezone || selectedEvent.timezone)}
                      </p>
                      {selectedEvent.rescheduleNote && (
                        <p className="mt-3 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold leading-relaxed text-[#4B5563]">
                          {selectedEvent.rescheduleNote}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedEvent.mentorBookingStatus === 'RESCHEDULE_REQUESTED' && !selectedEvent.rescheduleRequestedByViewer && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="primary"
                        rounded="md"
                        onClick={() => handleMentorshipAction('accept-reschedule')}
                        loading={isPending}
                        disabled={isPending}
                      >
                        Accept new time
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        rounded="md"
                        className="border-[#D8E0EF] text-[#040B37]"
                        onClick={() => setMentorshipAction('decline-reschedule')}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {mentorshipAction && (
                <div className="rounded-[16px] border border-[#D8E0EF] bg-white p-4 shadow-sm">
                  <p className="text-[14px] font-bold text-[#040B37]">
                    {mentorshipAction === 'cancel'
                      ? 'Why are you cancelling?'
                      : mentorshipAction === 'accept-reschedule'
                        ? 'Accept the proposed new time?'
                        : mentorshipAction === 'decline-reschedule'
                          ? 'Why are you declining this time?'
                      : mentorshipAction === 'reschedule'
                        ? 'Choose the new time you want'
                        : 'Tell us what happened'}
                  </p>
                  {mentorshipAction === 'reschedule' && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Date</span>
                        <ScheduleDatePicker
                          value={proposedDate}
                          onChange={(value) => {
                            setProposedDate(value);
                            setProposedTime('');
                          }}
                          minDate={new Date()}
                          isDateAvailable={isRescheduleDateAvailable}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Time</span>
                        <ScheduleTimeCombobox
                          value={proposedTime}
                          onChange={setProposedTime}
                          options={rescheduleTimeOptions}
                          placeholder={proposedDate ? 'Select an available time' : 'Choose a date first'}
                        />
                      </label>
                      {proposedDate && rescheduleTimeOptions.length === 0 && (
                        <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-semibold leading-relaxed text-amber-700 sm:col-span-2">
                          No open mentor slots are available for this date. Pick another highlighted day.
                        </div>
                      )}
                      {proposedDate && proposedTime && selectedEventDurationMinutes > 0 && (
                        <div className="rounded-[14px] border border-[#E3E8F4] bg-[#F4F6FB] px-4 py-3 text-[12px] font-semibold leading-relaxed text-[#4B5563] sm:col-span-2">
                          Proposed session: {timeLabel(proposedTime)} - {addMinutesToTime(proposedTime, selectedEventDurationMinutes)}. Mentor buffer time is checked automatically.
                        </div>
                      )}
                    </div>
                  )}
                  {mentorshipAction !== 'accept-reschedule' && (
                    <textarea
                      value={mentorshipNote}
                      onChange={(event) => setMentorshipNote(event.target.value)}
                      placeholder={
                        mentorshipAction === 'cancel'
                          ? 'Add a short reason. Paid sessions may require finance review.'
                          : mentorshipAction === 'decline-reschedule'
                            ? 'Add a short reason. The original session time remains active.'
                            : mentorshipAction === 'reschedule'
                              ? 'Add a short reason for the mentor.'
                              : 'Explain whether the mentor missed it, the link failed, or something else happened.'
                      }
                      className="mt-2 min-h-[96px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                    />
                  )}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant={mentorshipAction === 'cancel' ? 'outline' : 'primary'}
                      rounded="md"
                      loading={isPending}
                      disabled={
                        isPending ||
                        (mentorshipAction === 'issue' && !mentorshipNote.trim()) ||
                        (mentorshipAction === 'reschedule' && (!proposedDate || !isProposedTimeAvailable))
                      }
                      className={`flex-1 ${mentorshipAction === 'cancel' ? 'border-red-200 text-red-600 hover:border-red-300 hover:text-red-700' : ''}`}
                      onClick={() => handleMentorshipAction()}
                    >
                      {mentorshipAction === 'cancel'
                        ? 'Cancel session'
                        : mentorshipAction === 'accept-reschedule'
                          ? 'Accept reschedule'
                          : mentorshipAction === 'decline-reschedule'
                            ? 'Decline request'
                        : mentorshipAction === 'reschedule'
                          ? 'Send request'
                          : 'Report issue'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      rounded="md"
                      className="flex-1 border-[#D8E0EF] text-[#040B37]"
                      onClick={() => {
                        setMentorshipAction(null);
                        setMentorshipNote('');
                        setProposedDate('');
                        setProposedTime('');
                      }}
                    >
                      Keep session
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
