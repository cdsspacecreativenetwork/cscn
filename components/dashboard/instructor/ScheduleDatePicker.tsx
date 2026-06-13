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
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

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
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  isDateAvailable?: (date: Date) => boolean;
}) {
  const selectedDate = safeParseDate(value);
  const minimumDate = startOfDay(minDate);
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(selectedDate ?? minimumDate));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

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
      const width = Math.min(Math.max(trigger.width, 320), Math.min(window.innerWidth - viewportPadding * 2, 400));
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

  const label = selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className={`mt-2 flex h-18 w-full items-center justify-between rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-left text-[14px] font-semibold outline-none transition hover:border-[#1C4ED1]/60 focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10 ${
          selectedDate ? 'text-[#040B37]' : 'text-[#9CA3AF]'
        }`}
      >
        {label}
        <CalendarDays size={18} className="text-[#9CA3AF]" strokeWidth={1.9} />
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="overflow-y-auto rounded-[18px] border border-[#E3E8F4] bg-white shadow-[0px_22px_60px_rgba(4,11,55,0.16)] custom-scrollbar"
        >
          <div className="flex items-center justify-between border-b border-[#E3E8F4] px-3 py-3">
            <button
              type="button"
              onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#E3E8F4] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
            >
              <ChevronLeft size={18} strokeWidth={1.9} />
            </button>
            <p className="text-[15px] font-bold text-[#040B37]">{format(currentMonth, 'MMMM yyyy')}</p>
            <button
              type="button"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#E3E8F4] text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
            >
              <ChevronRight size={18} strokeWidth={1.9} />
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 pb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="py-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const available = isDateAvailable ? isDateAvailable(day) : true;
                const disabled = isBefore(day, minimumDate) || !available;
                const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                const today = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={dateKey(day)}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(dateKey(day));
                      setOpen(false);
                    }}
                    className={`relative flex h-8 items-center justify-center rounded-[10px] text-[13px] font-bold transition sm:h-9 sm:rounded-[12px] ${
                      selected
                        ? 'bg-[#1C4ED1] text-white shadow-[0_10px_22px_rgba(28,78,209,0.25)]'
                        : disabled
                          ? 'cursor-not-allowed text-[#C8D1E0]'
                          : inMonth
                            ? 'text-[#4B5563] hover:bg-[#1C4ED1]/5 hover:text-[#1C4ED1]'
                            : 'text-[#C8D1E0] hover:bg-[#F4F6FB]'
                    }`}
                  >
                    {format(day, 'd')}
                    {available && !selected && !disabled && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#1C4ED1]" />}
                    {today && !selected && !available && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#C8D1E0]" />}
                  </button>
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
