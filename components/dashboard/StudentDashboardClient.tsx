'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, ArrowUpRight, MoreHorizontal, GraduationCap, Clock, Clock3, CheckCircle2, Flame, Share2, EyeOff, RotateCcw } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/lib/store/dashboardStore';
import { ResumeCourseModal, GetStartedModal } from '@/components/dashboard/CourseModals';
import { StudentDashboardData } from '@/lib/services/dashboard.service';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { LearnerPageHeader } from '@/components/dashboard/learner/LearnerPageHeader';

interface DashboardUser {
  name?: string | null;
}

interface Props {
  data: StudentDashboardData;
  user: DashboardUser | null;
  instructorApplication?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    reviewDueAt: string;
  } | null;
}

export default function StudentDashboardClient({ data, user, instructorApplication }: Props) {
  const router = useRouter();
  const { activeModal, selectedCourse, openResumeModal, openStartModal, closeModals } = useDashboardStore();

  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [dismissedRecs, setDismissedRecs] = React.useState<string[]>([]);
  const [brokenThumbnailIds, setBrokenThumbnailIds] = React.useState<string[]>([]);

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
  const currentLearning = data.activeEnrollments.slice(0, 1);
  const hasLearningActivity = currentLearning.length > 0;
  const markThumbnailBroken = (courseId: string) => {
    setBrokenThumbnailIds((current) => current.includes(courseId) ? current : [...current, courseId]);
  };

  return (
    <div className="mx-auto flex max-w-[1728px] flex-col gap-8 p-[clamp(16px,2.78vw,48px)]">
      {/* Header section - Fluid Scaling */}
      <LearnerPageHeader
        title={`${greeting}, ${userName} 👋`}
        description={currentDate}
        action={<Button
          variant="primary"
          size="sm"
          rounded="[10px]"
          className="w-full sm:w-auto"
          hasBorder={false}
          onClick={() => router.push('/courses')}
          leftIcon={<Plus size={18} className="sm:w-[20px] sm:h-[20px]" />}
        >
          Explore Courses
        </Button>}
      />

      {instructorApplication?.status === 'PENDING' && (
        <Alert className="border-amber-200 bg-amber-50 p-5 sm:p-6">
          <Clock3 aria-hidden="true" className="mt-0.5 size-5 text-amber-700" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <AlertTitle>Instructor application pending approval</AlertTitle>
              <AlertDescription>
                Submitted {new Date(instructorApplication.submittedAt).toLocaleDateString('en-NG')}. CSCN reviews applications within 48 hours; your review target is{' '}
                {new Date(instructorApplication.reviewDueAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}.
              </AlertDescription>
            </div>
            <Button variant="outline" size="sm" rounded="full" onClick={() => router.push('/instructors?apply=1')}>
              View application
            </Button>
          </div>
        </Alert>
      )}

      {instructorApplication?.status === 'REJECTED' && (
        <Alert className="border-stroke-ii bg-background p-5 sm:p-6">
          <RotateCcw aria-hidden="true" className="mt-0.5 size-5 text-primary" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <AlertTitle>Review your instructor application</AlertTitle>
              <AlertDescription>
                Your previous application was not approved. Update your details and submit a new application when you are ready.
              </AlertDescription>
            </div>
            <Button variant="primary" size="sm" rounded="full" onClick={() => router.push('/instructors?apply=1')}>
              Apply again
            </Button>
          </div>
        </Alert>
      )}

      {/* Stats section - 4 Columns with curated premium Lucide icons */}
      {hasLearningActivity ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
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
      </div> : null}

      {/* Row 1: Continue Learning & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Continue Learning */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          <div className="flex items-center justify-between min-h-[32px]">
            <h2 className="text-[18px] xl:text-[20px] font-medium text-[#040B37]">
              {hasLearningActivity ? 'Continue Learning' : 'Start Your Learning Journey'}
            </h2>
            {hasLearningActivity ? (
              <button
                onClick={() => router.push('/dashboard/courses')}
                className="text-[#1C4ED1] font-medium hover:underline text-[15px]"
              >
                View all
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            {hasLearningActivity ? currentLearning.map((enrollment) => (
              <Card
                key={enrollment.id}
                className="gap-6 px-6 [--card-spacing:24px] transition-colors duration-300"
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
                  <h3 className="text-[16px] sm:text-[18px] font-medium text-[#040B37] leading-snug line-clamp-2">
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
                <div className="h-4 w-full overflow-hidden rounded-full bg-background">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-1000 motion-reduce:transition-none" style={{ width: `${enrollment.progressPercent}%` }}></div>
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
                    variant="primary"
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
              </Card>
            )) : null}
          </div>
        </div>

        {/* Announcements */}
        <div className="lg:col-span-1 lg:pt-[44px]">
          <Card className="[--card-spacing:0px]">
            <div className="px-5 py-4 border-b border-[#E3E8F4] bg-white">
              <h2 className="text-base font-semibold tracking-tight text-navy">
                Announcements
              </h2>
            </div>

            <div className="divide-y divide-[#E3E8F4]">
              {data.announcements.length > 0 ? (
                data.announcements.map((ann) => {
                  const announcementContent = (
                    <>
                    <div className="w-9 h-9 bg-[#F4F6FB] rounded-lg border border-[#E3E8F4]/60 flex items-center justify-center text-[16px] shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                      {ann.emoji}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#040B37] leading-snug group-hover:text-[#1C4ED1] transition-colors">{ann.title}</p>
                      {ann.body && <p className="line-clamp-2 text-[12px] font-normal text-[#4B5563] leading-relaxed">{ann.body}</p>}
                      <p className="mt-0.5 text-xs font-medium text-text-mute">{ann.time}</p>
                    </div>
                    </>
                  );
                  const itemClassName = 'group flex items-start gap-3.5 p-4 transition-colors hover:bg-[#F4F6FB]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40';

                  return ann.linkUrl ? (
                    <a key={ann.id} href={ann.linkUrl} target="_blank" rel="noopener noreferrer" className={itemClassName}>
                      {announcementContent}
                    </a>
                  ) : (
                    <article key={ann.id} className={itemClassName}>
                      {announcementContent}
                    </article>
                  );
                })
              ) : (
                <div className="p-6 text-center">
                  <p className="text-[14px] font-semibold text-[#040B37]">No announcements right now</p>
                  <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">
                    Platform updates will appear here when they are published.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Recommended For You & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Recommended */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between h-7">
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-[#040B37]">
              {hasLearningActivity ? 'Recommended For You' : 'Popular Courses To Start'}
            </h2>
            <button
              onClick={() => router.push('/courses')}
              className="text-[#1C4ED1] font-semibold hover:underline text-[13px]"
            >
              View all
            </button>
          </div>
          {visibleRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleRecs.map((course, i) => (
                <Card
                  key={course.id || i}
                className="group relative w-full [--card-spacing:0px] transition-colors duration-300"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/9] w-full bg-[#F4F6FB] overflow-hidden shrink-0">
                    {course.thumbnail && !brokenThumbnailIds.includes(course.id) ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/courses/${course.slug}`)}
                        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        aria-label={`View ${course.title}`}
                      >
                        <Image
                          src={course.thumbnail}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                          onError={() => markThumbnailBroken(course.id)}
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`View ${course.title}`}
                        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,_rgba(28,78,209,0.16),_transparent_42%),linear-gradient(135deg,#F8FAFF_0%,#EEF3FF_100%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        onClick={() => router.push(`/courses/${course.slug}`)}
                      >
                        <GraduationCap size={28} className="text-[#1C4ED1]/60" />
                        <span className="text-xs font-semibold text-primary">
                          Course preview
                        </span>
                      </button>
                    )}
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm">
                      {course.difficulty?.toLowerCase() || 'beginner'}
                    </span>

                    {/* Floating Options Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)}
                        className="flex size-10 cursor-pointer items-center justify-center rounded-[8px] bg-white/90 text-text-body shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        aria-label={`Course actions for ${course.title}`}
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
                        className="text-[17px] font-semibold text-[#040B37] leading-snug group-hover:text-[#1C4ED1] transition-colors line-clamp-2 cursor-pointer animate-duration-300"
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
                          variant="primary"
                          size="sm"
                          rounded="[10px]"
                          hasBorder={false}
                          onClick={() => openStartModal({
                            ...course,
                            image: course.thumbnail || '/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg',
                            description: course.shortDesc || undefined,
                          })}
                          className="shrink-0 px-3 py-2 text-[10px]"
                        >
                          Get started
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="[--card-spacing:32px] gap-2 px-8 text-center items-center justify-center min-h-[200px]">
              <p className="text-[16px] font-semibold text-[#040B37]">All caught up!</p>
              <p className="text-[14px] font-medium text-[#9CA3AF] max-w-[320px]">
                You have reviewed all course recommendations. Click Explore Courses above to find more.
              </p>
            </Card>
          )}
        </div>

        {/* Schedule */}
        <div className="lg:col-span-1 lg:pt-[44px]">
          <Card className="[--card-spacing:0px]">
            <div className="px-5 py-4 border-b border-[#E3E8F4] flex justify-between items-center bg-white">
              <h2 className="text-[15px] font-bold text-[#040B37] tracking-tight">
                Today&apos;s Schedule
              </h2>
              <button
                onClick={() => router.push('/dashboard/schedule')}
                className="text-[#1C4ED1] font-semibold hover:underline text-[13px] flex items-center gap-1 cursor-pointer"
              >
                Full calendar <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-[#E3E8F4]">
              {data.schedule.length > 0 ? (
                data.schedule.map((item) => (
                  <article key={item.id} className="group flex items-start gap-3 p-4 transition-colors hover:bg-[#F4F6FB]/50">
                    <div className="flex flex-col gap-0.5 min-w-[62px] shrink-0">
                      <p className="text-[12px] font-semibold text-[#040B37] group-hover:text-[#1C4ED1] transition-colors">{item.time}</p>
                      <p className="text-[10px] font-normal text-[#9CA3AF]">{item.duration}</p>
                    </div>
                    <div className="w-2 h-2 bg-[#1C4ED1] rounded-full shrink-0 mt-1.5"></div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#040B37] leading-snug group-hover:text-[#1C4ED1] transition-colors line-clamp-2">{item.title}</p>
                      <p className="text-[11px] font-normal text-[#9CA3AF]">{item.type}</p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-[14px] font-semibold text-[#040B37]">No scheduled items today</p>
                  <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">
                    Live sessions, deadlines, and mentorship bookings will appear here.
                  </p>
                </div>
              )}
            </div>
          </Card>
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
