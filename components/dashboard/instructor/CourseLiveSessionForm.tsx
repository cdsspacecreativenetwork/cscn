'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, PlugZap } from 'lucide-react';

import {
  createCourseLiveSessionAction,
  type CourseLiveSessionFormState,
} from '@/actions/instructor-schedule';
import { ScheduleDatePicker } from '@/components/dashboard/instructor/ScheduleDatePicker';
import { ScheduleTimeCombobox } from '@/components/dashboard/instructor/ScheduleTimeCombobox';
import Button from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  DEFAULT_SCHEDULE_TIME_ZONE,
  getSupportedScheduleTimeZones,
  normalizeScheduleTimeZone,
  parseLocalDateTimeInZone,
} from '@/lib/schedule-time';

type InstructorCourseOption = {
  id: string;
  title: string;
  status: string;
};

const fieldClass =
  'mt-2 h-18 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10';

const errorMessages: Record<NonNullable<CourseLiveSessionFormState['error']>, string> = {
  'missing-fields': 'Select a course, add a session title, and choose a valid start time.',
  'invalid-time': 'The end time must be after the start time.',
  'lead-time': 'Schedule sessions at least 30 minutes from now so students have enough notice.',
  'course-access': 'You can only schedule sessions for courses you own or collaborate on.',
  'calendar-required': 'Connect Google Calendar before scheduling a live session.',
};

