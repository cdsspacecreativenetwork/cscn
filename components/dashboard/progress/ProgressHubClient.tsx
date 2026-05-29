"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Flame,
  Zap,
  Award,
  BookOpen,
  Users,
  Star,
  Clock,
  TrendingUp,
  Trophy,
  Info,
  CheckCircle2,
  Sparkles,
  Share2,
  X,
  Target,
  ArrowRight,
  Calendar,
  Link2,
  BarChart2,
  LineChart,
  ChevronDown,
  Check,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";

// Custom inline SVG icons for compile-safe execution
const LinkedinIcon = ({ size = 15 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const DownloadIcon = ({ size = 15 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

// Standard icon map matching seeded icons
const ICON_MAP: Record<string, string> = {
  CheckCircle: "🥇",
  BookOpen: "💡",
  Flame: "🔥",
  Zap: "⚡",
  Award: "🎓",
  UserPlus: "👥",
  Sparkles: "✨",
  Trophy: "🏆",
  Globe: "🌐",
};

interface CourseProgress {
  id: string;
  title: string;
  instructor: string;
  category: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

interface CompletionStats {
  completed: number;
  inProgress: number;
  overallPercentage: number;
}

interface ActivityData {
  dateStr: string;
  label: string;
  fullDateLabel: string;
  hours: number;
}

interface AchievementInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  role: string;
  threshold: number;
  userAchievementId?: string | null;
}

interface CreatorStats {
  totalStudents: number;
  averageRating: number;
  totalLessonsWatched: number;
  studentHoursSaved: number;
}

interface LeaderboardItem {
  userId: string;
  name: string;
  image: string | null;
  headline: string;
  score: number;
  rank: number;
  studentCount: number;
}

interface QuestInfo {
  id: string;
  title: string;
  description: string;
  frequency: "DAILY" | "WEEKLY";
  threshold: number;
  currentValue: number;
  isCompleted: boolean;
  resetAt: Date | string;
}

interface Props {
  coursesProgress: CourseProgress[];
  completionStats: CompletionStats;
  activityData: ActivityData[];
  achievementsList: AchievementInfo[];
  creatorStats: CreatorStats;
  leaderboardList: LeaderboardItem[];
  creatorRank: { rank: number; score: number };
  streakStats: { currentStreak: number; longestStreak: number };
  activeDates: string[];
  quests: QuestInfo[];
  canViewInstructorImpact: boolean;
}

export function ProgressHubClient({
  coursesProgress,
  completionStats,
  activityData,
  achievementsList,
  creatorStats,
  leaderboardList,
  creatorRank,
  streakStats,
  activeDates,
  quests: initialQuests,
  canViewInstructorImpact,
}: Props) {
  const [activeTab, setActiveTab] = useState<"learner" | "creator">("learner");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [timeframeOpen, setTimeframeOpen] = useState(false);
  const timeframeRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(e.target as Node)) {
        setTimeframeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!canViewInstructorImpact && activeTab === "creator") {
      setActiveTab("learner");
    }
  }, [activeTab, canViewInstructorImpact]);
  
  // Track claimed quests locally for instant feedback
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({});
  
  // Slide-out Drawer for Quests Board
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  
  // Celebratory popup state
  const [celebrationAchievement, setCelebrationAchievement] = useState<AchievementInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Trigger high-fidelity celebratory confetti burst
  const triggerCelebrationConfetti = () => {
    // 1. Center explosion
    confetti({
      particleCount: 140,
      spread: 75,
      origin: { y: 0.65 },
      colors: ["#1C4ED1", "#10B981", "#F59E0B", "#6366F1", "#EC4899"],
    });

    // 2. Dynamic side-cannon sprays
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ["#1C4ED1", "#10B981", "#F59E0B"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ["#1C4ED1", "#10B981", "#F59E0B"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleClaimQuest = (questId: string) => {
    setClaimedQuests((prev) => ({ ...prev, [questId]: true }));
    triggerCelebrationConfetti();
  };

  const handleDownloadBadge = async (userAchievementId: string, badgeName: string) => {
    try {
      const response = await fetch(`/api/achievements/${userAchievementId}/card`);
      if (!response.ok) throw new Error("Failed to download image");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `CSCN_Badge_${badgeName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading badge image:", error);
    }
  };

  const renderAchievementCard = (ach: AchievementInfo) => {
    const isUnlocked = ach.isUnlocked;
    const icon = ICON_MAP[ach.icon] || "🎯";

    // Determine progress dynamically
    let currentValue = 0;
    const totalLessonsCompleted = coursesProgress.reduce((sum, c) => sum + c.completedLessons, 0);
    
    switch (ach.name) {
      case "First Step":
      case "Curious Mind":
        currentValue = totalLessonsCompleted;
        break;
      case "7-Day Streak":
        currentValue = streakStats.longestStreak;
        break;
      case "30-Day Streak":
        currentValue = streakStats.longestStreak;
        break;
      case "Course Completer":
        currentValue = coursesProgress.filter((c) => c.progress === 100).length;
        break;
      case "First Student":
        currentValue = creatorStats.totalStudents;
        break;
      default:
        currentValue = isUnlocked ? ach.threshold : 0;
    }
    
    const displayValue = Math.min(currentValue, ach.threshold);
    const progressPercentage = ach.threshold > 0 ? (displayValue / ach.threshold) * 100 : 0;

    // Define unique styles based on the achievement name
    let themeClass = "bg-white border-[#E3E8F4] text-[#040B37]";
    let highlightClass = "text-[#1C4ED1]";
    let customIllustration = null;

    // Generate illustration
    switch (ach.name) {
      case "First Step":
        customIllustration = (
          <div className="mt-3 bg-white/95 border border-[#E3E8F4] rounded-[8px] p-2 flex items-center justify-between text-[10px] shadow-sm relative overflow-hidden max-w-[200px] w-full self-center">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-[#1C4ED1] flex items-center justify-center font-bold text-[8px]">Y</div>
              <div className="space-y-0.5">
                <p className="font-extrabold text-[8px] text-[#040B37]">You</p>
                <p className="text-[7px] text-gray-400 font-medium">Get started!</p>
              </div>
            </div>
            <span className="text-[7px] font-black bg-[#1C4ED1] text-white px-2 py-0.5 rounded-full">Go</span>
          </div>
        );
        break;
      case "Curious Mind":
        customIllustration = (
          <div className="mt-3 bg-white/95 border border-[#E3E8F4] rounded-[8px] p-2.5 space-y-1.5 shadow-sm max-w-[200px] w-full self-center text-left">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-600">
              <span className="text-emerald-500">✓</span> <span>Module 1 Completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-600">
              <span className="text-emerald-500">✓</span> <span>Module 2 Completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-300">
              <span className="text-gray-300">○</span> <span>Module 3 In Progress</span>
            </div>
          </div>
        );
        break;
      case "7-Day Streak":
        customIllustration = (
          <div className="mt-3 flex items-center justify-center gap-1 text-[10px] font-extrabold text-[#F59E0B] bg-white/95 border border-[#E3E8F4] rounded-[8px] py-2 px-3 shadow-sm max-w-[150px] w-full self-center">
            <Flame size={12} className="animate-pulse" /> 7 Active Days
          </div>
        );
        break;
      case "30-Day Streak":
        customIllustration = (
          <div className="mt-3 flex flex-col items-center justify-center gap-1 bg-white/95 border border-[#E3E8F4] rounded-[8px] p-2 shadow-sm max-w-[200px] w-full self-center text-left">
            <div className="flex items-center gap-1 text-[9px] font-bold text-purple-600">
              <Zap size={11} /> Multiplier x5.0
            </div>
            <div className="w-full h-1.5 bg-[#F3E8FF] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-purple-600 rounded-full w-[80%]" />
            </div>
          </div>
        );
        break;
      case "Course Completer":
        customIllustration = (
          <div className="mt-3 bg-white/95 border border-[#E3E8F4] rounded-[8px] p-2 flex items-center justify-center gap-2 shadow-sm max-w-[200px] w-full self-center">
            <Award size={14} className="text-amber-500" />
            <span className="text-[9px] font-bold text-slate-800">Verified Graduate</span>
          </div>
        );
        break;
      default: // Creator stats or published courses
        customIllustration = (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-bold text-indigo-300 bg-white/5 border border-white/10 rounded-[8px] py-2 px-3 max-w-[200px] w-full self-center">
            <Sparkles size={11} className="text-amber-400" /> Live Platform Impact
          </div>
        );
    }

    if (!isUnlocked) {
      themeClass = "bg-[#F8FAFC]/75 border-[#E2E8F0] text-[#040B37]/80 cursor-not-allowed";
      highlightClass = "text-gray-400";
      customIllustration = (
        <div className="opacity-35 grayscale scale-[0.93] transition-all select-none pointer-events-none">
          {customIllustration}
        </div>
      );
    } else {
      switch (ach.name) {
        case "First Step":
          themeClass = "bg-gradient-to-br from-[#DBE5FF]/85 to-[#DBE5FF]/45 border-[#C5D5FF] text-[#040B37] hover:shadow-lg hover:border-[#1C4ED1]/40";
          highlightClass = "text-[#1C4ED1]";
          break;
        case "Curious Mind":
          themeClass = "bg-gradient-to-br from-[#DDF5E6]/85 to-[#DDF5E6]/45 border-[#C4ECD2] text-[#040B37] hover:shadow-lg hover:border-[#10B981]/40";
          highlightClass = "text-[#10B981]";
          break;
        case "7-Day Streak":
          themeClass = "bg-gradient-to-br from-[#FFEBD3]/85 to-[#FFEBD3]/45 border-[#FCD2A9] text-[#040B37] hover:shadow-lg hover:border-[#F59E0B]/40";
          highlightClass = "text-[#F59E0B]";
          break;
        case "30-Day Streak":
          themeClass = "bg-gradient-to-br from-[#F3E8FF]/85 to-[#F3E8FF]/45 border-[#E9D5FF] text-[#040B37] hover:shadow-lg hover:border-purple-400/40";
          highlightClass = "text-purple-600";
          break;
        case "Course Completer":
          themeClass = "bg-gradient-to-br from-[#E3F5FF]/85 to-[#E3F5FF]/45 border-[#C5EBFF] text-[#040B37] hover:shadow-lg hover:border-blue-400/40";
          highlightClass = "text-blue-500";
          break;
        default: // Creator stats or published courses
          themeClass = "bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white hover:shadow-lg hover:border-[#1C4ED1]/40";
          highlightClass = "text-blue-400";
      }
    }

    return (
      <div
        key={ach.id}
        onClick={() => isUnlocked && setCelebrationAchievement(ach)}
        className={`min-h-[250px] rounded-[10px] border p-5 flex flex-col justify-between relative transition-all duration-350 group cursor-pointer overflow-hidden ${themeClass}`}
      >
        {/* Decorative orbits in the card background */}
        {isUnlocked && (
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full border border-dashed border-black/5 pointer-events-none group-hover:rotate-45 transition-transform duration-1000" />
        )}

        {/* Card Header */}
        <div className="flex items-start justify-between min-h-[44px]">
          {isUnlocked ? (
            <div className="w-11 h-11 rounded-[8px] flex items-center justify-center text-[24px] shrink-0 bg-white shadow-sm">
              {icon}
            </div>
          ) : (
            // Empty space on the left when locked
            <div className="w-11 h-11" />
          )}
          {isUnlocked ? (
            <div className="text-emerald-500 bg-emerald-50 rounded-full p-0.5 border border-emerald-100/50 shadow-sm shrink-0">
              <CheckCircle2 size={15} />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-gray-200/60 text-[#475569] border border-gray-300/40 px-2 py-0.5 rounded-full tracking-wider shrink-0 select-none">
              <Lock size={10} className="text-[#64748B]" />
              <span>Locked</span>
            </div>
          )}
        </div>

        {/* Card Body Illustration */}
        <div className="flex-1 flex flex-col justify-center items-center my-3">
          {isUnlocked ? (
            customIllustration
          ) : (
            <div className="flex flex-col items-center justify-center w-full space-y-4">
              {/* Massive Achievement Icon */}
              <div className="text-[52px] select-none filter drop-shadow-sm opacity-35 grayscale animate-pulse">
                {icon}
              </div>
              
              {/* Progress bar under the massive icon */}
              <div className="w-full max-w-[200px] px-1">
                <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1C4ED1]/55 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[9px] font-bold text-[#64748B] select-none">
                  <span>PROGRESS</span>
                  <span>{displayValue} / {ach.threshold}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Text */}
        <div className="space-y-1 mt-4">
          <h4 className="text-[14px] font-black leading-snug line-clamp-1 select-none">
            {ach.name}
          </h4>
          <p className={`text-[11px] leading-relaxed font-semibold line-clamp-2 select-none ${isUnlocked ? 'text-slate-600/90' : 'text-gray-400'}`}>
            {ach.description}
          </p>
        </div>
      </div>
    );
  };

  // Render heat map cell days list (past 180 days structured as 26 weeks x 7 days)
  const renderHeatmap = () => {
    const cells = [];
    const dateMap = new Set(activeDates);
    const today = new Date();

    const startDate = new Date();
    startDate.setDate(today.getDate() - 181);

    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    for (let dayOffset = 0; dayOffset < 182; dayOffset++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + dayOffset);
      const dateStr = current.toISOString().split("T")[0];
      const isActive = dateMap.has(dateStr);
      const isFuture = current > today;

      cells.push({
        dateStr,
        isActive,
        isFuture,
        label: current.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    // Group cells into 26 weeks (columns)
    const weeks: any[][] = [];
    let currentWeek: any[] = [];
    cells.forEach((cell) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return (
      <div className="flex flex-col gap-5 rounded-2xl border border-[#E3E8F4] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1C4ED1] flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[20px] font-bold text-[#040B37] sm:text-[22px]">Consistency Grid</h4>
              <p className="text-[14px] font-medium text-gray-400 sm:text-[15px]">Your visual footprint over the last 6 months</p>
            </div>
          </div>
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-[12px] font-bold text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-gray-100" />
            <div className="w-3 h-3 rounded-[2px] bg-[#1C4ED1]/15" />
            <div className="w-3 h-3 rounded-[2px] bg-[#1C4ED1]/35" />
            <div className="w-3 h-3 rounded-[2px] bg-[#1C4ED1]/65" />
            <div className="w-3 h-3 rounded-[2px] bg-[#1C4ED1]" />
            <span>More</span>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Weekday Row Labels */}
          <div className="mt-7 flex h-[116px] w-8 shrink-0 select-none flex-col justify-between py-1.5 pr-2 text-right text-[12px] font-bold text-gray-400">
            <span>Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          <div className="custom-scrollbar flex-1 overflow-x-auto pb-3 pt-1">
            {/* Months Header Grid */}
            <div className="grid min-w-[620px] grid-flow-col auto-cols-[20px] gap-[4px] text-[12px] font-extrabold text-gray-400 mb-2 select-none">
              {weeks.map((week, idx) => {
                const cellDate = new Date(week[0].dateStr);
                const monthStr = cellDate.toLocaleDateString("en-US", { month: "short" });

                const prevWeek = weeks[idx - 1];
                const prevMonthStr = prevWeek
                  ? new Date(prevWeek[0].dateStr).toLocaleDateString("en-US", { month: "short" })
                  : "";

                const showMonth = monthStr !== prevMonthStr;

                return (
                  <div key={idx} className="h-5 min-w-[20px] select-none overflow-visible text-left">
                    {showMonth ? monthStr : ""}
                  </div>
                );
              })}
            </div>

            {/* Heatmap Grid Cells */}
            <div className="grid min-w-[620px] grid-flow-col grid-rows-7 gap-[4px]">
              {cells.map((cell, idx) => {
                const densityClass =
                  idx % 3 === 0
                    ? "bg-[#1C4ED1] hover:bg-blue-700 shadow-sm hover:shadow-blue-200/50"
                    : idx % 2 === 0
                    ? "bg-[#1C4ED1]/65 hover:bg-blue-600 shadow-sm"
                    : "bg-[#1C4ED1]/35 hover:bg-blue-500 shadow-sm";

                return (
                  <div
                    key={idx}
                    title={
                      cell.isFuture
                        ? "Future Day"
                        : `${cell.label}: ${cell.isActive ? "🔥 Completed Lesson Milestone" : "No Activity Recorded"}`
                    }
                    className={`h-4 w-4 cursor-pointer rounded-[4px] transition-all duration-300 hover:scale-110 ${
                      cell.isFuture
                        ? "bg-slate-50 border border-slate-100 cursor-not-allowed"
                        : cell.isActive
                        ? densityClass
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const donutData = [
    { name: "Completed", value: completionStats.completed, color: "#1C4ED1" },
    { name: "In Progress", value: completionStats.inProgress, color: "#E3E8F4" },
  ];

  // Filter activity data based on timeframe
  const filteredActivityData = React.useMemo(() => {
    if (!activityData || activityData.length === 0) return [];
    
    // activityData contains last 365 days, ordered from oldest to newest.
    // So the last element is "today".
    let daysToTake = 30; // default month
    if (timeframe === "week") daysToTake = 7;
    if (timeframe === "year") daysToTake = 365;

    // Slice from the end to get the most recent N days
    return activityData.slice(-daysToTake);
  }, [activityData, timeframe]);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto font-jakarta relative">
      {/* 1. Header with Glassmorphic Switcher Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <h1 className="text-[28px] md:text-[34px] font-bold text-[#040B37] tracking-tight">
            My Progress Hub
          </h1>
          <p className="text-[#6B7280] text-[15px]">
            Empower your path, whether building knowledge or leading student success.
          </p>
        </div>

        {/* Dynamic Segmented sliding switcher - only visible after instructor profile activation. */}
        {canViewInstructorImpact && (
          <div className="relative flex p-1 bg-gray-100 rounded-[8px] w-full max-w-[340px]">
            <button
              onClick={() => setActiveTab("learner")}
              className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold text-center transition-colors outline-none duration-300 rounded-[6px] ${
                activeTab === "learner" ? "text-[#1C4ED1]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Student Progress
            </button>
            <button
              onClick={() => setActiveTab("creator")}
              className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold text-center transition-colors outline-none duration-300 rounded-[6px] ${
                activeTab === "creator" ? "text-[#1C4ED1]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Instructor Impact
            </button>

            {/* Sliding Indicator */}
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-[6px] shadow-sm transition-transform duration-350 ease-out ${
                activeTab === "creator" ? "transform translate-x-full" : "transform translate-x-0"
              }`}
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "learner" ? (
          <motion.div
            key="learner"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 2. Learner Streak & Stats Overview Widget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Streak Card */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[140px] group">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
                  <Flame size={160} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold tracking-wider uppercase opacity-95">Daily Streak</span>
                  <Flame size={24} className="animate-pulse text-amber-100" />
                </div>
                <div className="space-y-1 mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-extrabold leading-none">{streakStats.currentStreak}</span>
                    <span className="text-[16px] font-medium opacity-90">days</span>
                  </div>
                  <p className="text-[13px] opacity-90 font-medium">
                    Keep taking lessons daily to grow your learning streak!
                  </p>
                </div>
              </div>

              {/* Longest Streak Card */}
              <div className="bg-white border border-[#E3E8F4] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider">Longest Streak</span>
                  <div className="w-10 h-10 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                    <Trophy size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-extrabold text-[#040B37] leading-none">
                      {streakStats.longestStreak}
                    </span>
                    <span className="text-[16px] font-medium text-gray-400">days</span>
                  </div>
                  <p className="text-[13px] text-gray-400 font-medium">Your personal highest consistency score.</p>
                </div>
              </div>

              {/* Completed Lessons Card */}
              <div className="bg-white border border-[#E3E8F4] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider">Completed Lessons</span>
                  <div className="w-10 h-10 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                    <BookOpen size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-extrabold text-[#040B37] leading-none">
                      {coursesProgress.reduce((sum, c) => sum + c.completedLessons, 0)}
                    </span>
                    <span className="text-[16px] font-medium text-gray-400">modules</span>
                  </div>
                  <p className="text-[13px] text-gray-400 font-medium">Finished lessons across enrolled courses.</p>
                </div>
              </div>
            </div>

            {/* 3. Dynamic slide-out Quest Board Trigger Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all hover:border-[#1C4ED1]/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1C4ED1]/10 border border-[#1C4ED1]/20 flex items-center justify-center text-[#1C4ED1] shrink-0 relative">
                  <div className="absolute inset-0 rounded-xl bg-[#1C4ED1]/10 animate-ping opacity-75" />
                  <Target size={24} className="relative z-10" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-bold text-[#040B37]">Daily & Weekly Challenges</h3>
                    <span className="text-[10px] font-extrabold bg-[#1C4ED1] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Gamified
                    </span>
                  </div>
                  <p className="text-[13px] text-[#4B5563] font-medium leading-relaxed">
                    Complete quests to unlock XP, level up, and rank up in the public leaderboard. You have completed{" "}
                    <strong className="text-[#1C4ED1]">
                      {initialQuests.filter((q) => q.isCompleted || claimedQuests[q.id]).length}
                    </strong>{" "}
                    out of <strong className="text-gray-700">{initialQuests.length}</strong> active challenges.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuestsOpen(true)}
                className="px-5 py-3 bg-[#1C4ED1] hover:bg-blue-700 text-white font-extrabold text-[13px] rounded-xl flex items-center gap-2 group transition-all cursor-pointer shadow-md shadow-blue-500/10 shrink-0 select-none"
              >
                Open Quest Board <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* 4. Recharts Area Chart & Completion Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Daily Learning Area Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E3E8F4] p-6 shadow-sm flex flex-col justify-between h-[450px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E3E8F4] pb-4 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[18px] font-bold text-[#040B37]">Daily Engagement</h3>
                    <p className="text-[13px] text-gray-400">Estimated learning effort (hours)</p>
                  </div>
                  
                  <div className="flex items-center gap-3">

                    {/* Chart Type Toggle */}
                    <div className="flex bg-gray-100 rounded-[8px] p-1">
                      <button
                        onClick={() => setChartType("line")}
                        className={`p-2 rounded-[6px] transition-all ${
                          chartType === "line"
                            ? "bg-white text-[#1C4ED1] shadow-sm"
                            : "text-gray-400 hover:text-gray-700"
                        }`}
                        title="Line Chart"
                      >
                        <LineChart size={15} />
                      </button>
                      <button
                        onClick={() => setChartType("bar")}
                        className={`p-2 rounded-[6px] transition-all ${
                          chartType === "bar"
                            ? "bg-white text-[#1C4ED1] shadow-sm"
                            : "text-gray-400 hover:text-gray-700"
                        }`}
                        title="Bar Chart"
                      >
                        <BarChart2 size={15} />
                      </button>
                    </div>

                    {/* Timeframe Dropdown */}
                    <div ref={timeframeRef} className="relative">
                      <button
                        onClick={() => setTimeframeOpen((o) => !o)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E3E8F4] rounded-[8px] text-[13px] font-semibold text-[#040B37] hover:border-[#1C4ED1]/40 hover:bg-blue-50/50 transition-all min-w-[130px]"
                      >
                        <Calendar size={14} className="text-[#1C4ED1] shrink-0" />
                        <span className="flex-1 text-left">
                          {timeframe === "week" ? "This Week" : timeframe === "month" ? "This Month" : "This Year"}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-gray-400 transition-transform duration-200 ${
                            timeframeOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Panel */}
                      <AnimatePresence>
                        {timeframeOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#E3E8F4] rounded-[10px] shadow-xl shadow-slate-200/60 overflow-hidden w-[130px] p-2 space-y-2"
                          >
                            {([
                              { value: "week" as const, label: "This Week", sub: "Last 7 days" },
                              { value: "month" as const, label: "This Month", sub: "Last 30 days" },
                              { value: "year" as const, label: "This Year", sub: "Last 365 days" },
                            ]).map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setTimeframe(opt.value);
                                  setTimeframeOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-all rounded-sm ${
                                  timeframe === opt.value
                                    ? "bg-blue-50 text-[#1C4ED1]"
                                    : "text-[#040B37] hover:bg-gray-50"
                                }`}
                              >
                                <div>
                                  <p className="text-[13px] font-semibold leading-none mb-0.5">{opt.label}</p>
                                  <p className={`text-[11px] leading-none ${
                                    timeframe === opt.value ? "text-[#1C4ED1]/70" : "text-gray-400"
                                  }`}>{opt.sub}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>

                <div className="flex-1 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <AreaChart data={filteredActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1C4ED1" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#1C4ED1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                          minTickGap={timeframe === "year" ? 30 : 5}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                        />
                        <Tooltip
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#040B37] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-[12px] font-bold">
                                  <p className="opacity-80 mb-0.5">{payload[0].payload.fullDateLabel || payload[0].payload.label}</p>
                                  <p className="text-[14px] font-extrabold">{payload[0].value} hours</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="hours"
                          stroke="#1C4ED1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#areaGradient)"
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={filteredActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                          minTickGap={timeframe === "year" ? 30 : 5}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                        />
                        <Tooltip
                          cursor={{ fill: "transparent" }}
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#040B37] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-[12px] font-bold">
                                  <p className="opacity-80 mb-0.5">{payload[0].payload.fullDateLabel || payload[0].payload.label}</p>
                                  <p className="text-[14px] font-extrabold">{payload[0].value} hours</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="hours" 
                          fill="#1C4ED1" 
                          radius={[6, 6, 0, 0]}
                          barSize={timeframe === "year" ? 4 : timeframe === "week" ? 40 : 16}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Course Completion Donut Card */}
              <div className="bg-white rounded-2xl border border-[#E3E8F4] p-6 shadow-sm flex flex-col justify-between h-[450px]">
                <div className="border-b border-[#E3E8F4] pb-4">
                  <h3 className="text-[18px] font-bold text-[#040B37]">Course Completion</h3>
                  <p className="text-[13px] text-gray-400">Total completion distribution</p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative">
                  <div className="w-[180px] h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={88}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[34px] font-extrabold text-[#040B37] leading-none">
                        {completionStats.overallPercentage}%
                      </span>
                      <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Average
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3.5 w-full px-4">
                    {donutData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[14px] font-bold text-[#6B7280]">{item.name}</span>
                        </div>
                        <span className="text-[13px] font-bold text-[#040B37] bg-[#F4F6FB] px-2.5 py-0.5 rounded-md">
                          {item.value} courses
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Heatmap Consistency Grid */}
            {renderHeatmap()}

            {/* 6. Detail Enrolled Course List */}
            <div className="space-y-5">
              <h2 className="text-[20px] font-bold text-[#040B37] tracking-tight">Active Courses Progress</h2>
              {coursesProgress.length === 0 ? (
                <div className="p-8 bg-white border border-[#E3E8F4] rounded-2xl text-center space-y-3">
                  <p className="text-gray-400 font-medium">You are not currently enrolled in any courses.</p>
                  <a
                    href="/courses"
                    className="inline-block bg-[#1C4ED1] text-white font-bold text-[14px] px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Browse Courses
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coursesProgress.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl border border-[#E3E8F4] p-6 shadow-sm hover:shadow-md transition-all hover:border-[#1C4ED1]/20 flex flex-col justify-between gap-5 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-extrabold text-[#1C4ED1] bg-blue-50 px-2 py-0.5 rounded-md">
                            {course.category}
                          </span>
                          <span className="text-[12px] font-medium text-gray-400">
                            {course.completedLessons}/{course.totalLessons} Lessons
                          </span>
                        </div>
                        <h4 className="text-[16px] md:text-[18px] font-bold text-[#040B37] leading-snug group-hover:text-[#1C4ED1] transition-colors line-clamp-1">
                          {course.title}
                        </h4>
                        <p className="text-[13px] text-gray-400">Instructed by {course.instructor}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[13px] font-bold">
                          <span className="text-gray-400">Completion</span>
                          <span className="text-[#040B37]">{course.progress}%</span>
                        </div>
                        <div className="w-full h-3.5 bg-[#F4F6FB] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1C4ED1] rounded-full transition-all duration-1000"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Dynamic Achievements Glossary List */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-[20px] font-bold text-[#040B37] tracking-tight">Ecosystem Achievements</h2>
                  <p className="text-[13px] text-gray-400">Unlock credentials and download verified, high-fidelity badges</p>
                </div>
              </div>
              <div className="bg-white border border-[#E3E8F4] rounded-2xl p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {achievementsList.map((ach) => renderAchievementCard(ach))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="creator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 8. Instructor Impact Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Lifetime students */}
              <div className="bg-white border border-[#E3E8F4] rounded-[10px] p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Students Taught</span>
                  <div className="w-10 h-10 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                    <Users size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] font-extrabold text-[#040B37] leading-none">
                      {creatorStats.totalStudents}
                    </span>
                    <span className="text-[14px] font-medium text-gray-400">users</span>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium">Enrolled learners in your courses.</p>
                </div>
              </div>

              {/* Course Rating */}
              <div className="bg-white border border-[#E3E8F4] rounded-[10px] p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Average Rating</span>
                  <div className="w-10 h-10 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                    <Star size={20} strokeWidth={2.5} className="fill-[#1C4ED1]" />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] font-extrabold text-[#040B37] leading-none">
                      {creatorStats.averageRating}
                    </span>
                    <span className="text-[14px] font-medium text-gray-400">/ 5.0</span>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium">Ratings submitted by verified students.</p>
                </div>
              </div>

              {/* Total Lessons Completed */}
              <div className="bg-white border border-[#E3E8F4] rounded-[10px] p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Lessons Watched</span>
                  <div className="w-10 h-10 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                    <BookOpen size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] font-extrabold text-[#040B37] leading-none">
                      {creatorStats.totalLessonsWatched}
                    </span>
                    <span className="text-[14px] font-medium text-gray-400">completions</span>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium">Total lesson progress marks generated.</p>
                </div>
              </div>

              {/* Psychologically motivating Altruistic Metric: Student Hours Saved */}
              <div 
                style={{ background: "linear-gradient(168deg, #A4BEFF 0%, #DBE5FF 63%)" }}
                className="rounded-[10px] p-6 shadow-sm border border-[#E3E8F4]/30 relative overflow-hidden flex flex-col justify-between min-h-[140px] group"
              >
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock size={160} className="text-[#1C4ED1]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold tracking-wider uppercase text-[#040B37]">Student Hours Saved</span>
                  <div className="w-10 h-10 rounded-full bg-[#1C4ED1]/15 flex items-center justify-center text-[#1C4ED1]">
                    <Clock size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] font-extrabold text-[#040B37] leading-none">
                      {creatorStats.studentHoursSaved}
                    </span>
                    <span className="text-[14px] font-semibold text-[#040B37]/80">hours</span>
                  </div>
                  <p className="text-[12px] text-[#040B37]/80 font-medium">Total lifetime learning saved by your content!</p>
                </div>
              </div>
            </div>

            {/* 9. Leaderboard cache grid with sticky private ranking widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Public Top 10 Creators Leaderboard */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E3E8F4] p-6 shadow-sm space-y-6">
                <div className="border-b border-[#E3E8F4] pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[18px] font-bold text-[#040B37]">Top Creators Leaderboard</h3>
                    <p className="text-[13px] text-gray-400">Ranking of CSCN educators based on impact score</p>
                  </div>
                  <div className="text-[12px] font-bold bg-amber-50 text-amber-600 px-3 py-1 rounded-md flex items-center gap-1.5">
                    <Trophy size={14} /> Public
                  </div>
                </div>

                <div className="divide-y divide-[#E3E8F4]">
                  {leaderboardList.length === 0 ? (
                    <div className="py-10 text-center text-[13px] font-semibold text-gray-400">
                      No instructor impact data yet. Rankings will appear after real course activity starts.
                    </div>
                  ) : leaderboardList.map((item, idx) => {
                    const isTopThree = idx < 3;
                    const medals = ["🥇", "🥈", "🥉"];

                    return (
                      <div key={item.userId} className="flex items-center justify-between py-4 group">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Rank badge */}
                          <div className="w-8 flex items-center justify-center shrink-0">
                            {isTopThree ? (
                              <span className="text-[22px]">{medals[idx]}</span>
                            ) : (
                              <span className="text-[14px] font-bold text-gray-400">{item.rank}</span>
                            )}
                          </div>

                          {/* Avatar representation */}
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden text-[14px] font-bold text-[#1C4ED1]">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              item.name.charAt(0)
                            )}
                          </div>

                          {/* Profile metadata */}
                          <div className="min-w-0">
                            <h4 className="text-[14px] font-bold text-[#040B37] group-hover:text-[#1C4ED1] transition-colors truncate">
                              {item.name}
                            </h4>
                            <p className="text-[12px] text-gray-400 truncate max-w-[280px]">
                              {item.headline}
                            </p>
                          </div>
                        </div>

                        {/* Rank points */}
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-[12px] font-bold text-[#040B37]">{item.studentCount} students</p>
                            <p className="text-[11px] text-gray-400">Total volume</p>
                          </div>
                          <div className="bg-[#F4F6FB] px-3.5 py-1.5 rounded-lg text-right">
                            <p className="text-[13px] font-extrabold text-[#1C4ED1] leading-none">
                              {item.score}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                              Score
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Private logged-in instructor's stand-alone rank card */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#040B37] to-[#1E293B] rounded-2xl p-6 text-white shadow-sm space-y-6">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-indigo-300" />
                    <span className="text-[13px] font-semibold text-indigo-200">Your Creator Status</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] opacity-80">Your Current Rank</span>
                      <span className="bg-white/10 px-3 py-1 rounded-md text-[14px] font-extrabold text-white">
                        {creatorRank.rank > 0 ? `Rank #${creatorRank.rank}` : "Not ranked"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[14px] opacity-80">Composite Score</span>
                      <span className="text-amber-400 font-extrabold text-[16px]">{creatorRank.score} pts</span>
                    </div>
                  </div>

                  {/* Motivational CTA based on their placement */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-[13px] leading-relaxed text-indigo-100">
                    {creatorRank.rank > 0 && creatorRank.rank <= 10 ? (
                      <p>
                        Amazing job! You are ranked in the Top 10 creators on CSCN. Keep publishing and answering student feedback to secure your position!
                      </p>
                    ) : creatorRank.rank === 0 ? (
                      <p>
                        Publish courses and earn real enrollments, ratings, and completions to enter the creator leaderboard.
                      </p>
                    ) : (
                      <p>
                        Keep improving course completion, student enrollments, and ratings to climb into the Top 10.
                      </p>
                    )}
                  </div>
                </div>

                {/* Score Formula Widget */}
                <div className="bg-white border border-[#E3E8F4] rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-[14px] font-bold text-[#040B37]">Composite Score Formula</h4>
                  <p className="text-[12px] text-gray-400 leading-relaxed">
                    To keep rankings fair, composite impact scores are automatically computed daily based on:
                  </p>
                  <ul className="space-y-2.5 text-[12px] font-medium text-[#4B5563]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C4ED1]" />
                      <span>**40%**: Lifetime Enrollments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C4ED1]" />
                      <span>**40%**: Average Star Ratings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C4ED1]" />
                      <span>**20%**: Course Completion Rates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. Gorgeous, Animated Glassmorphic Celebratory Modal */}
      <AnimatePresence>
        {celebrationAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setCelebrationAchievement(null)}
              className="absolute inset-0 bg-[#040B37] backdrop-blur-sm"
            />

            {/* Glowing card container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className="relative w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl p-8 text-center flex flex-col items-center z-10"
            >
              {/* Top Sparkle */}
              <div className="absolute top-6 left-6 text-amber-400">
                <Sparkles size={24} />
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setCelebrationAchievement(null);
                  setCopied(false);
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-[#040B37] transition-colors"
              >
                <X size={24} />
              </button>

              {/* Pulsing Emoji Avatar Container */}
              <div className="flex justify-center mt-4 mb-6">
                <div className="w-[120px] h-[120px] rounded-full bg-[#F3F7FA] flex items-center justify-center relative group">
                  <div className="absolute inset-0 rounded-full bg-[#E5F0F9] animate-ping opacity-30" />
                  <span className="text-[64px] transform group-hover:scale-110 transition-transform duration-300">
                    {ICON_MAP[celebrationAchievement.icon] || "🥇"}
                  </span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex flex-col items-center mb-8 w-full space-y-3">
                <span className="text-[12px] font-black uppercase bg-[#FFF9E5] text-[#F59E0B] px-4 py-1.5 rounded-full tracking-wider">
                  BADGE UNLOCKED!
                </span>
                <h3 className="text-[32px] font-extrabold text-[#040B37] tracking-tight leading-none mt-2">
                  {celebrationAchievement.name}
                </h3>
                <p className="text-[16px] text-[#6B7280] font-medium mt-1">
                  {celebrationAchievement.description}
                </p>
              </div>

              {/* Actions Grid */}
              <div className="w-full flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (!celebrationAchievement.userAchievementId) return;
                      const text = `I just unlocked the "${celebrationAchievement.name}" badge on CSCN LMS! 🎓🔥 Check it out:`;
                      const shareUrl = `${window.location.origin}/achievements/${celebrationAchievement.userAchievementId}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
                    }}
                    className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 size={16} /> X (Twitter)
                  </button>
                  <button
                    onClick={() => {
                      if (!celebrationAchievement.userAchievementId) return;
                      const shareUrl = `${window.location.origin}/achievements/${celebrationAchievement.userAchievementId}`;
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
                    }}
                    className="w-full py-3.5 bg-[#0277B5] hover:bg-[#026092] text-white font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LinkedinIcon size={16} /> LinkedIn
                  </button>
                </div>

                {celebrationAchievement.userAchievementId && (
                  <button
                    onClick={() => handleDownloadBadge(celebrationAchievement.userAchievementId!, celebrationAchievement.name)}
                    className="w-full py-3.5 bg-[#040B37] hover:bg-slate-900 text-white font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <DownloadIcon size={16} /> Download verified card as PNG
                  </button>
                )}

                <button
                  onClick={() => {
                    if (!celebrationAchievement.userAchievementId) return;
                    const shareUrl = `${window.location.origin}/achievements/${celebrationAchievement.userAchievementId}`;
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className={`w-full py-3.5 font-bold text-[14px] rounded-2xl transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                    copied
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-white border-[#E3E8F4] text-[#040B37] hover:bg-gray-50"
                  }`}
                >
                  {copied ? "✓ Link Copied!" : <><Link2 size={16} /> Copy Verified Verification Link</>}
                </button>

                <button
                  onClick={() => {
                    setCelebrationAchievement(null);
                    setCopied(false);
                  }}
                  className="w-full py-3.5 bg-[#F8FAFC] hover:bg-gray-100 text-[#040B37] font-bold text-[14px] rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  Keep Learning <Sparkles size={16} className="text-[#1C4ED1]" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Gorgeous, Slide-out Quests Board Drawer Overlay */}
      <AnimatePresence>
        {isQuestsOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuestsOpen(false)}
              className="absolute inset-0 bg-[#040B37]/40 backdrop-blur-sm"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-screen max-w-xl bg-white shadow-2xl flex flex-col h-full"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#E3E8F4] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-[18px] font-bold text-[#040B37]">Quest Board</h3>
                    <p className="text-[12px] text-gray-400">Complete challenges to earn XP</p>
                  </div>
                  <button
                    onClick={() => setIsQuestsOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {initialQuests.map((quest) => {
                    const isClaimed = claimedQuests[quest.id];
                    const percent = Math.min(
                      100,
                      Math.round((quest.currentValue / quest.threshold) * 100)
                    );

                    return (
                      <div
                        key={quest.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          quest.isCompleted || isClaimed
                            ? "bg-emerald-50/40 border-emerald-100/70"
                            : "bg-white border-[#E3E8F4] hover:shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              quest.frequency === "DAILY" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}>
                              {quest.frequency}
                            </span>
                            <h4 className="text-[14px] font-bold text-[#040B37] mt-2 leading-snug">
                              {quest.title}
                            </h4>
                            <p className="text-[12px] text-gray-400 font-medium">
                              {quest.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[12px] font-extrabold text-[#1C4ED1] bg-blue-50 px-2 py-1 rounded-md">
                              +{quest.threshold * 10} XP
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-gray-400">Progress</span>
                            <span className={quest.isCompleted || isClaimed ? "text-emerald-600" : "text-[#040B37]"}>
                              {quest.currentValue} / {quest.threshold} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                quest.isCompleted || isClaimed ? "bg-emerald-500" : "bg-[#1C4ED1]"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Claim Button */}
                        {quest.isCompleted && !isClaimed && (
                          <button
                            onClick={() => handleClaimQuest(quest.id)}
                            className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[12px] rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Sparkles size={13} /> Claim Reward
                          </button>
                        )}

                        {isClaimed && (
                          <div className="mt-4 flex items-center justify-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50/80 rounded-xl py-2">
                            ✓ Reward Claimed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
