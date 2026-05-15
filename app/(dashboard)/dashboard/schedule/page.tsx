'use client';

import React, { useState } from 'react';
import { MiniCalendar } from '@/components/dashboard/schedule/MiniCalendar';
import { EventCard, ScheduleEvent } from '@/components/dashboard/schedule/EventCard';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { JoinSessionModal, SetReminderModal, ViewDetailsModal } from '@/components/dashboard/schedule/ScheduleModals';

import { useSearchParams } from 'next/navigation';

const MOCK_EVENTS: ScheduleEvent[] = [
  {
    id: '1',
    type: 'Live Session',
    title: 'React Advanced State Management',
    date: 'April 16, 2026',
    time: '2:00 PM – 3:00 PM GMT',
    actionLabel: 'Join Session'
  },
  {
    id: '2',
    type: 'Lesson',
    title: 'Figma Prototyping Workshop — Part 3',
    date: 'April 17, 2026',
    time: '10:00 AM GMT',
    actionLabel: 'Set Reminder'
  },
  {
    id: '3',
    type: 'Test',
    title: 'Front-End Development Certification',
    date: 'April 20, 2026',
    time: '9:00 AM GMT · 90 mins',
    actionLabel: 'View Details'
  },
];

function ScheduleContent() {
  const [activeView, setActiveView] = useState<'Week' | 'Month'>('Week');
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 16));
  const searchParams = useSearchParams();
  const completedId = searchParams.get('completed');

  // Filter out completed events
  const events = MOCK_EVENTS.filter(e => e.id !== completedId);
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'join' | 'reminder' | 'details' | null>(null);
  const [activeEvent, setActiveEvent] = useState<ScheduleEvent | null>(null);

  const router = useRouter();

  const handleAction = (event: ScheduleEvent) => {
    setActiveEvent(event);
    if (event.actionLabel === 'Join Session') setActiveModal('join');
    else if (event.actionLabel === 'Set Reminder') setActiveModal('reminder');
    else if (event.actionLabel === 'View Details') setActiveModal('details');
  };

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-8 max-w-[1728px] mx-auto w-full font-jakarta">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6" data-node-id="8869:3234">
        <div className="flex flex-col gap-2" data-node-id="8869:3235">
          <h1 className="text-[20px] lg:text-[24px] font-bold text-[#040B37] tracking-tight" data-node-id="8869:3236">
            Schedule
          </h1>
          <p className="text-[14px] font-medium text-[#9CA3AF]" data-node-id="8869:3237">
            Manage your sessions and upcoming deadlines
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-10" data-node-id="8869:3238">
          {/* View Toggle */}
          <div className="bg-[#E3E8F4] p-1 rounded-[12px] flex items-center w-full sm:w-fit" data-node-id="8869:3239">
            {(['Week', 'Month'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`flex-1 sm:w-[180px] py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-300 cursor-pointer ${
                  activeView === view 
                  ? 'bg-white text-[#040B37] shadow-[0px_4px_2px_rgba(159,173,205,0.4)]' 
                  : 'text-[#9CA3AF] hover:text-[#4B5563]'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Add Reminder Button */}
          <Button 
            variant="primary" 
            rounded="sm"
            className="w-full sm:w-auto h-[48px] flex items-center gap-2 text-[16px] font-semibold whitespace-nowrap shrink-0"
            data-node-id="8869:3244"
          >
            <Plus size={24} />
            <span>Add Reminder</span>
          </Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start" data-node-id="8877:3896">
        {/* Left: Mini Calendar */}
        <div className="w-full lg:w-fit lg:shrink-0">
          <MiniCalendar 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate} 
          />
        </div>

        {/* Right: Events List */}
        <div className="flex-grow flex flex-col gap-4 w-full" data-node-id="8869:3388">
           {events.map((event) => (
             <EventCard 
               key={event.id} 
               event={event} 
               onAction={handleAction}
             />
           ))}

           {events.length === 0 && (
             <div className="bg-white border border-[#E3E8F4] rounded-[16px] p-20 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-[#F4F6FB] rounded-full flex items-center justify-center">
                  <Plus size={32} className="text-[#9CA3AF]" />
                </div>
                <p className="text-[#9CA3AF] font-medium">No events scheduled for this period.</p>
             </div>
           )}
        </div>
      </div>

      {/* Modals */}
      {activeEvent && (
        <>
          <JoinSessionModal 
            isOpen={activeModal === 'join'} 
            onClose={() => setActiveModal(null)} 
            event={activeEvent}
            onConfirm={() => console.log('Joining session...', activeEvent.id)}
          />
          <SetReminderModal 
            isOpen={activeModal === 'reminder'} 
            onClose={() => setActiveModal(null)} 
            event={activeEvent}
            onConfirm={() => console.log('Setting reminder...', activeEvent.id)}
          />
          <ViewDetailsModal 
            isOpen={activeModal === 'details'} 
            onClose={() => setActiveModal(null)} 
            event={activeEvent}
            onConfirm={() => router.push(`/dashboard/exams/${activeEvent.id}/intro`)}
          />
        </>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <React.Suspense fallback={<div>Loading schedule...</div>}>
      <ScheduleContent />
    </React.Suspense>
  );
}
