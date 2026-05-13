'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { getLearningActivity, ActivityData, TimeRange } from '@/lib/progressService';

const timeRangeOptions: { label: string; value: TimeRange }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export const ActivityChart = () => {
  const [range, setRange] = useState<TimeRange>('weekly');
  const [data, setData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getLearningActivity(range);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch activity data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#040B37] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-[13px] font-medium animate-in fade-in zoom-in duration-200">
          <p className="opacity-80 mb-0.5">{payload[0].payload.label}</p>
          <p className="text-[15px] font-bold">{payload[0].value} hours</p>
        </div>
      );
    }
    return null;
  };

  const ChartSkeleton = () => (
    <div className="w-full h-full flex flex-col gap-8 justify-end p-2 animate-pulse">
      <div className="flex items-end justify-between h-full gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div 
            key={i} 
            className="flex-1 bg-[#F4F6FB] rounded-t-[8px] relative overflow-hidden"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex-1 h-4 bg-[#F4F6FB] rounded-md" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[16px] border border-[#E3E8F4] overflow-hidden flex flex-col h-[480px] shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="px-6 md:px-8 py-5 md:py-6 border-b border-[#E3E8F4] flex flex-row items-center justify-between bg-white relative z-20 gap-4">
        <div className="min-w-0">
          <h3 className="text-[16px] md:text-[20px] font-bold text-[#040B37] truncate">Learning Activity</h3>
        </div>

        {/* Custom Dropdown */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 border border-[#E3E8F4] rounded-[10px] text-[13px] md:text-[14px] text-[#4B5563] font-bold hover:bg-[#F4F6FB] transition-all bg-white min-w-[90px] md:min-w-[120px] justify-between group"
          >
            <span className="truncate">{timeRangeOptions.find(opt => opt.value === range)?.label}</span>
            <ChevronDown size={16} className={`transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''} text-[#9CA3AF] group-hover:text-[#1C4ED1]`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[140px] md:w-[160px] bg-white border border-[#E3E8F4] rounded-[12px] shadow-xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
              {timeRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRange(opt.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] md:text-[14px] font-medium transition-colors hover:bg-[#F4F6FB] ${
                    range === opt.value ? 'text-[#1C4ED1] bg-[#EFF6FF]' : 'text-[#4B5563]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 p-4 md:p-8">
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 0, left: -25, bottom: 0 }}
              barGap={0}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1C4ED1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1C4ED1" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="#F1F5F9" 
              />
              
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                dy={10}
                interval={0}
              />
              
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: '#F4F6FB' }} 
                animationDuration={200}
              />
              
              <Bar 
                dataKey="hours" 
                fill="url(#barGradient)" 
                radius={[6, 6, 0, 0]} 
                barSize={range === 'yearly' ? 10 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 32)}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
