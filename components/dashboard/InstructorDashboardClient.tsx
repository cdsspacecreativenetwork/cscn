'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, ArrowUpRight, Users, MoreHorizontal, DollarSign, Star, BookOpen, Share2, EyeOff, Compass } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/lib/store/dashboardStore';
import { ResumeCourseModal, GetStartedModal } from '@/components/dashboard/CourseModals';
import { InstructorDashboardData } from '@/lib/services/dashboard.service';
import { toast } from 'sonner';
import CreatorReadinessCard from '@/components/dashboard/CreatorReadinessCard';
import type { CreatorReadiness } from '@/lib/trust-gates';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/money';

interface Props {
  data: InstructorDashboardData;
  user: any;
  creatorReadiness?: CreatorReadiness;
}

export default function InstructorDashboardClient({ data, user, creatorReadiness }: Props) {
  const router = useRouter();
  const { activeModal, selectedCourse, openResumeModal, openStartModal, closeModals } = useDashboardStore();

  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [dismissedRecs, setDismissedRecs] = React.useState<string[]>([]);
  const [brokenThumbnailIds, setBrokenThumbnailIds] = React.useState<string[]>([]);
  const [isCurrencyUpdating, setIsCurrencyUpdating] = React.useState(false);

  React.useEffect(() => {
    const handleCurrencyPending = (event: Event) => {
      setIsCurrencyUpdating(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener("display-currency-pending", handleCurrencyPending);
    return () => window.removeEventListener("display-currency-pending", handleCurrencyPending);
  }, []);

  const userName = user?.name?.split(' ')[0] ?? 'Instructor';

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
  const currentLearning = data.studentEnrollments.slice(0, 1);
  const markThumbnailBroken = (courseId: string) => {
    setBrokenThumbnailIds((current) => current.includes(courseId) ? current : [...current, courseId]);
  };

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-[clamp(32px,4.6vw,80px)] max-w-[1728px] mx-auto font-jakarta">
      {/* Header section - Fluid Scaling */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
        <div className="space-y-1 w-full">
          <h1 className="text-[clamp(18px,1.25vw,22px)] font-bold text-[#040B37] leading-tight">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-[clamp(12px,0.81vw,14px)] font-medium text-[#9CA3AF]">
            {currentDate}
          </p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          rounded="[10px]"
          hasBorder={false}
          className="w-full sm:w-auto"
          onClick={() => router.push('/dashboard/instructor/courses')}
          leftIcon={<Plus size={18} className="sm:w-[20px] sm:h-[20px]" />}
        >
          Manage Studio
        </Button>
      </div>

      {creatorReadiness && <CreatorReadinessCard readiness={creatorReadiness} />}

      {/* Stats section - Creator At-a-Glance with curated premium Lucide icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(16px,1.39vw,24px)]">
        <StatCard
          title="Total Students"
          value={data.totalStudents.toLocaleString()}
          icon={<Users className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
        <StatCard
          title="Revenue This Month"
          value={
            isCurrencyUpdating ? (
              <span className="block h-8 w-28 animate-pulse rounded-md bg-[#1C4ED1]/5" />
            ) : (
              formatCurrency(data.monthlyRevenue, data.earningsCurrency, "en-US")
            )
          }
          icon={<DollarSign className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
        <StatCard
          title="Avg Course Rating"
          value={data.isNewInstructor ? "0.0 ★" : `${data.avgCourseRating} ★`}
          icon={<Star className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
        <StatCard
          title="Active Courses"
          value={data.activeCoursesCount}
          icon={<BookOpen className="text-[#1C4ED1]" size={20} strokeWidth={2.2} />}
        />
      </div>

      {data.isNewInstructor ? (
        /* Onboarding welcome & checklist for new instructors */
        <div className="bg-[#FFFFFF] border border-[#E3E8F4] rounded-[16px] p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-center justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4F6FB] rounded-full text-[12px] font-semibold text-[#1C4ED1]">
              <Compass size={14} />
              <span>Instructor Setup Guide</span>
            </div>
            <h2 className="text-[22px] md:text-[26px] font-bold text-[#040B37] leading-tight">
              Welcome to the CSCN Instructor Portal!
            </h2>
            <p className="text-[15px] font-medium text-[#4B5563] leading-relaxed">
              Let's launch your teaching presence. Complete these quick steps to set up your profile and publish your first course. Once published, your students will see your courses here.
            </p>
            
            {/* Checklist items */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F4F6FB] border border-[#1C4ED1]/30 flex items-center justify-center text-[#1C4ED1] shrink-0 mt-0.5 font-bold text-[11px]">
                  1
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#040B37]">Create your course draft in the studio</p>
                  <p className="text-[13px] font-medium text-[#9CA3AF]">
                    Go to the Course Studio and draft your syllabus, modules, and lessons.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F4F6FB] border border-[#1C4ED1]/30 flex items-center justify-center text-[#1C4ED1] shrink-0 mt-0.5 font-bold text-[11px]">
                  2
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#040B37]">Complete your instructor profile biography</p>
                  <p className="text-[13px] font-medium text-[#9CA3AF]">
                    Add your bio, locations, and social media handles in your Profile settings.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F4F6FB] border border-[#1C4ED1]/30 flex items-center justify-center text-[#1C4ED1] shrink-0 mt-0.5 font-bold text-[11px]">
                  3
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#040B37]">Configure your payout details</p>
                  <p className="text-[13px] font-medium text-[#9CA3AF]">
                    Link your payout account in Settings to start earning from enrollments.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto shrink-0">
            <Button
              variant="primary"
              size="md"
              rounded="[10px]"
              hasBorder={false}
              onClick={() => router.push('/dashboard/instructor/courses')}
              leftIcon={<Plus size={18} />}
            >
              Create Course Draft
            </Button>
            <Button
              variant="outline"
              size="md"
              rounded="[10px]"
              hasBorder={false}
              onClick={() => router.push('/dashboard/profile')}
            >
              Edit Profile Bio
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Row 1: My Courses (Horizontal Scroll Container) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] xl:text-[20px] font-semibold text-[#040B37]">My Courses</h2>
              <button 
                onClick={() => router.push('/dashboard/instructor/courses')}
                className="text-[#1C4ED1] font-medium hover:underline text-[15px] cursor-pointer"
              >
                View studio
              </button>
            </div>

            {/* Horizontal Scroll */}
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x scroll-smooth">
              {data.myCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => router.push(`/dashboard/instructor/courses/${course.id}`)}
                  className="bg-white border border-[#E3E8F4] rounded-[12px] p-[clamp(16px,1.1vw,20px)] flex flex-col min-w-[320px] max-w-[360px] shrink-0 snap-start cursor-pointer group hover:shadow-[0px_4px_12px_rgba(23,26,31,0.08)] transition-all duration-300 relative"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] w-full rounded-[8px] overflow-hidden mb-4 bg-[#F4F6FB]">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,_rgba(28,78,209,0.14),_transparent_42%),linear-gradient(135deg,#F8FAFF_0%,#EEF3FF_100%)] text-center">
                        <BookOpen size={26} className="text-[#1C4ED1]/60" />
                        <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1C4ED1]">
                          Add thumbnail
                        </span>
                      </div>
                    )}
                    {/* Status Pill */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold tracking-wide uppercase shadow-sm ${
                        course.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 justify-between space-y-4">
                    <h3 className="text-[16px] font-semibold text-[#040B37] group-hover:text-[#1C4ED1] transition-colors line-clamp-2 leading-snug">
                      {course.title}
                    </h3>

                    <div className="flex items-center justify-between border-t border-[#E3E8F4] pt-4 mt-auto">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[#9CA3AF]" />
                        <span className="text-[14px] font-medium text-[#4B5563]">{course.enrollmentCount.toLocaleString()} Students</span>
                      </div>
                      <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">
                        {course.status === 'PUBLISHED' ? 'Live course' : 'Setup needed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Persistent Create New Course Card */}
              <div
                onClick={() => router.push('/dashboard/instructor/courses')}
                className="bg-[#F4F6FB]/50 border-2 border-dashed border-[#1C4ED1]/30 rounded-[12px] p-6 flex flex-col items-center justify-center min-w-[320px] shrink-0 snap-start cursor-pointer hover:bg-[#F4F6FB] hover:border-[#1C4ED1] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-[#E3E8F4] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#1C4ED1] group-hover:text-white transition-all shadow-sm">
                  <Plus size={24} className="text-[#1C4ED1] group-hover:text-white transition-colors" />
                </div>
                <p className="text-[16px] font-semibold text-[#040B37] group-hover:text-[#1C4ED1] transition-colors">Create New Course</p>
                <p className="text-[13px] text-[#9CA3AF] text-center mt-1">Launch your next masterclass</p>
              </div>
            </div>
          </div>

          {/* Row 2: Your Learning Activity & Announcements */}
          {data.studentEnrollments.length > 0 && (
            <div className="grid grid-cols-1 mlg:grid-cols-4 gap-8 items-start">
              {/* Learning Activity */}
              <div className="mlg:col-span-3 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] xl:text-[20px] font-semibold text-[#040B37]">Your Learning Activity</h2>
                    <p className="text-[13px] text-[#9CA3AF] mt-0.5">Courses you are currently enrolled in as a student</p>
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard/courses')}
                    className="text-[#1C4ED1] font-medium hover:underline text-[15px]"
                  >
                    View all learning
                  </button>
                </div>

                <div className="space-y-6">
                  {currentLearning.map((enrollment) => (
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
                        <Button 
                        variant="gradient"
          size="sm"
          rounded="[10px]"
          hasBorder={false}
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
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Announcements */}
              <div className="mlg:col-span-1 space-y-6 mlg:pt-[42px]">
                <div className="bg-white border border-[#E3E8F4] rounded-[12px] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[#E3E8F4] bg-[#F4F6FB]/30">
                    <h2 className="text-[16px] font-semibold text-[#040B37]">Announcements</h2>
                  </div>
                  <div className="divide-y divide-[#E3E8F4]">
                    {data.announcements.length > 0 ? (
                      data.announcements.map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() => ann.linkUrl && window.open(ann.linkUrl, '_blank', 'noopener,noreferrer')}
                          className={`p-5 flex gap-4 hover:bg-[#F4F6FB]/50 transition-all group ${ann.linkUrl ? 'cursor-pointer' : ''}`}
                        >
                          <div className="w-10 h-10 bg-[#F4F6FB] rounded-xl flex items-center justify-center text-[18px] shrink-0 group-hover:scale-105 transition-transform">
                            {ann.emoji}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[14px] font-medium text-[#4B5563] leading-snug group-hover:text-[#040B37] transition-colors">{ann.title}</p>
                            {ann.body && <p className="line-clamp-2 text-[12px] font-medium text-[#9CA3AF]">{ann.body}</p>}
                            <p className="text-[11px] font-medium text-[#9CA3AF]">{ann.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-[14px] font-semibold text-[#4B5563]">No announcements right now</p>
                        <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">
                          Platform updates will appear here when they are published.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Row 3: Recommended For You (Discovery Row) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] xl:text-[20px] font-semibold text-[#040B37]">Recommended For You</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">Explore courses to expand your skill set</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/courses')}
            className="text-[#1C4ED1] font-medium hover:underline text-[15px]"
          >
            View all
          </button>
        </div>

        {visibleRecs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRecs.map((course: any, i) => (
              <div
                key={course.id || i}
                className="bg-[#FFFFFF] border border-[#E3E8F4] rounded-[16px] overflow-hidden flex flex-col w-full shadow-sm hover:shadow-[0px_6px_20px_rgba(23,26,31,0.08)] transition-all duration-300 group relative"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-[16/9] w-full bg-[#F4F6FB] overflow-hidden shrink-0">
                  {course.thumbnail && !brokenThumbnailIds.includes(course.id) ? (
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => router.push(`/courses/${course.slug}`)}
                      onError={() => markThumbnailBroken(course.id)}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,_rgba(28,78,209,0.16),_transparent_42%),linear-gradient(135deg,#F8FAFF_0%,#EEF3FF_100%)]"
                      onClick={() => router.push(`/courses/${course.slug}`)}
                    >
                      <BookOpen size={28} className="text-[#1C4ED1]/60" />
                      <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1C4ED1]">
                        Course preview
                      </span>
                    </div>
                  )}
                  
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#1C4ED1] shadow-sm backdrop-blur-sm">
                    {course.difficulty?.toLowerCase() || 'beginner'}
                  </span>

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
                <div className="p-5 flex flex-col flex-1 gap-4">
                  
                  {/* Category & Title */}
                  <div>
                    <h3 
                      className="text-[17px] font-bold text-[#040B37] leading-snug group-hover:text-[#1C4ED1] transition-colors line-clamp-2 cursor-pointer"
                      onClick={() => router.push(`/courses/${course.slug}`)}
                    >
                      {course.title}
                    </h3>
                  </div>

                  {/* Activity & Meta Box */}
                  <div className="mt-auto flex flex-col gap-3">
                    {/* Meta Tags */}
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#9CA3AF]">
                      <span>8 Weeks Est.</span>
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
                      <Button
                        variant="gradient"
                        size="sm"
                        rounded="[10px]"
                        hasBorder={false}
                        onClick={() => openStartModal({
                          ...course,
                          image: course.thumbnail || '/assets/default-course.jpg',
                          description: course.shortDesc || undefined,
                        })}
                        className="shrink-0 px-3 py-2 text-[10px]"
                      >
                        Get started
                      </Button>
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
