'use client';

import { useEffect, useState, useTransition } from 'react';
import { Users, TrendingUp, Award, Activity } from 'lucide-react';
import { getCourseAnalyticsAction } from '@/actions/instructor';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, CartesianGrid,
} from 'recharts';

interface AnalyticsData {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  lessonCompletions: { lessonId: string; title: string; moduleTitle: string; count: number }[];
  enrollmentsOverTime: { date: string; count: number }[];
}

interface Props {
  courseId: string;
  data: unknown;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stroke p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-navy">{value}</p>
        <p className="text-sm font-medium text-text-mute">{label}</p>
        {sub && <p className="text-xs text-text-mute mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function CourseAnalyticsTab({ courseId, data }: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(
    data as AnalyticsData | null
  );
  const [loading, startLoad] = useTransition();

  useEffect(() => {
    if (analytics) return;
    startLoad(async () => {
      try {
        const result = await getCourseAnalyticsAction(courseId);
        setAnalytics(result as AnalyticsData | null);
      } catch { /* silent */ }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (loading || !analytics) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stroke p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-background shrink-0" />
              <div className="space-y-2">
                <div className="h-7 w-12 rounded bg-background" />
                <div className="h-3 w-24 rounded bg-background" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-stroke p-6">
          <div className="h-4 w-48 rounded bg-background mb-5" />
          <div className="h-[200px] rounded-xl bg-background" />
        </div>
        <div className="bg-white rounded-2xl border border-stroke p-6">
          <div className="h-4 w-40 rounded bg-background mb-5" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 flex-1 rounded bg-background" />
                <div className="h-3 w-10 rounded bg-background" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topLessons = [...analytics.lessonCompletions]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const chartData = analytics.enrollmentsOverTime.filter((_, i) => i % 3 === 0 || i === analytics.enrollmentsOverTime.length - 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Enrollments" value={analytics.totalEnrollments} color="bg-primary" />
        <StatCard icon={Activity} label="Active Learners" value={analytics.activeEnrollments} color="bg-blue-500" />
        <StatCard icon={Award} label="Completed" value={analytics.completedEnrollments} color="bg-green-500" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${analytics.completionRate}%`} color="bg-amber-500" />
      </div>

      {/* Enrollments over time */}
      <div className="bg-white rounded-2xl border border-stroke p-6">
        <h3 className="font-semibold text-navy mb-5">Enrollments — Last 30 Days</h3>
        {analytics.totalEnrollments === 0 ? (
          <div className="flex items-center justify-center py-12 text-text-mute text-sm">No enrollments yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1C4ED1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1C4ED1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8F4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E3E8F4', fontSize: 12 }}
                labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              />
              <Area type="monotone" dataKey="count" stroke="#1C4ED1" strokeWidth={2} fill="url(#enrollGrad)" name="Enrollments" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Lesson completion */}
      {topLessons.length > 0 && (
        <div className="bg-white rounded-2xl border border-stroke p-6">
          <h3 className="font-semibold text-navy mb-5">Lesson Completions (Top 10)</h3>
          <ResponsiveContainer width="100%" height={Math.max(180, topLessons.length * 36)}>
            <BarChart data={topLessons} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8F4" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
              <YAxis type="category" dataKey="title" width={160}
                tick={{ fontSize: 11, fill: '#4B5563' }}
                tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + '…' : v} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E3E8F4', fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#1C4ED1" radius={[0, 6, 6, 0]} name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
