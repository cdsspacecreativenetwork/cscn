'use client';

import React, { useMemo, useState } from 'react';
import { CalendarClock, CalendarPlus, Bell, BookOpenCheck } from 'lucide-react';
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
import Button from '@/components/ui/Button';

const SCHEDULE_EVENTS: ScheduleEvent[] = [];

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

function ScheduleContent() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [activeFilter, setActiveFilter] = useState<FilterValue>('ALL');
  const [activeView, setActiveView] = useState<CalendarView>('Week');

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
    return new Set(SCHEDULE_EVENTS.map((event) => dateKey(parseISO(event.startsAt))));
  }, []);

  const events = useMemo(() => {
    return SCHEDULE_EVENTS
      .filter((event) => activeFilter === 'ALL' || event.type === activeFilter)
      .filter((event) => isWithinInterval(parseISO(event.startsAt), visibleRange))
      .sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime());
  }, [activeFilter, visibleRange]);

  const stats = useMemo(() => {
    const todayKey = dateKey(new Date());
    return [
      { label: "Today's events", value: SCHEDULE_EVENTS.filter((event) => dateKey(parseISO(event.startsAt)) === todayKey).length },
      { label: 'Live sessions', value: SCHEDULE_EVENTS.filter((event) => event.type === 'LIVE_SESSION').length },
      { label: 'Upcoming exams', value: SCHEDULE_EVENTS.filter((event) => event.type === 'EXAM').length },
      { label: 'Deadlines', value: SCHEDULE_EVENTS.filter((event) => event.type === 'DEADLINE').length },
    ];
  }, []);

  const handleAction = (event: ScheduleEvent) => {
    if (event.type === 'LIVE_SESSION' || event.type === 'MENTORSHIP') {
      return;
    }

    if (event.type === 'EXAM') {
      return;
    }
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
            Your live sessions, mentorship bookings, certification exams, and course deadlines will appear here once they are created by instructors or admins.
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
          <Button
            variant="outline"
            rounded="md"
            className="gap-2 border-[#E3E8F4] text-[#040B37]"
            disabled
            title="Students can add real scheduled events to an external calendar once events are available."
          >
            <CalendarPlus size={17} strokeWidth={1.9} />
            Add to calendar
          </Button>
          <Button
            variant="secondary"
            rounded="md"
            className="gap-2"
            disabled
            title="Notification reminders are attached to real sessions, exams, and deadlines."
          >
            <Bell size={17} strokeWidth={1.9} />
            Notify me
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              <EventCard key={event.id} event={event} onAction={handleAction} />
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
    </div>
  );
}

export default function SchedulePage() {
  return <ScheduleContent />;
}