const initialCourseLiveSessionFormState: CourseLiveSessionFormState = {
  status: 'idle',
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toWallClockDateTime(date: string, time: string) {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

function roundUpToNextQuarter(date: Date) {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const nextQuarter = Math.ceil(minutes / 15) * 15;
  rounded.setMinutes(nextQuarter, 0, 0);
  if (nextQuarter === 60) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  }
  return rounded;
}

function timeOptionsForDate(date: string) {
  if (!date) return [];
  const today = toDateInputValue(new Date());
  const minTime = date === today ? roundUpToNextQuarter(new Date(Date.now() + 30 * 60 * 1000)) : null;

  return Array.from({ length: 96 }, (_, index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const optionDate = new Date(`${date}T${value}:00`);
    if (minTime && optionDate < minTime) return null;
    return {
      value,
      label: new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(optionDate),
    };
  }).filter((option): option is { value: string; label: string } => Boolean(option));
}

function isStartTimeAllowed(date: string, time: string) {
  if (!date || !time) return true;
  const selectedDateTime = new Date(`${date}T${time}:00`);
  if (Number.isNaN(selectedDateTime.getTime())) return false;
  return selectedDateTime >= new Date(Date.now() + 30 * 60 * 1000);
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

export function CourseLiveSessionForm({
  courses,
  defaultTimezone = DEFAULT_SCHEDULE_TIME_ZONE,
  googleCalendarConnected = false,
}: {
  courses: InstructorCourseOption[];
  defaultTimezone?: string;
  googleCalendarConnected?: boolean;
}) {
  const [formState, formAction, isPending] = useActionState(
    createCourseLiveSessionAction,
    initialCourseLiveSessionFormState
  );
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(() => normalizeScheduleTimeZone(defaultTimezone));
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const minimumDate = useMemo(() => toDateInputValue(new Date()), []);
  const timeZones = useMemo(() => getSupportedScheduleTimeZones(), []);
  const courseOptions = useMemo(
    () => courses.map((course) => ({ value: course.id, label: course.title })),
    [courses]
  );
  const timezoneOptions = useMemo(
    () => timeZones.map((timeZone) => ({ value: timeZone.value, label: timeZone.label })),
    [timeZones]
  );
  const startTimeOptions = useMemo(() => timeOptionsForDate(sessionDate), [sessionDate]);
  const endTimeOptions = useMemo(() => {
    if (!startTime) return startTimeOptions;
    return startTimeOptions.filter((option) => option.value > startTime);
  }, [startTime, startTimeOptions]);

  const startsAtValue = useMemo(() => toWallClockDateTime(sessionDate, startTime), [sessionDate, startTime]);
  const endsAtValue = useMemo(() => toWallClockDateTime(sessionDate, endTime), [endTime, sessionDate]);
  const startsAtUtcValue = useMemo(
    () => parseLocalDateTimeInZone(startsAtValue, selectedTimezone)?.toISOString() ?? '',
    [startsAtValue, selectedTimezone]
  );
  const endsAtUtcValue = useMemo(
    () => parseLocalDateTimeInZone(endsAtValue, selectedTimezone)?.toISOString() ?? '',
    [endsAtValue, selectedTimezone]
  );

  useEffect(() => {
    if (!sessionDate || !startTime) return;
    if (!isStartTimeAllowed(sessionDate, startTime)) {
      setStartTime('');
      setEndTime('');
    }
  }, [sessionDate, startTime]);

  useEffect(() => {
    if (!startTime || !endTime) return;
    if (endTime <= startTime) setEndTime('');
  }, [endTime, startTime]);

  return (
    <section className="rounded-[20px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#1C4ED1]/5 text-[#1C4ED1]">
          <CalendarClock size={22} strokeWidth={1.9} />
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-[#040B37]">Create course session</h2>
          <p className="text-[13px] font-medium text-[#9CA3AF]">Attach the session to one of your courses.</p>
        </div>
      </div>

      {formState.status === 'error' && formState.error && (
        <div className="mt-5 rounded-[14px] border border-orange-200 bg-orange-50 px-4 py-3 text-[13px] font-semibold leading-relaxed text-orange-800">
          {errorMessages[formState.error]}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="courseId" value={selectedCourseId} />
        <input type="hidden" name="startsAt" value={startsAtValue} />
        <input type="hidden" name="endsAt" value={endsAtValue} />
        <input type="hidden" name="startsAtUtc" value={startsAtUtcValue} />
        <input type="hidden" name="endsAtUtc" value={endsAtUtcValue} />
        <input type="hidden" name="timezone" value={selectedTimezone} />
        <input type="hidden" name="autoGenerateMeet" value={googleCalendarConnected ? '1' : '0'} />

        <div>
          <span className="text-[14px] font-bold text-[#040B37]">Course</span>
          <CustomSelect
            options={courseOptions}
            value={selectedCourseId}
            onChange={setSelectedCourseId}
            placeholder="Select a course"
            searchable
            searchPlaceholder="Search courses"
            className="mt-2 w-full"
            triggerClassName="!h-18 !border-[#D8E0EF]"
          />
        </div>

        <label className="block">
          <span className="text-[14px] font-bold text-[#040B37]">Session title</span>
          <input
            name="title"
            required
            placeholder="React state management live clinic"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="text-[14px] font-bold text-[#040B37]">Short description</span>
          <textarea
            name="description"
            rows={4}
            placeholder="Tell students what this session will cover."
            className="mt-2 min-h-[112px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
          />
        </label>

        <label className="block">
          <span className="text-[14px] font-bold text-[#040B37]">Date</span>
          <ScheduleDatePicker
            value={sessionDate}
            onChange={(value) => {
              setSessionDate(value);
              setStartTime('');
              setEndTime('');
            }}
            minDate={new Date(`${minimumDate}T00:00:00`)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[14px] font-bold text-[#040B37]">Start time</span>
            <ScheduleTimeCombobox
              value={startTime}
              onChange={setStartTime}
              options={startTimeOptions}
              placeholder="Select or type time"
            />
          </label>
          <label className="block">
            <span className="text-[14px] font-bold text-[#040B37]">End time</span>
            <ScheduleTimeCombobox
              value={endTime}
              onChange={setEndTime}
              options={endTimeOptions}
              placeholder="Select or type end time"
            />
          </label>
        </div>

        {startsAtValue && startTime && endTime && (
          <div className="rounded-[14px] border border-[#E3E8F4] bg-[#F4F6FB] px-4 py-3 text-[13px] font-semibold text-[#4B5563]">
            Session is scheduled from {timeLabel(startTime)} to {timeLabel(endTime)}.
          </div>
        )}

        <label className="block">
          <span className="text-[14px] font-bold text-[#040B37]">Session timezone</span>
          <CustomSelect
            options={timezoneOptions}
            value={selectedTimezone}
            onChange={setSelectedTimezone}
            placeholder="Select timezone"
            searchable
            searchPlaceholder="Search timezones"
            className="mt-2 w-full"
            triggerClassName="!h-18 !border-[#D8E0EF]"
          />
          <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#9CA3AF]">
            Defaulted from your profile. Change only if this session should use another timezone.
          </p>
        </label>

        <label className="block">
          <span className="text-[14px] font-bold text-[#040B37]">Meeting link</span>
          {googleCalendarConnected ? (
            <div className="mt-2 rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] font-semibold leading-relaxed text-emerald-700">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={15} strokeWidth={1.9} />
                Google Calendar connected. CSCN will generate the Google Meet link automatically.
              </span>
            </div>
          ) : (
            <div className="mt-2 rounded-[14px] border border-[#D8E0EF] bg-[#F4F6FB] px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#4B5563]">
              Connect Google Calendar to let CSCN create a calendar event and generate the Google Meet link for this session.
            </div>
          )}
        </label>

        {googleCalendarConnected ? (
          <Button type="submit" variant="primary" rounded="md" loading={isPending} className="w-full py-3">
            {isPending ? 'Scheduling session...' : 'Schedule live session'}
          </Button>
        ) : (
          <a
            href={`/api/integrations/google-calendar/connect?returnTo=${encodeURIComponent('/dashboard/instructor/live-sessions')}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#1C4ED1] to-[#0A7CFF] px-4 py-3 text-[14px] font-bold text-white shadow-[0_12px_26px_rgba(28,78,209,0.22)] transition hover:-translate-y-0.5"
          >
            <PlugZap size={16} strokeWidth={1.9} />
            Connect Google Calendar
          </a>
        )}
      </form>
    </section>
  );
}
