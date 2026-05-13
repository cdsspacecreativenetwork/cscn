'use client';

import React, { useEffect, useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { getCompletionStats, CompletionStats } from '@/lib/progressService';

export const CompletionDonut = () => {
  const [stats, setStats] = useState<CompletionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const result = await getCompletionStats();
        setStats(result);
      } catch (error) {
        console.error('Failed to fetch completion stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const DonutSkeleton = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-10 p-8 animate-pulse">
      <div className="relative w-[180px] h-[180px] rounded-full border-[16px] border-[#F4F6FB] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-8 bg-[#F4F6FB] rounded-md" />
          <div className="w-12 h-3 bg-[#F4F6FB] rounded-md" />
        </div>
      </div>
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#F4F6FB]" />
            <div className="w-20 h-4 bg-[#F4F6FB] rounded-md" />
          </div>
          <div className="w-8 h-6 bg-[#F4F6FB] rounded-md" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#F4F6FB]" />
            <div className="w-20 h-4 bg-[#F4F6FB] rounded-md" />
          </div>
          <div className="w-8 h-6 bg-[#F4F6FB] rounded-md" />
        </div>
      </div>
    </div>
  );

  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-[16px] border border-[#E3E8F4] h-[480px] shadow-sm transition-all hover:shadow-md">
        <div className="px-8 py-6 border-b border-[#E3E8F4]">
          <h3 className="text-[18px] md:text-[20px] font-bold text-[#040B37]">Course Completion</h3>
        </div>
        <DonutSkeleton />
      </div>
    );
  }

  const data = [
    { name: 'Completed', value: stats.completed, color: '#1C4ED1' },
    { name: 'In Progress', value: stats.inProgress, color: '#E3E8F4' },
  ];

  return (
    <div className="bg-white rounded-[16px] border border-[#E3E8F4] overflow-hidden flex flex-col h-[480px] shadow-sm transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="px-8 py-6 border-b border-[#E3E8F4]">
        <h3 className="text-[18px] md:text-[20px] font-bold text-[#040B37]">Course Completion</h3>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
        <div className="w-full h-[240px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#040B37] text-white px-3 py-2 rounded-lg shadow-xl text-[12px] font-bold border border-white/10">
                        {payload[0].name}: {payload[0].value} courses
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[36px] font-bold text-[#040B37] leading-none">{stats.overallPercentage}%</span>
            <span className="text-[13px] font-bold text-[#9CA3AF] mt-1.5 uppercase tracking-wider">Overall</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-10 flex flex-col gap-4 w-full px-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[14px] font-bold text-[#6B7280] group-hover:text-[#040B37] transition-colors">{item.name}</span>
              </div>
              <span className="text-[14px] font-bold text-[#040B37] bg-[#F4F6FB] px-2.5 py-0.5 rounded-md">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
