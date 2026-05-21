'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, ArrowUpRight, MoreHorizontal, GraduationCap, Clock, CheckCircle2, Flame, Share2, EyeOff } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/lib/store/dashboardStore';
import { ResumeCourseModal, GetStartedModal } from '@/components/dashboard/CourseModals';
import { StudentDashboardData } from '@/lib/services/dashboard.service';
import { toast } from 'sonner';

interface Props {
  data: StudentDashboardData;
  user: any;
}

export default function StudentDashboardClient({ data, user }: Props) {
  const router = useRouter();
  const { activeModal, selectedCourse, openResumeModal, openStartModal, closeModals } = useDashboardStore();

  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [dismissedRecs, setDismissedRecs] = React.useState<string[]>([]);

  const userName = user?.name?.split(' ')[0] ?? 'Learner';

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = getTimeGreeting();

  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const navigateToPlayer = () => {
    if (selectedCourse?.nextLessonId && selectedCourse?.nextLessonId !== 'mock-first-lesson' && selectedCourse?.nextLessonId !== 'no-lessons') {
      router.push(`/courses/${selectedCourse.slug}/watch/${selectedCourse.nextLessonId}`);
    } else if (selectedCourse?.firstLessonId && selectedCourse?.firstLessonId !== 'mock-first-lesson' && selectedCourse?.firstLessonId !== 'no-lessons') {
      router.push(`/courses/${selectedCourse.slug}/watch/${selectedCourse.firstLessonId}?autoEnroll=true`);
    } else {
      router.push(`/courses/${selectedCourse.slug}`);
    }
    closeModals();
  };

  const visibleRecs = data.recommendations.filter(r => !dismissedRecs.includes(r.id));

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-[clamp(32px,4.6vw,80px)] max-w-[1728px] mx-auto font-jakarta">
      {/* Header section - Fluid Scaling */}
      <div className="flex items-center justify-between w-full gap-4">
        <div className="space-y-1">
          <h1 className="text-[clamp(18px,1.25vw,22px)] font-bold text-[#040B37] leading-tight">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-[clamp(12px,0.81vw,14px)] font-medium text-[#9CA3AF]">
            {currentDate}
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/courses')}
          className="bg-[#1C4ED1] text-white px-[clamp(12px,1vw,20px)] py-[clamp(8px,0.65vw,12px)] rounded-[8px] flex items-center gap-[clamp(4px,0.46vw,8px)] font-semibold hover:bg-[#1C4ED1]/90 transition-all shrink-0 cursor-pointer shadow-[0px_2px_4px_rgba(28,78,209,0.2)]"
        >
          <Plus size={18} className="sm:w-[20px] sm:h-[20px]" />
          <span className="text-[clamp(13px,0.92vw,16px)] whitespace-nowrap">Explore Courses</span>
        </button>
      </div>

      {/* Stats section - 4 Columns with curated premium Lucide icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(16px,1.39vw,24px)]">
        <StatCard
          title="Courses Enrolled"
          value={data.coursesEnrolled}
          icon={<GraduationCap className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
        <StatCard
          title="Hours Spent"
          value={data.hoursSpent}
          icon={<Clock className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
        <StatCard
          title="Completion Rate"
          value={`${data.completionRate}%`}
          icon={<CheckCircle2 className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
        <StatCard
          title="Learning Streak"
          value={data.learningStreak}
          icon={<Flame className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
      </div>

      {/* Row 1: Continue Learning & Announcements */}
      <div className="grid grid-cols-1 mlg:grid-cols-4 gap-8 items-start">
        {/* Continue Learning */}
        <div className="mlg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] xl:text-[20px] font-semibold text-[#040B37]">Continue Learning</h2>
            <button 
              onClick={() => router.push('/dashboard/courses')}
              className="text-[#1C4ED1] font-medium hover:underline text-[15px]"
            >
              View all
            </button>
          </div>

          <div className="space-y-6">
            {data.activeEnrollments.map((enrollment) => (
              <div 
                key={enrollment.id} 
                className="bg-[#FFFFFF] border border-[#E3E8F4] rounded-[12px] p-6 flex flex-col gap-6 shadow-sm hover:shadow-[0px_4px_12px_rgba(23,26,31,0.06)] transition-all duration-300"
              >
                {/* Top Row: Thumbnail (16:9), Course Title */}
                <div className="flex items-center gap-4">
                  <div className="w-[64px] h-[36px] rounded-[6px] border border-[#E3E8F4] overflow-hidden relative shrink-0 bg-[#F4F6FB]">
                    <Image 
                      src={enrollment.thumbnail || "/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg"} 
                      alt={enrollment.title} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#040B37] leading-snug line-clamp-2">
                    {enrollment.title}
                  </h3>
                </div>

                {/* Middle Meta Row: Category & Progress */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-[13px] sm:text-[14px] font-medium text-[#9CA3AF]">
                    <span className="text-[#4B5563] font-semibold">{enrollment.categoryName}</span>
                    <div className="w-1 h-1 bg-[#E3E8F4] rounded-full"></div>
                    <span>Lesson {enrollment.completedLessons} of {enrollment.totalLessons}</span>
                    <div className="w-1 h-1 bg-[#E3E8F4] rounded-full"></div>
                    <span>{enrollment.progressPercent}% complete</span>
                    <div className="w-1 h-1 bg-[#E3E8F4] rounded-full"></div>
                    <span>Estimated completion: 8 Weeks</span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-4 bg-[#F4F6FB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1C4ED1] rounded-full transition-all duration-1000" style={{ width: `${enrollment.progressPercent}%` }}></div>
                </div>

                {/* Sub-Task / Activity Box */}
                <div className="border border-[#E3E8F4] rounded-[8px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                  <div className="space-y-1.5 flex-1">
                    <p className="text-[16px] font-medium text-[#4B5563] line-clamp-1">
                      {enrollment.nextActivity || "Activity: Create variations of your paper wireframes"}
                    </p>
                    <div className="flex items-center gap-2 text-[14px] font-medium text-[#9CA3AF]">
                      <div className="w-6 h-6 bg-[#F4F6FB] rounded-md flex items-center justify-center border border-[#E3E8F4] shrink-0">
                        <Image
                          src={enrollment.nextActivityType === 'Reading' ? '/assets/dashboard/user/check-list.svg' : '/assets/dashboard/user/computer-video-1.svg'}
                          alt=""
                          width={14}
                          height={14}
                          className="w-[14px] h-[14px] object-contain"
                        />
                      </div>
                      <span>{enrollment.nextActivityType || "Video"} ({enrollment.nextActivityDuration || "5 minutes"})</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => openResumeModal({ 
                      id: enrollment.courseId, 
                      slug: enrollment.slug,
                      nextLessonId: enrollment.nextLessonId,
                      title: enrollment.title, 
                      image: enrollment.thumbnail || "/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg", 
                      lessonInfo: `Lesson ${enrollment.completedLessons} of ${enrollment.totalLessons}` 
                    })}
                    className="bg-[#1C4ED1] text-white px-4 py-2 rounded-[8px] text-[12px] font-semibold cursor-pointer hover:bg-[#163fa3] transition-colors shadow-sm shrink-0"
                  >
                    Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="mlg:col-span-1 space-y-6">
          <div className="bg-white border border-[#E3E8F4] rounded-[12px] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E3E8F4] bg-[#F4F6FB]/30">
              <h2 className="text-[16px] font-semibold text-[#040B37]">Announcements</h2>
            </div>
            <div className="divide-y divide-[#E3E8F4]">
              {data.announcements.map((ann) => (
                <div key={ann.id} className="p-5 flex gap-4 hover:bg-[#F4F6FB]/50 transition-all cursor-pointer group">
                  <div className="w-10 h-10 bg-[#F4F6FB] rounded-xl flex items-center justify-center text-[18px] shrink-0 group-hover:scale-105 transition-transform">
                    {ann.emoji}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[14px] font-medium text-[#4B5563] leading-snug group-hover:text-[#040B37] transition-colors">{ann.title}</p>
                    <p className="text-[11px] font-medium text-[#9CA3AF]">{ann.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Recommended For You & Today's Schedule */}
      <div className="grid grid-cols-1 mlg:grid-cols-4 gap-8 items-start">
        {/* Recommended */}
        <div className="mlg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] xl:text-[20px] font-semibold text-[#040B37]">Recommended For You</h2>
            <button 
              onClick={() => router.push('/dashboard/courses')}
              className="text-[#1C4ED1] font-medium hover:underline text-[15px]"
            >
              View all
            </button>
          </div>
          {visibleRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleRecs.map((course, i) => (
                <div
                  key={course.id || i}
                  className="bg-[#FFFFFF] border border-[#E3E8F4] rounded-[16px] overflow-hidden flex flex-col justify-between min-h-[420px] w-full shadow-sm hover:shadow-[0px_6px_20px_rgba(23,26,31,0.08)] transition-all duration-300 group relative"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/9] w-full bg-[#F4F6FB] overflow-hidden shrink-0">
                    <Image 
                      src={course.thumbnail || "/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg"} 
                      alt={course.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => router.push(`/courses/${course.slug}`)}
                    />
                    
                    {/* Floating Options Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#4B5563] flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-105"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {activeDropdown === course.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveDropdown(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E3E8F4] rounded-[8px] shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              onClick={() => {
                                const shareUrl = `${window.location.origin}/courses/${course.slug}`;
                                navigator.clipboard.writeText(shareUrl);
                                toast.success("Course link copied to clipboard!");
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-[14px] font-medium text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#1C4ED1] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Share2 size={16} />
                              Share
                            </button>
                            <button
                              onClick={() => {
                                setDismissedRecs([...dismissedRecs, course.id]);
                                toast.success("Recommendation dismissed");
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-[14px] font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <EyeOff size={16} />
                              Dismiss
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Content Wrapper */}
                  <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                    
                    {/* Category & Title */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold tracking-wider text-[#1C4ED1] uppercase">
                        {course.category || "UI/UX DESIGN"} • {course.difficulty || "BEGINNER"}
                      </span>
                      <h3 
                        className="text-[17px] font-bold text-[#040B37] leading-snug group-hover:text-[#1C4ED1] transition-colors line-clamp-2 cursor-pointer animate-duration-300"
                        onClick={() => router.push(`/courses/${course.slug}`)}
                      >
                        {course.title}
                      </h3>
                      <p className="text-[13px] font-medium text-[#4B5563] leading-relaxed line-clamp-2">
                        {course.shortDesc || "Master the foundational skills and practical techniques needed to excel in this field."}
                      </p>
                    </div>

                    {/* Activity & Meta Box */}
                    <div className="flex flex-col gap-3">
                      {/* Meta Tags */}
                      <div className="flex items-center gap-2 text-[11px] font-medium text-[#9CA3AF]">
                        <span>8 Weeks Est.</span>
                        <span className="w-1 h-1 rounded-full bg-[#E3E8F4]"></span>
                        <span className="capitalize">{course.difficulty?.toLowerCase() || 'beginner'}</span>
                      </div>

                      {/* Activity Box */}
                      <div className="border border-[#E3E8F4] rounded-[8px] p-4 flex items-center justify-between gap-3 bg-white mt-auto">
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#4B5563] line-clamp-1">
                            {course.activity}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#9CA3AF]">
                            <div className="w-4 h-4 bg-[#F4F6FB] rounded-[6px] flex items-center justify-center border border-[#E3E8F4] shrink-0">
                              <Image
                                src={course.type === 'Reading' ? '/assets/dashboard/user/check-list.svg' : '/assets/dashboard/user/computer-video-1.svg'}
                                alt=""
                                width={10}
                                height={10}
                                className="w-[10px] h-[10px] object-contain"
                              />
                            </div>
                            <span>{course.type} ({course.duration})</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => openStartModal(course)}
                          className="bg-[#1C4ED1] text-white px-3 py-2 rounded-[8px] text-[10px] font-semibold whitespace-nowrap hover:bg-[#163fa3] transition-all cursor-pointer shadow-sm shrink-0"
                        >
                          Get started
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E3E8F4] rounded-[12px] p-8 text-center flex flex-col items-center justify-center gap-2 shadow-sm min-h-[200px]">
              <p className="text-[16px] font-semibold text-[#040B37]">All caught up!</p>
              <p className="text-[14px] font-medium text-[#9CA3AF] max-w-[320px]">
                You have reviewed all course recommendations. Click "Explore Courses" above to find more.
              </p>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="mlg:col-span-1 space-y-6">
          <div className="bg-white border border-[#E3E8F4] rounded-[12px] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E3E8F4] flex justify-between items-center bg-[#F4F6FB]/30">
              <h2 className="text-[16px] font-semibold text-[#040B37]">Today's Schedule</h2>
              <button className="text-[#1C4ED1] text-[14px] font-semibold flex items-center gap-1 hover:underline">
                Full calendar <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-[#E3E8F4]">
              {data.schedule.map((item) => (
                <div key={item.id} className="p-5 flex items-start gap-5 hover:bg-[#F4F6FB]/50 transition-all cursor-pointer group">
                  <div className="flex flex-col gap-1 min-w-[70px] shrink-0">
                    <p className="text-[14px] font-medium text-[#4B5563] group-hover:text-[#040B37] transition-colors">{item.time}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{item.duration}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-2 h-2 bg-[#1C4ED1] rounded-full shrink-0"></div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[14px] font-medium text-[#4B5563] leading-snug group-hover:text-[#040B37] transition-colors">{item.title}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{item.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedCourse && (
        <>
          <ResumeCourseModal 
            isOpen={activeModal === 'resume'} 
            onClose={closeModals} 
            course={selectedCourse}
            onAction={navigateToPlayer}
          />
          <GetStartedModal 
            isOpen={activeModal === 'start'} 
            onClose={closeModals} 
            course={selectedCourse}
            onAction={navigateToPlayer}
          />
        </>
      )}
    </div>
  );
}
