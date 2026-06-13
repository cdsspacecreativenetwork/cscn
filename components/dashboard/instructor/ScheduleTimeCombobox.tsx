'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

function parseTimeInput(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized) return null;

  const amPmMatch = normalized.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)$/);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = Number(amPmMatch[2] ?? '0');
    const period = amPmMatch[3];
    if (hour < 1 || hour > 12 || minute > 59) return null;
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const twentyFourHourMatch = normalized.match(/^(\d{1,2})(?::?(\d{2}))$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    if (hour > 23 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return null;
}

function displayTime(value: string) {
  if (!value) return '';
  const parsed = parseTimeInput(value) ?? value;
  const [hour, minute] = parsed.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function ScheduleTimeCombobox({
  value,
  onChange,
  options,
  placeholder = 'Select time',
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => displayTime(value));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setDraft(displayTime(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
        const parsed = parseTimeInput(draft);
        if (parsed) onChange(parsed);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [draft, onChange, open]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = rootRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const viewportPadding = 16;
      const width = Math.min(trigger.width, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(trigger.left, viewportPadding),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
      );
      const estimatedHeight = 260;
      const spaceBelow = window.innerHeight - trigger.bottom - viewportPadding;
      const spaceAbove = trigger.top - viewportPadding;
      const opensAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
      const top = opensAbove
        ? Math.max(viewportPadding, trigger.top - estimatedHeight - 8)
        : trigger.bottom + 8;
      const maxHeight = Math.max(
        180,
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

  const filteredOptions = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query) || option.value.includes(query));
  }, [draft, options]);

  return (
    <div ref={rootRef} className="relative">
      <div
        className="mt-2 flex h-18 w-full items-center rounded-[10px] border border-[#D8E0EF] bg-white px-4 transition focus-within:border-[#1C4ED1] focus-within:ring-4 focus-within:ring-[#1C4ED1]/10 hover:border-[#1C4ED1]/60"
        onClick={() => setOpen(true)}
      >
        <input
          value={draft}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const nextDraft = event.target.value;
            setDraft(nextDraft);
            setOpen(true);
            const parsed = parseTimeInput(nextDraft);
            if (parsed) onChange(parsed);
          }}
          onBlur={() => {
            const parsed = parseTimeInput(draft);
            if (parsed) onChange(parsed);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#040B37] outline-none placeholder:text-[#9CA3AF]"
        />
        <Clock size={17} className="shrink-0 text-[#9CA3AF]" strokeWidth={1.9} />
      </div>

      {open && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="overflow-y-auto rounded-[14px] border border-[#E3E8F4] bg-white p-1.5 shadow-[0px_18px_48px_-12px_rgba(4,11,55,0.22)] custom-scrollbar"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setDraft(option.label);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-[10px] px-4 py-2.5 text-left text-[14px] font-semibold transition ${
                  value === option.value ? 'bg-[#1C4ED1]/5 text-[#1C4ED1]' : 'text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]'
                }`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-4 py-5 text-center text-[13px] font-semibold text-[#9CA3AF]">
              Type a valid time like 9:45 AM or 21:30.
            </p>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
