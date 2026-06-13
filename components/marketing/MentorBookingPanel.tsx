"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Banknote, X } from "lucide-react";

import { createMentorBookingAction } from "@/actions/mentor-bookings";
import Button from "@/components/ui/Button";
import {
  buildMentorBookingSlotsForDate,
  mentorBookingDateKey,
  type MentorAvailabilityInput,
  type MentorBookingSlot,
} from "@/lib/mentor-booking-slots";

export type MentorBookingPanelData = {
  id: string;
  name: string;
  role: string;
  image: string;
  profileUrl: string;
  priceLabel?: string;
  intro?: string | null;
  instructions?: string | null;
  topics?: string[];
  availability?: MentorAvailabilityInput[];
  slots?: MentorBookingSlot[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BookingSubmitButton({
  disabled,
  isFree,
}: {
  disabled: boolean;
  isFree: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="gradient"
      rounded="md"
      hasBorder
      loading={pending}
      disabled={disabled || pending}
      rightIcon={!pending ? <ArrowRight size={16} /> : undefined}
      className="w-full"
    >
      {isFree ? "Book free session" : "Continue to Pay"}
    </Button>
  );
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  return mentorBookingDateKey(date);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

export function MentorBookingPanel({
  mentor,
  open,
  onClose,
}: {
  mentor: MentorBookingPanelData;
  open: boolean;
  onClose: () => void;
}) {
  const slots = mentor.slots ?? [];
  const availability = mentor.availability ?? [];
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, MentorBookingSlot[]>();
    slots.forEach((slot) => {
      const items = groups.get(slot.dateKey) ?? [];
      items.push(slot);
      groups.set(slot.dateKey, items);
    });
    return Array.from(groups.entries()).map(([dateKey, items]) => ({ dateKey, slots: items }));
  }, [slots]);

  const firstDateKey = groupedSlots[0]?.dateKey ?? "";
  const [selectedDate, setSelectedDate] = useState(firstDateKey);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [studentNote, setStudentNote] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => (firstDateKey ? parseDateKey(firstDateKey) : new Date()));

  useEffect(() => {
    if (!open) return;
    setSelectedDate(firstDateKey);
    setSelectedSlotKey("");
    setStudentNote("");
    setVisibleMonth(firstDateKey ? parseDateKey(firstDateKey) : new Date());
  }, [firstDateKey, open]);

  const visibleSlots = useMemo(
    () => (selectedDate ? buildMentorBookingSlotsForDate(availability, parseDateKey(selectedDate)) : []),
    [availability, selectedDate]
  );
  const selectedSlot = visibleSlots.find((slot) => slot.key === selectedSlotKey);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const canGoPreviousMonth = firstDateKey
    ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1) > new Date(parseDateKey(firstDateKey).getFullYear(), parseDateKey(firstDateKey).getMonth(), 1)
    : false;

  if (!open) return null;

  const isFreeSession = (mentor.priceLabel ?? "").toLowerCase().includes("free");

  return (
    <div className="fixed inset-0 z-[9999] flex bg-[#F4F6FB] lg:bg-[#040B37]/45 lg:p-5 lg:backdrop-blur-sm">
      <button type="button" aria-label="Close booking panel" className="absolute inset-0 hidden lg:block" onClick={onClose} />

      <section className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_28px_90px_rgba(4,11,55,0.24)] lg:m-auto lg:grid lg:h-[min(88vh,760px)] lg:max-w-[1180px] lg:grid-cols-[320px_minmax(420px,1fr)_280px] lg:rounded-[26px] lg:border lg:border-[#E3E8F4]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E8F4] bg-white text-[#4B5563] shadow-sm transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <aside className="max-h-[42vh] shrink-0 overflow-y-auto border-b border-[#E3E8F4] bg-[#F8FAFC] p-5 pb-4 lg:max-h-none lg:border-b-0 lg:border-r lg:p-6">
          <div className="relative h-[168px] overflow-hidden rounded-[20px] bg-[#EAF2FF] lg:h-[206px]">
            <Image src={mentor.image} alt={mentor.name} fill className="object-cover object-top" sizes="330px" />
          </div>

          <div className="mt-5">
            <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-[#040B37]">{mentor.name}</h2>
            <p className="mt-1 text-[14px] font-semibold text-[#4B5563]">{mentor.role}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E3E8F4] bg-white px-3 py-1.5 text-[12px] font-bold text-[#040B37]">
              <Banknote size={14} className="text-[#1C4ED1]" />
              {mentor.priceLabel ?? "Session"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E3E8F4] bg-white px-3 py-1.5 text-[12px] font-bold text-[#040B37]">
              <Clock3 size={14} className="text-[#1C4ED1]" />
              {selectedSlot?.durationLabel ?? slots[0]?.durationLabel ?? "Mentorship"}
            </span>
          </div>

          {mentor.intro && (
            <p className="mt-5 text-[14px] font-medium leading-relaxed text-[#4B5563]">{mentor.intro}</p>
          )}

          {mentor.topics && mentor.topics.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {mentor.topics.slice(0, 5).map((topic) => (
                <span key={topic} className="rounded-full bg-[#1C4ED1]/5 px-3 py-1.5 text-[12px] font-bold text-[#1C4ED1]">
                  {topic}
                </span>
              ))}
            </div>
          )}

          {mentor.instructions && (
            <div className="mt-5 rounded-[14px] border border-[#E3E8F4] bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Before you book</p>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed text-[#4B5563]">{mentor.instructions}</p>
            </div>
          )}
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto p-5 pb-36 lg:p-7 lg:pb-7">
          <div className="pr-12">
            <h3 className="text-[24px] font-black tracking-[-0.04em] text-[#040B37]">Select a date</h3>
            <p className="mt-1 text-[14px] font-semibold text-[#9CA3AF]">
              Available dates are highlighted. Choose a date, then pick a time.
            </p>
          </div>

          {groupedSlots.length > 0 ? (
            <section className="mt-6 rounded-[22px] border border-[#E3E8F4] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!canGoPreviousMonth}
                  onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E8F4] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-[15px] font-black text-[#040B37]">{monthLabel(visibleMonth)}</p>
                <button
                  type="button"
                  onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E8F4] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center sm:gap-1.5">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">
                    {day}
                  </span>
                ))}

                {calendarDays.map((day) => {
                  const key = toDateKey(day);
                  const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                  const hasSlots = buildMentorBookingSlotsForDate(availability, day).length > 0;
                  const isSelected = selectedDate === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!hasSlots}
                      onClick={() => {
                        setSelectedDate(key);
                        setSelectedSlotKey("");
                      }}
                      className={`relative flex aspect-square items-center justify-center rounded-full font-black transition sm:text-[13px] text-[12px] h-16 w-16 ${
                        isSelected
                          ? "bg-[#1C4ED1] text-white"
                          : hasSlots
                            ? "bg-[#1C4ED1]/[0.08] text-[#1C4ED1] hover:bg-[#1C4ED1] hover:text-white"
                            : isCurrentMonth
                              ? "text-[#4B5563] opacity-35"
                              : "text-[#9CA3AF] opacity-25"
                      }`}
                    >
                      {day.getDate()}
                      {hasSlots && !isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#1C4ED1]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="mt-6 rounded-[22px] border border-dashed border-[#D8E0EF] bg-[#F8FAFC] px-5 py-12 text-center">
              <CalendarDays className="mx-auto text-[#1C4ED1]" size={34} strokeWidth={1.8} />
              <p className="mt-3 text-[16px] font-black text-[#040B37]">No open slots yet</p>
              <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-semibold leading-relaxed text-[#9CA3AF]">
                This mentor is approved for mentorship but has not published upcoming availability.
              </p>
            </div>
          )}

          {selectedSlot && (
            <div className="mt-5 hidden rounded-[18px] border border-[#E3E8F4] bg-[#F8FAFC] p-4 lg:block">
              <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Selected session</p>
              <p className="mt-1 text-[14px] font-black text-[#040B37]">
                {selectedSlot.dayLabel}, {selectedSlot.dateLabel} at {selectedSlot.timeLabel}
              </p>
              <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                Booking confirmation and payment will happen in the next step.
              </p>
              <label className="mt-4 block">
                <span className="text-[12px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">What do you need help with?</span>
                <textarea
                  value={studentNote}
                  onChange={(event) => setStudentNote(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share your goal, portfolio link, project context, or questions for the mentor."
                  className="mt-2 min-h-[110px] w-full rounded-[14px] border border-[#D8E0EF] bg-white px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                />
              </label>
            </div>
          )}
        </main>

        <aside className="hidden min-h-0 border-l border-[#E3E8F4] bg-[#F8FAFC] p-5 lg:flex lg:flex-col">
          <h3 className="text-[18px] font-black tracking-[-0.03em] text-[#040B37]">Available times</h3>
          <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
            {visibleSlots[0]?.timezone ?? slots[0]?.timezone ?? "Mentor timezone"}
          </p>

          <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {visibleSlots.length > 0 ? (
              visibleSlots.map((slot) => {
                const active = slot.key === selectedSlotKey;
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => setSelectedSlotKey(slot.key)}
                    className={`w-full rounded-[12px] border px-4 py-3 text-center text-[14px] font-black transition ${
                      active
                        ? "border-[#1C4ED1] bg-[#1C4ED1] text-white shadow-[0_10px_22px_rgba(28,78,209,0.18)]"
                        : "border-[#1C4ED1]/45 bg-white text-[#1C4ED1] hover:bg-[#1C4ED1]/5"
                    }`}
                  >
                    {slot.timeLabel}
                  </button>
                );
              })
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#D8E0EF] bg-white px-4 py-8 text-center">
                <p className="text-[13px] font-bold text-[#040B37]">No times for this date</p>
              </div>
            )}
          </div>

          <form action={createMentorBookingAction} className="mt-5">
            <input type="hidden" name="mentorId" value={mentor.id} />
            <input type="hidden" name="slotKey" value={selectedSlot?.key ?? ""} />
            <input type="hidden" name="studentNote" value={studentNote} />
            <input type="hidden" name="topic" value={mentor.topics?.[0] ?? "Mentorship session"} />
            <input type="hidden" name="returnTo" value={mentor.profileUrl} />
            <BookingSubmitButton disabled={!selectedSlot} isFree={isFreeSession} />
          </form>
        </aside>

        {groupedSlots.length > 0 && (
          <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E3E8F4] bg-white/95 p-4 shadow-[0_-14px_40px_rgba(4,11,55,0.08)] backdrop-blur lg:hidden">
            <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Available times</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {visibleSlots.length > 0 ? (
                visibleSlots.map((slot) => {
                  const active = slot.key === selectedSlotKey;
                  return (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => setSelectedSlotKey(slot.key)}
                      className={`min-w-[108px] rounded-[12px] border px-4 py-3 text-[14px] font-black transition ${
                        active
                          ? "border-[#1C4ED1] bg-[#1C4ED1] text-white"
                          : "border-[#1C4ED1]/45 bg-white text-[#1C4ED1]"
                      }`}
                    >
                      {slot.timeLabel}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-[12px] border border-dashed border-[#D8E0EF] px-4 py-3 text-[13px] font-semibold text-[#9CA3AF]">
                  Select a date with availability.
                </p>
              )}
            </div>
            {selectedSlot && (
              <textarea
                value={studentNote}
                onChange={(event) => setStudentNote(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Optional note for the mentor"
                className="mt-3 min-h-[72px] w-full rounded-[12px] border border-[#D8E0EF] bg-white px-4 py-3 text-[13px] font-semibold text-[#040B37] outline-none placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
              />
            )}
            <form action={createMentorBookingAction} className="mt-3">
              <input type="hidden" name="mentorId" value={mentor.id} />
              <input type="hidden" name="slotKey" value={selectedSlot?.key ?? ""} />
              <input type="hidden" name="studentNote" value={studentNote} />
              <input type="hidden" name="topic" value={mentor.topics?.[0] ?? "Mentorship session"} />
              <input type="hidden" name="returnTo" value={mentor.profileUrl} />
              <BookingSubmitButton disabled={!selectedSlot} isFree={isFreeSession} />
            </form>
          </footer>
        )}
      </section>
    </div>
  );
}
