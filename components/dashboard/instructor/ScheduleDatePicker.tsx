'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

function dateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function safeParseDate(value: string) {
  if (!value) return null;
  const parsed = parseISO(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function ScheduleDatePicker({
  value,
  onChange,
  minDate = new Date(),
  isDateAvailable,
  placeholder = 'Select date',
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  isDateAvailable?: (date: Date) => boolean;
  placeholder?: string;
}) {
  const selectedDate = safeParseDate(value);
  const minimumDate = startOfDay(minDate);
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(selectedDate ?? minimumDate));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const canGoPrevMonth = !isBefore(subMonths(currentMonth, 1), startOfMonth(minimumDate));

  // Lock body scroll while date picker popover is open
  useEffect(() => {
    if (!open) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = rootRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const viewportPadding = 16;
      const width = Math.min(Math.max(trigger.width, 300), Math.min(window.innerWidth - viewportPadding * 2, 340));
      const left = Math.min(
        Math.max(trigger.left, viewportPadding),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
      );
      const estimatedHeight = 320;
      const spaceBelow = window.innerHeight - trigger.bottom - viewportPadding;
      const spaceAbove = trigger.top - viewportPadding;
      const opensAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
      const top = opensAbove
        ? Math.max(viewportPadding, trigger.top - estimatedHeight - 8)
        : trigger.bottom + 8;
      const maxHeight = Math.max(
        220,
        opensAbove ? Math.min(estimatedHeight, spaceAbove - 8) : Math.min(estimatedHeight, spaceBelow - 8)
      );

      setPopoverStyle({
        position: 'fixed',
        top,
        left,
        width,
        maxHeight,
        zIndex: 140,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [currentMonth]);

  const label = selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className={`flex h-12 w-full items-center justify-between px-4 rounded-[14px] border border-[#E3E8F4] bg-white text-[14px] font-medium transition-colors hover:border-[#1C4ED1] cursor-pointer ${
          selectedDate ? 'text-[#040B37] font-semibold' : 'text-[#9CA3AF]'
        }`}
      >
        <span>{label}</span>
        <ChevronDown size={16} className="text-[#4B5563] shrink-0" />
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="overflow-y-auto rounded-[18px] border border-[#E3E8F4] bg-white shadow-[0px_22px_60px_rgba(4,11,55,0.16)] custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E3E8F4] px-4 py-3">
            <button
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
              className={`flex h-8 w-8 items-center justify-center text-[#4B5563] transition ${
                canGoPrevMonth ? 'hover:border-[#1C4ED1] hover:text-[#1C4ED1] cursor-pointer' : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={18} strokeWidth={1.9} />
            </button>
            <p className="text-[15px] font-semibold text-[#040B37]">{format(currentMonth, 'MMMM yyyy')}</p>
            <button
              type="button"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              className="flex h-8 w-8 items-center justify-center text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1] cursor-pointer"
            >
              <ChevronRight size={18} strokeWidth={1.9} />
            </button>
          </div>

          <div className="p-3">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 pb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar dates grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const available = isDateAvailable ? isDateAvailable(day) : true;
                const disabled = isBefore(day, minimumDate) || !available;
                const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <div key={dateKey(day)} className="flex items-center justify-center p-0.5">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onChange(dateKey(day));
                        setOpen(false);
                      }}
                      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium leading-none text-center p-0 transition cursor-pointer ${
                        selected
                          ? 'bg-[#1C4ED1] text-white shadow-md font-semibold'
                          : disabled
                            ? 'cursor-not-allowed text-[#C8D1E0] opacity-35'
                            : inMonth
                              ? 'text-[#040B37] hover:bg-[#1C4ED1]/10 hover:text-[#1C4ED1]'
                              : 'text-[#C8D1E0] opacity-40 hover:bg-[#F4F6FB]'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
