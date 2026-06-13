'use client';

import { useState, useTransition, useEffect } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Globe, EyeOff, Send, AlertTriangle } from 'lucide-react';
import { togglePublishAction, submitForReviewAction, withdrawFromReviewAction } from '@/actions/instructor';
import { adminTogglePublishAction } from '@/actions/admin-courses';
import { toast } from 'sonner';
import CourseSettingsForm from './CourseSettingsForm';
import CurriculumBuilder from './CurriculumBuilder';
import CourseAnalyticsTab from './CourseAnalyticsTab';
import InstructorRosterTab from './InstructorRosterTab';
import FeedbackTab from './FeedbackTab';
import type { LessonQuiz } from './QuizLessonBuilder';

type Tab = 'settings' | 'curriculum' | 'analytics' | 'instructors' | 'feedback';

interface StudioLesson {
  id: string; title: string; position: number;
  videoUrl: string | null; duration: number | null;
  isPublished: boolean; isPreview: boolean; overview: string | null; transcript: string | null;
  bodyContent: string | null;
  contentType: string;
  quiz: LessonQuiz;
  resources: { id: string; title: string; url: string; type: string }[];
  muxStatus: string;
  muxPlaybackId: string | null;
}

interface StudioModule {
  id: string; title: string; position: number;
  isPublished: boolean;
  isDefault: boolean;
  lessons: StudioLesson[];
}

interface StudioCourse {
  id: string; title: string; slug: string;
  description: string; shortDesc: string | null;
  thumbnail: string | null; promoVideo?: string | null; difficulty: string; courseType?: string;
  status: string; previewCount: number;
  categoryId: string | null;
  requirements: unknown; includes: unknown;
  certificateEnabled: boolean;
  examGated: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  price: unknown;
  baseCurrency?: string;
  instructor?: { payoutDetails?: { preferredCurrency?: unknown } | null };
  pricingProposals?: {
    id: string;
    proposedPrice: unknown;
    currentPriceSnapshot: unknown;
    currency: string;
    status: string;
    adminNote: string | null;
    createdAt: Date | string;
    reviewedAt: Date | string | null;
  }[];
  finalExamId: string | null;
  revision?: {
    id: string;
    version: number;
    status: string;
    submittedAt: Date | string | null;
    changeSummary: unknown;
  };
  modules: StudioModule[];
}

interface Category { id: string; name: string }

interface LatestReview {
  id: string;
  status: string;
  comment: string | null;
  addressedAt: Date | null;
  createdAt: Date;
  reviewer: { name: string | null; image: string | null };
}

interface Props {
  course: StudioCourse;
  categories: Category[];
  analytics: unknown;
  initialTab: Tab | string;
  isAdmin: boolean;
  callerRole: string | null;
  latestReview: LatestReview | null;
  currentUserId: string;
  openFeedbackCount: number;
  initialRosterData?: ComponentProps<typeof InstructorRosterTab>['initialData'];
  initialFeedbackData?: ComponentProps<typeof FeedbackTab>['initialItems'];
  adminReviewSlot?: ReactNode;
}

const STATUS_CONFIG = {
  DRAFT:          { label: 'Draft',     classes: 'bg-gray-100 text-gray-600' },
  PUBLISHED:      { label: 'Published', classes: 'bg-green-100 text-green-700' },
  PENDING_REVIEW: { label: 'In Review', classes: 'bg-amber-100 text-amber-700' },
  ARCHIVED:       { label: 'Archived',  classes: 'bg-red-100 text-red-600' },
} as Record<string, { label: string; classes: string }>;

