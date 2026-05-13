'use client';

import React from 'react';
import { Plus, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import Image from 'next/image';

import { ResumeCourseModal, GetStartedModal } from '@/components/dashboard/CourseModals';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const [activeModal, setActiveModal] = React.useState<'resume' | 'start' | null>(null);
  const [selectedCourse, setSelectedCourse] = React.useState<any>(null);
  const { data: session, status } = useSession();
  
  // IDENTITY GUARD: Stay in loading state if authenticated but name is missing
  const isLoading = status === 'loading' || (status === 'authenticated' && !session?.user?.name);
  
  const userName = session?.user?.name?.split(' ')[0] ?? 'Learner';

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

  const handleResumeClick = (course: any) => {
    setSelectedCourse({
      ...course,
      lessonInfo: "Lesson 2 of 7",
      image: "/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg", // From Figma/previous turn
      description: "This is the course player view for the current lesson. You can watch the video, read the transcript, and take notes here."
    });
    setActiveModal('resume');
  };

  const handleStartClick = (course: any) => {
    setSelectedCourse({
      ...course,
      duration: "12h Total",
      image: "/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg",
      description: "Dive deep into the intricacies of this course. Master the foundational principles, advanced techniques, and practical applications required to excel in this field. Start learning today!"
    });
    setActiveModal('start');
  };

  const navigateToPlayer = () => {
    router.push(`/dashboard/player/${selectedCourse?.id || '1'}`);
    setActiveModal(null);
  };

  return (
    <div className="p-[clamp(16px,2.78vw,48px)] space-y-[clamp(32px,4.6vw,80px)] max-w-[1600px] mx-auto">
      {/* Header section - Fluid Scaling */}
      <div className="flex items-center justify-between w-full gap-4">
        <div className="space-y-1">
          {isLoading ? (
            <Skeleton className="h-[clamp(16px,1.15vw,20px)] w-[180px]" />
          ) : (
            <h1 className="text-[clamp(16px,1.15vw,20px)] font-bold text-[#040B37] leading-tight">
              {greeting}, {userName} 👋
            </h1>
          )}
          <p className="text-[clamp(11px,0.81vw,14px)] font-medium text-[#9CA3AF]">
            {currentDate}
          </p>
        </div>
        <button className="bg-[#1C4ED1] text-white px-[clamp(8px,0.92vw,16px)] py-[clamp(6px,0.58vw,10px)] rounded-[8px] flex items-center gap-[clamp(4px,0.46vw,8px)] font-semibold hover:bg-[#1C4ED1]/90 transition-all shrink-0">
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" style={{ width: 'clamp(14px, 1.38vw, 24px)', height: 'clamp(14px, 1.38vw, 24px)' }} />
          <span className="text-[clamp(12px,0.92vw,16px)] whitespace-nowrap">Explore Courses</span>
        </button>
      </div>

      {/* Stats section - 4 Columns from 1024px */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(12px,0.92vw,24px)]">
        <StatCard
          title="Courses Enrolled"
          value="24"
          iconSrc="/assets/dashboard/user/book-open-text.svg"
        />
        <StatCard
          title="Hours Spent"
          value="124h"
          iconSrc="/assets/dashboard/user/hourglass.svg"
        />
        <StatCard
          title="Completion Rate"
          value="68%"
          iconSrc="/assets/dashboard/user/check-list.svg"
        />
        <StatCard
          title="Learning Streak"
          value="10d"
          iconSrc="/assets/dashboard/user/fire-03.svg"
        />
      </div>

      {/* Row 1: Continue Learning & Announcements */}
      <div className="grid grid-cols-1 mlg:grid-cols-4 gap-8 items-start">
        {/* Continue Learning */}
        <div className="mlg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] xl:text-[20px] font-semibold text-[#040B37]">Continue Learning</h2>
            <button className="text-[#1C4ED1] font-medium hover:underline">View all</button>
          </div>

          <div className="bg-white border border-[#E3E8F4] rounded-[12px] p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-[40px] h-[40px] rounded-[6px] border border-[#E3E8F4] overflow-hidden">
                  <div className="bg-blue-100 w-full h-full flex items-center justify-center text-[10px] font-bold text-blue-600">CSCN</div>
                </div>
                <h3 className="text-[18px] font-semibold text-[#040B37]">CSCN</h3>
              </div>
              <button className="text-[#9CA3AF] hover:text-[#4B5563]">
                <MoreHorizontal size={24} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[18px] font-medium text-[#4B5563]">Build Dynamic User Interfaces (UI) for Websites</p>
              <div className="flex items-center gap-4 text-[14px] text-[#9CA3AF]">
                <span>Lesson 2 of 7</span>
                <div className="w-1 h-1 bg-[#9CA3AF] rounded-full"></div>
                <span>50% complete</span>
                <div className="w-1 h-1 bg-[#9CA3AF] rounded-full"></div>
                <span>Estimated completion: 8 Weeks</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-4 bg-[#F4F6FB] rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-[#1C4ED1] rounded-full transition-all duration-1000"></div>
            </div>

            {/* Sub-Task Card */}
            <div className="border border-[#E3E8F4] rounded-sm p-4 flex items-center justify-between bg-white">
              <div className="space-y-2">
                <p className="text-[16px] font-medium text-[#4B5563]">Activity: Create variations of your paper wireframes</p>
                <div className="flex items-center gap-2 text-[#9CA3AF] text-[14px]">
                  <div className="p-1 bg-[#F4F6FB] rounded-md">
                    <Image
                      src="/assets/dashboard/user/computer-video-1.svg"
                      alt=""
                      width={14}
                      height={14}
                      className="w-[14px] h-[14px] object-contain"
                    />
                  </div>
                  <span>Video (5 minutes)</span>
                </div>
              </div>
              <button 
                onClick={() => handleResumeClick({ title: "Activity: Create variations of your paper wireframes", id: "1" })}
                className="bg-[#1C4ED1] text-white px-4 py-2 rounded-sm text-[12px] font-semibold cursor-pointer hover:bg-[#163fa3] transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="mlg:col-span-1 mlg:mt-[48px]">
          <div className="bg-white border border-[#E3E8F4] rounded-[12px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E3E8F4] bg-[#F4F6FB]/10">
              <h2 className="text-[16px] font-semibold text-[#040B37]">Announcements</h2>
            </div>
            <div className="divide-y divide-[#E3E8F4]">
              {[
                { emoji: '📢', title: 'New AI Tools module added to the Web Dev course', time: 'Today, 10:00 AM' },
                { emoji: '🎁', title: 'Pro members get 30% off on certification exams', time: 'Yesterday' },
                { emoji: '📅', title: 'Live Q&A with Product team April 20 at 3PM GMT', time: '2 days ago' },
              ].map((ann, idx) => (
                <div key={idx} className="p-4 flex gap-4 hover:bg-[#F4F6FB]/50 transition-all cursor-pointer">
                  <div className="w-[40px] h-[40px] bg-[#F4F6FB] rounded-xl flex items-center justify-center text-[18px]">
                    {ann.emoji}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[14px] font-medium text-[#4B5563] leading-tight">{ann.title}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{ann.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Recommended & Today's Schedule */}
      <div className="grid grid-cols-1 mlg:grid-cols-4 gap-8 items-start">
        {/* Recommended */}
        <div className="mlg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] xl:text-[20px] font-semibold text-[#040B37]">Recommended For You</h2>
            <button className="text-[#1C4ED1] font-medium hover:underline">View all</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: '2',
                title: 'Build Dynamic User Interfaces (UI) for Websites',
                activity: 'Activity: Create variations of your paper wireframes',
                type: 'Video',
                duration: '5 minutes',
              },
              {
                id: '3',
                title: 'Designing for IOS Interfaces (UI) for beginners',
                activity: 'Activity: Create responsive grids',
                type: 'Video',
                duration: '5 minutes',
              },
              {
                id: '4',
                title: 'Color Theory 303 (Advanced Lesson For UI Designers)',
                activity: 'Activity: Understanding Colors and User Needs',
                type: 'Reading',
                duration: '10 minutes',
              }
            ].map((course, i) => (
              <div
                key={i}
                className="bg-white border border-[#E3E8F4] rounded-[12px] p-[clamp(20px,1.39vw,24px)] flex flex-col min-h-[clamp(280px,17.59vw,304px)] relative"
              >
                {/* Top Row: Logo & More */}
                <div className="flex justify-between items-center mb-[clamp(16px,1.1vw,20px)]">
                  <div className="flex items-center gap-[clamp(12px,0.92vw,16px)]">
                    <div className="w-[clamp(32px,2.31vw,40px)] h-[clamp(32px,2.31vw,40px)] rounded-[6px] border border-[#E3E8F4] overflow-hidden bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                      CSCN
                    </div>
                    <h3 className="text-[clamp(14px,0.92vw,16px)] font-semibold text-[#040B37]">CSCN</h3>
                  </div>
                  <button className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {/* Title Section */}
                <div className="space-y-[clamp(4px,0.46vw,8px)] mb-6">
                  <p className="text-[clamp(14px,0.92vw,16px)] font-medium text-[#4B5563] leading-snug">
                    {course.title}
                  </p>
                  <p className="text-[clamp(11px,0.69vw,12px)] text-[#9CA3AF]">Estimated completion: 8 Weeks</p>
                </div>

                {/* Activity Card - Nested */}
                <div className="border border-[#E3E8F4] border-[0.5px] rounded-[8px] p-[clamp(12px,0.92vw,16px)] space-y-[clamp(8px,0.58vw,10px)] mt-auto">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-[clamp(6px,0.46vw,8px)] flex-1">
                      <p className="text-[clamp(12px,0.81vw,14px)] font-medium text-[#4B5563]">
                        {course.activity}
                      </p>
                      <div className="flex items-center gap-[clamp(4px,0.23vw,6px)] text-[clamp(9px,0.58vw,10px)] text-[#9CA3AF]">
                        <div className="p-[clamp(2px,0.17vw,3px)] bg-[#F4F6FB] rounded-sm shrink-0">
                          <Image
                            src={course.type === 'Reading' ? '/assets/dashboard/user/check-list.svg' : '/assets/dashboard/user/computer-video-1.svg'}
                            alt=""
                            width={10}
                            height={10}
                            className="w-[clamp(8px,0.58vw,10px)] h-[clamp(8px,0.58vw,10px)] object-contain"
                          />
                        </div>
                        <span>{course.type} ({course.duration})</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleStartClick(course)}
                      className="bg-[#1C4ED1] text-white px-[clamp(8px,0.69vw,12px)] py-[clamp(4px,0.35vw,6px)] rounded-sm text-[clamp(9px,0.58vw,10px)] font-semibold whitespace-nowrap hover:bg-[#163fa3] transition-all cursor-pointer"
                    >
                      Get started
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="mlg:col-span-1 mlg:mt-[48px]">
          <div className="bg-white border border-[#E3E8F4] rounded-[12px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E3E8F4] flex justify-between items-center bg-[#F4F6FB]/10">
              <h2 className="text-[16px] font-semibold text-[#040B37]">Today's Schedule</h2>
              <button className="text-[#1C4ED1] text-[14px] font-semibold flex items-center gap-1 hover:underline">
                Full calendar <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-[#E3E8F4]">
              {[
                { time: '2:00 PM', duration: '1h', title: 'React: State Management', type: 'Live Session' },
                { time: '4:30 PM', duration: '3h:30m', title: 'UX Research Quiz', type: 'Assignment · 3 questions' },
                { time: '6:00 PM', duration: '7h:30m', title: 'Figma Workshop', type: 'Recorded · Self-paced' },
              ].map((item, idx) => (
                <div key={idx} className="p-6 flex items-start gap-6 hover:bg-[#F4F6FB]/50 transition-all cursor-pointer">
                  <div className="flex flex-col gap-1 min-w-[70px]">
                    <p className="text-[14px] font-medium text-[#4B5563]">{item.time}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{item.duration}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#1C4ED1] rounded-full"></div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[14px] font-medium text-[#4B5563]">{item.title}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{item.type}</p>
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
            onClose={() => setActiveModal(null)} 
            course={selectedCourse}
            onAction={navigateToPlayer}
          />
          <GetStartedModal 
            isOpen={activeModal === 'start'} 
            onClose={() => setActiveModal(null)} 
            course={selectedCourse}
            onAction={navigateToPlayer}
          />
        </>
      )}
    </div>
  );
}
