'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Pencil, PlayCircle, Square, UsersRound, Video, X, XCircle } from 'lucide-react';

import {
  cancelCourseLiveSessionAction,
  endCourseLiveSessionAction,
  startCourseLiveSessionAction,
  updateCourseLiveSessionAction,
} from '@/actions/instructor-schedule';
import Button from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  DEFAULT_SCHEDULE_TIME_ZONE,
  formatScheduleDateTime,
  getSupportedScheduleTimeZones,
  parseLocalDateTimeInZone,
  toDateTimeLocalValue,
} from '@/lib/schedule-time';

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

const fieldClass =
  'mt-2 h-18 w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10';

const JOIN_WINDOW_BEFORE_MS = 15 * 60 * 1000;
const DEFAULT_SESSION_LENGTH_MS = 60 * 60 * 1000;

function toDateTimeLocalMinValue() {
  const date = new Date(Date.now() + 30 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function deriveSessionState(session: InstructorLiveSession) {
  const now = Date.now();
  const startsAt = new Date(session.startsAt).getTime();
  const endsAt = session.endsAt ? new Date(session.endsAt).getTime() : startsAt + DEFAULT_SESSION_LENGTH_MS;

  if (session.status === 'CANCELLED') return { label: 'Cancelled', tone: 'bg-red-50 text-red-600' };
  if (session.status === 'COMPLETED' || session.endedAt) return { label: 'Completed', tone: 'bg-[#F4F6FB] text-[#4B5563]' };
  if (session.startedAt) return { label: 'Live now', tone: 'bg-emerald-50 text-emerald-700' };
  if (now > endsAt) return { label: 'Expired', tone: 'bg-[#F4F6FB] text-[#4B5563]' };
  if (now >= startsAt - JOIN_WINDOW_BEFORE_MS && now <= endsAt) return { label: 'Ready to start', tone: 'bg-amber-50 text-amber-700' };
  return { label: 'Scheduled', tone: 'bg-[#1C4ED1]/10 text-[#1C4ED1]' };
}

export function LiveSessionList({ sessions }: { sessions: InstructorLiveSession[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<InstructorLiveSession | null>(null);
  const [editTimeValues, setEditTimeValues] = useState<
    Record<string, { startsAt: string; endsAt: string; timezone: string }>
  >({});
  const timeZones = useMemo(() => getSupportedScheduleTimeZones(), []);
  const minimumEditDateTime = useMemo(() => toDateTimeLocalMinValue(), []);

  return (
    <section className="rounded-[20px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-bold text-[#040B37]">Scheduled sessions</h2>
        <p className="text-[13px] font-medium text-[#9CA3AF]">
          Manage live sessions linked to your courses. Cancelled sessions are no longer shown to students.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session) => {


            const isEditing = editingId === session.id;
            const sessionState = deriveSessionState(session);
            const isCancelled = session.status === 'CANCELLED';
            const isCompleted = sessionState.label === 'Completed';
            const isExpired = sessionState.label === 'Expired';
            const isStarted = Boolean(session.startedAt && !session.endedAt && session.status !== 'COMPLETED');
            const canManage = !isCancelled && !isCompleted && !isExpired && !isStarted;
            const canStart = !isCancelled && !isCompleted && !isStarted && sessionState.label === 'Ready to start' && Boolean(session.meetingUrl);
            const editValues = editTimeValues[session.id] ?? {
              startsAt: toDateTimeLocalValue(session.startsAt, session.timezone),
              endsAt: toDateTimeLocalValue(session.endsAt, session.timezone),
              timezone: session.timezone || DEFAULT_SCHEDULE_TIME_ZONE,
            };
            const editStartsAtUtc = parseLocalDateTimeInZone(editValues.startsAt, editValues.timezone)?.toISOString() ?? '';
            const editEndsAtUtc = parseLocalDateTimeInZone(editValues.endsAt, editValues.timezone)?.toISOString() ?? '';

            const updateEditTimeValue = (key: 'startsAt' | 'endsAt' | 'timezone', value: string) => {
              setEditTimeValues((current) => ({
                ...current,
                [session.id]: {
                  ...editValues,
                  [key]: value,
                },
              }));
            };

            return (
              <article key={session.id} className="rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${sessionState.tone}`}>
                        {sessionState.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
                        <UsersRound size={13} strokeWidth={1.9} />
                        {session.enrolledStudents} enrolled
                      </span>
                    </div>
                    <h3 className="mt-3 text-[17px] font-bold leading-tight text-[#040B37]">{session.title}</h3>
                    <p className="mt-1 text-[13px] font-semibold text-[#4B5563]">{session.courseTitle}</p>
                    {session.description && (
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#9CA3AF]">{session.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-[12px] border border-[#E3E8F4] bg-white px-4 py-3 text-left lg:min-w-[220px]">
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Starts</p>
                    <p className="mt-1 text-[14px] font-bold text-[#040B37]">
                      {formatScheduleDateTime(session.startsAt, session.timezone)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{session.timezone}</p>
                    {session.meetingUrl && (
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#1C4ED1] hover:underline"
                      >
                        Open meeting link
                        <ExternalLink size={13} strokeWidth={1.9} />
                      </a>
                    )}
                  </div>
                </div>

                {isCancelled ? (
                  <div className="mt-4 rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">
                    This session has been cancelled. Create a replacement session if students still need a live class.
                  </div>
                ) : isCompleted || isExpired ? (
                  <div className="mt-4 rounded-[12px] border border-[#E3E8F4] bg-white px-4 py-3 text-[13px] font-semibold text-[#4B5563]">
                    {isExpired
                      ? 'This session window has passed. Cron will move it into completed history shortly.'
                      : 'This session is complete. Add a recording later if students should revisit the class.'}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canStart && (
                      <form action={startCourseLiveSessionAction}>
                        <input type="hidden" name="sessionId" value={session.id} />
                        <Button type="submit" variant="primary" rounded="md" size="sm" className="gap-2">
                          <PlayCircle size={14} strokeWidth={1.9} />
                          Start session
                        </Button>
                      </form>
                    )}
                    {isStarted && (
                      <form action={endCourseLiveSessionAction}>
                        <input type="hidden" name="sessionId" value={session.id} />
                        <Button type="submit" variant="outline" rounded="md" size="sm" className="gap-2 border-[#D8E0EF] text-[#040B37]">
                          <Square size={14} strokeWidth={1.9} />
                          End session
                        </Button>
                      </form>
                    )}
                    {canManage && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          rounded="md"
                          size="sm"
                          onClick={() => setEditingId(isEditing ? null : session.id)}
                          className="gap-2 border-[#D8E0EF] text-[#040B37]"
                        >
                          <Pencil size={14} strokeWidth={1.9} />
                          {isEditing ? 'Close editor' : 'Edit session'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          rounded="md"
                          size="sm"
                          onClick={() => setSessionToCancel(session)}
                          className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:text-red-700"
                        >
                          <XCircle size={14} strokeWidth={1.9} />
                          Cancel session
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {isEditing && canManage && (
                  <form action={updateCourseLiveSessionAction} className="mt-5 rounded-[14px] border border-[#D8E0EF] bg-white p-4">
                    <input type="hidden" name="sessionId" value={session.id} />
                    <input type="hidden" name="startsAtUtc" value={editStartsAtUtc} />
                    <input type="hidden" name="endsAtUtc" value={editEndsAtUtc} />
                    <div className="grid gap-4">
                      <label className="block">
                        <span className="text-[13px] font-bold text-[#040B37]">Session title</span>
                        <input name="title" required defaultValue={session.title} className={fieldClass} />
                      </label>
                      <label className="block">
                        <span className="text-[13px] font-bold text-[#040B37]">Short description</span>
                        <textarea
                          name="description"
                          rows={3}
                          defaultValue={session.description ?? ''}
                          className="mt-2 min-h-[112px] w-full rounded-[10px] border border-[#D8E0EF] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[13px] font-bold text-[#040B37]">Starts</span>
                          <input
                            name="startsAt"
                            type="datetime-local"
                            required
                            min={minimumEditDateTime}
                            value={editValues.startsAt}
                            onChange={(event) => updateEditTimeValue('startsAt', event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                        <label className="block">
                          <span className="text-[13px] font-bold text-[#040B37]">Ends</span>
                          <input
                            name="endsAt"
                            type="datetime-local"
                            min={editValues.startsAt || minimumEditDateTime}
                            value={editValues.endsAt}
                            onChange={(event) => updateEditTimeValue('endsAt', event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-[13px] font-bold text-[#040B37]">Session timezone</span>
                        <input type="hidden" name="timezone" value={editValues.timezone} />
                        <CustomSelect
                          options={timeZones.map((timeZone) => ({ value: timeZone.value, label: timeZone.label }))}
                          value={editValues.timezone}
                          onChange={(value) => updateEditTimeValue('timezone', value)}
                          searchable
                          searchPlaceholder="Search timezones"
                          className="mt-2 w-full"
                          triggerClassName="!h-18 !border-[#D8E0EF]"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[13px] font-bold text-[#040B37]">Meeting URL</span>
                        <input name="meetingUrl" type="url" defaultValue={session.meetingUrl ?? ''} className={fieldClass} />
                      </label>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button type="submit" variant="primary" rounded="md" size="sm" className="gap-2">
                        Save changes
                      </Button>
                    </div>
                  </form>
                )}
              </article>
            );
          })
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[16px] border border-dashed border-[#C8D1E0] bg-[#F4F6FB] p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1C4ED1]/5 text-[#1C4ED1]">
              <Video size={28} strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 text-[18px] font-bold text-[#040B37]">No live sessions yet</h3>
            <p className="mt-2 max-w-[420px] text-[13px] font-medium leading-relaxed text-[#9CA3AF]">
              Create your first course live session and enrolled students will see it inside their schedule automatically.
            </p>
          </div>
        )}
      </div>

      {sessionToCancel && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#040B37]/45 px-4 py-6 backdrop-blur-sm sm:items-center"
          onMouseDown={() => setSessionToCancel(null)}
        >
          <div
            className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-[#E3E8F4] bg-white shadow-[0px_24px_70px_rgba(4,11,55,0.22)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E3E8F4] p-5">
              <div>
                <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-red-600">
                  Cancel live session
                </span>
                <h3 className="mt-3 text-[22px] font-bold leading-tight text-[#040B37]">{sessionToCancel.title}</h3>
                <p className="mt-1 text-[13px] font-semibold text-[#4B5563]">{sessionToCancel.courseTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSessionToCancel(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E3E8F4] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
              >
                <X size={18} strokeWidth={1.9} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-[14px] bg-[#F4F6FB] p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Starts</p>
                <p className="mt-1 text-[14px] font-bold text-[#040B37]">
                  {formatScheduleDateTime(sessionToCancel.startsAt, sessionToCancel.timezone)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{sessionToCancel.timezone}</p>
              </div>
              <p className="text-[14px] font-medium leading-relaxed text-[#4B5563]">
                Students will no longer see this session on their active schedule. The session remains in your instructor history as cancelled.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" rounded="md" onClick={() => setSessionToCancel(null)}>
                  Keep session
                </Button>
                <form action={cancelCourseLiveSessionAction}>
                  <input type="hidden" name="sessionId" value={sessionToCancel.id} />
                  <Button type="submit" variant="outline" rounded="md" className="w-full border-red-200 text-red-600 hover:border-red-300 hover:text-red-700 sm:w-auto">
                    Cancel session
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