export default function CourseStudio({
  course,
  categories,
  analytics,
  initialTab,
  isAdmin,
  latestReview,
  currentUserId,
  callerRole,
  openFeedbackCount,
  initialRosterData,
  initialFeedbackData,
  adminReviewSlot,
}: Props) {
  const router = useRouter();
  const validTabs: Tab[] = ['settings', 'curriculum', 'analytics', 'instructors', 'feedback'];
  const isTeachingAssistant = callerRole === 'TEACHING_ASSISTANT';
  const allowedTabs: Tab[] = isTeachingAssistant ? ['curriculum', 'feedback'] : validTabs;
  const [activeTab, setActiveTab] = useState<Tab>(
    allowedTabs.includes(initialTab as Tab) ? (initialTab as Tab) : isTeachingAssistant ? 'curriculum' : 'settings'
  );
  const [status, setStatus] = useState(course.status);
  const [publishing, startPublish] = useTransition();

  // Silently refresh server data every 30s so changes by other users appear without a manual reload
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  const handleTogglePublish = () => {
    startPublish(async () => {
      try {
        const result = isAdmin
          ? await adminTogglePublishAction(course.id)
          : await togglePublishAction(course.id);
        setStatus(result.status);
        toast.success(result.status === 'PUBLISHED' ? 'Course published!' : 'Course unpublished.');
      } catch {
        toast.error('Failed to update publish status.');
      }
    });
  };

  const handleSubmitForReview = () => {
    startPublish(async () => {
      try {
        await submitForReviewAction(course.id);
        if (!isPublished) setStatus('PENDING_REVIEW');
        toast.success(isPublished ? 'Course update submitted for review!' : 'Course submitted for review!');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit for review.');
      }
    });
  };

  const handleWithdrawFromReview = () => {
    startPublish(async () => {
      try {
        await withdrawFromReviewAction(course.id);
        setStatus('DRAFT');
        toast.success('Course submission withdrawn.');
      } catch {
        toast.error('Failed to withdraw course submission.');
      }
    });
  };

  const handleTabChange = (tab: Tab) => {
    if (!allowedTabs.includes(tab)) return;
    setActiveTab(tab);
    const base = isAdmin ? '/dashboard/admin/courses' : '/dashboard/instructor/courses';
    router.replace(`${base}/${course.id}?tab=${tab}`, { scroll: false });
  };

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const isPublished = status === 'PUBLISHED';
  const hasRevision = Boolean(course.revision);
  const revisionPending = course.revision?.status === 'PENDING_REVIEW';
  const isLocked = (status === 'PENDING_REVIEW' || revisionPending) && !isAdmin;
  const submitLabel = isPublished ? 'Submit Update for Review' : 'Submit for Review';

  const baseTabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'instructors', label: 'Instructors' },
    { id: 'feedback', label: 'Feedback', badge: openFeedbackCount > 0 ? openFeedbackCount : undefined },
  ];
  const tabs = baseTabs.filter((tab) => allowedTabs.includes(tab.id));

  return (
    <div className="flex min-h-full flex-col bg-background font-jakarta">
      {/* Studio header */}
      <div className="z-30 flex flex-col gap-4 border-b border-stroke bg-white px-4 py-4 sm:px-6 lg:sticky lg:top-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <Link
            href={isAdmin ? '/dashboard/admin/courses' : '/dashboard/instructor/courses'}
            className="mt-1 text-text-mute hover:text-primary transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-bold text-navy text-base leading-snug sm:text-lg">
              {course.title}
            </h1>
            <p className="mt-1 break-all text-xs leading-snug text-text-mute">/{course.slug}</p>
          </div>
          <span className={`mt-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto lg:shrink-0 lg:justify-end">
          <Link
            href={
              status === 'PUBLISHED'
                ? `/courses/${course.slug}`
                : `/courses/${course.slug}?preview=true`
            }
            target="_blank"
            className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-body border border-stroke rounded-xl hover:bg-background transition-colors"
          >
            <Eye size={14} /> Preview
          </Link>

          {isTeachingAssistant ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-primary">
              Teaching assistant
            </span>
          ) : isAdmin ? (
            // Admin: direct publish / unpublish
            <button
              onClick={handleTogglePublish}
              disabled={publishing}
                className={`flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                isPublished
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isPublished ? <EyeOff size={14} /> : <Globe size={14} />}
              {publishing ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
            </button>
          ) : status === 'PENDING_REVIEW' ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-amber-100 text-amber-700 cursor-default">
                <Send size={14} /> In Review
              </span>
              <button
                onClick={handleWithdrawFromReview}
                disabled={publishing}
                className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                Withdraw
              </button>
            </div>
          ) : isPublished ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSubmitForReview}
                disabled={publishing || revisionPending}
                className="flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
                {publishing ? 'Submitting...' : revisionPending ? 'Update In Review' : submitLabel}
              </button>
              {revisionPending && (
                <button
                  onClick={handleWithdrawFromReview}
                  disabled={publishing}
                  className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Withdraw
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleSubmitForReview}
              disabled={publishing}
              className="flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {publishing ? 'Submitting...' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stroke bg-white px-4 py-3 sm:px-6">
        <div className="admin-horizontal-scrollbar -mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4 pb-1 sm:mx-0 sm:max-w-full sm:px-0">
          <div className="flex min-w-max items-center gap-[4px] rounded-[12px] bg-[#E3E8F4] p-[4px]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-[12px] py-[8px] rounded-[8px] font-jakarta font-medium text-[14px] tracking-[-0.28px] transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-navy drop-shadow-[0px_4px_2px_rgba(0,0,0,0.12)]'
                    : 'text-[#9CA3AF] hover:text-text-body'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {adminReviewSlot}
      
      {isLocked && (
        <div className="mx-6 lg:mx-8 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 shrink-0">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <div className="text-sm font-medium">
            This course update is currently pending admin review. Editing is locked until review is completed. Use <strong className="text-amber-950 font-bold">Withdraw</strong> above if you need to modify it.
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="mx-auto w-full max-w-[1728px] flex-1 p-4 pb-28 sm:p-6 lg:p-8">
        {activeTab === 'settings' && (
          <CourseSettingsForm course={course} categories={categories} latestReview={latestReview} isLocked={isLocked} />
        )}
        {activeTab === 'curriculum' && (
          <CurriculumBuilder courseId={course.id} courseTitle={course.title} courseSlug={course.slug} initialModules={course.modules} isAdmin={isAdmin} isLocked={isLocked} />
        )}
        {activeTab === 'analytics' && (
          <CourseAnalyticsTab courseId={course.id} data={analytics} />
        )}
        {activeTab === 'instructors' && (
          <InstructorRosterTab courseId={course.id} isAdmin={isAdmin} initialData={initialRosterData} />
        )}
        {activeTab === 'feedback' && (
          <FeedbackTab courseId={course.id} isAdmin={isAdmin} currentUserId={currentUserId} initialItems={initialFeedbackData} />
        )}
      </div>
    </div>
  );
}
