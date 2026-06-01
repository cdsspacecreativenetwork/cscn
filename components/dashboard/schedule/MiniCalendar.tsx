'use client';

import React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: Set<string>;
}

function dateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export const MiniCalendar = ({ selectedDate, onDateSelect, markedDates = new Set() }: MiniCalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[16px] w-full max-w-[334px] overflow-hidden font-jakarta" data-node-id="8869:3246">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between mb-4">
        <button 
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center border border-[#E3E8F4] rounded-[8px] hover:bg-gray-50 transition-colors"
          data-node-id="8869:3382"
        >
          <ChevronLeft size={20} className="text-[#333]" />
        </button>
        <span className="text-[16px] font-semibold text-[#333]" data-node-id="8869:3247">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button 
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center border border-[#E3E8F4] rounded-[8px] hover:bg-gray-50 transition-colors"
          data-node-id="8869:3385"
        >
          <ChevronRight size={20} className="text-[#333]" />
        </button>
      </div>

      {/* Grid */}
      <div className="px-[23px] pb-6">
        <div className="grid grid-cols-7 mb-2 opacity-70">
          {days.map((day) => (
            <div key={day} className="text-center py-2">
              <span className="text-[12px] font-bold text-[#040B37]" data-node-id="I8869:3253;2:85500">
                {day}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const hasEvents = markedDates.has(dateKey(day));

            return (
              <div 
                key={idx} 
                className="flex items-center justify-center p-1"
                onClick={() => onDateSelect(day)}
              >
                <div 
                  className={`
                    relative w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer transition-all text-[12px] font-medium
                    ${isSelected ? 'bg-[#1C4ED1] text-white shadow-lg' : ''}
                    ${!isSelected && isCurrentMonth ? 'text-[#4B5563] hover:bg-[#F4F6FB]' : ''}
                    ${!isSelected && !isCurrentMonth ? 'text-[#9CA3AF] opacity-30' : ''}
                  `}
                >
                  <span>{format(day, 'd').padStart(2, '0')}</span>
                  {hasEvents && (
                    <span
                      className={`absolute bottom-[3px] h-1 w-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#1C4ED1]'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
