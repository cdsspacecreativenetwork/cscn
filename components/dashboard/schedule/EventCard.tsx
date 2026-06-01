'use client';

import React from 'react';
import { Calendar, Clock, Video, FileCheck2, GraduationCap, ClipboardList } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface ScheduleEvent {
  id: string;
  type: 'LIVE_SESSION' | 'MENTORSHIP' | 'EXAM' | 'DEADLINE' | 'PLATFORM_EVENT';
  title: string;
  subtitle?: string;
  startsAt: string;
  date: string;
  time: string;
  status?: 'UPCOMING' | 'LIVE' | 'ENDED' | 'LOCKED';
  actionLabel: string;
}

const eventMeta = {
  LIVE_SESSION: { label: 'Live Session', icon: Video },
  MENTORSHIP: { label: 'Mentorship', icon: GraduationCap },
  EXAM: { label: 'Certification Exam', icon: FileCheck2 },
  DEADLINE: { label: 'Deadline', icon: ClipboardList },
  PLATFORM_EVENT: { label: 'Platform Event', icon: Calendar },
};

export const EventCard = ({ event, onAction }: { event: ScheduleEvent; onAction?: (event: ScheduleEvent) => void }) => {
  const meta = eventMeta[event.type];
  const Icon = meta.icon;
  const isPrimaryAction = event.status === 'LIVE' || event.actionLabel.toLowerCase().includes('join') || event.actionLabel.toLowerCase().includes('start');

  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[16px] p-6 lg:p-8 flex flex-col gap-8 w-full group hover:border-[#1C4ED1]/30 transition-all shadow-sm hover:shadow-md" data-node-id="8869:3822">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/5 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#1C4ED1]">
            <Icon size={14} strokeWidth={1.9} />
            {meta.label}
          </span>
          {event.status && (
            <span className="inline-flex rounded-full bg-[#F4F6FB] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
              {event.status.toLowerCase()}
            </span>
          )}
        </div>
        <h3 className="text-[18px] font-semibold text-[#040B37] tracking-[-0.18px] font-jakarta leading-tight group-hover:text-[#1C4ED1] transition-colors" data-node-id="8877:3824">
          {event.title}
        </h3>
        {event.subtitle && (
          <p className="text-[14px] font-medium text-[#4B5563]">{event.subtitle}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-6 mt-2">
          <div className="flex items-center gap-2" data-node-id="8877:3831">
            <Calendar size={16} className="text-[#1C4ED1]" />
            <span className="text-[14px] font-medium text-[#9CA3AF] tracking-[-0.14px] whitespace-nowrap" data-node-id="8877:3825">
              {event.date}
            </span>
          </div>
          <div className="flex items-center gap-2" data-node-id="8877:3832">
            <Clock size={16} className="text-[#1C4ED1]" />
            <span className="text-[14px] font-medium text-[#9CA3AF] tracking-[-0.14px] whitespace-nowrap" data-node-id="8877:3838">
              {event.time}
            </span>
          </div>
        </div>
      </div>

      <div className="w-fit">
        <Button 
          variant={isPrimaryAction ? 'primary' : 'secondary'}
          rounded="sm"
          onClick={() => onAction?.(event)}
          className={`px-4 py-2 text-[12px] h-auto min-h-0 ${
            !isPrimaryAction ? 'bg-[#E3E8F4] !text-[#1C4ED1] hover:bg-[#D4DAE8]' : ''
          }`}
          data-node-id="8877:3847"
        >
          {event.actionLabel}
        </Button>
      </div>
    </div>
  );
};
