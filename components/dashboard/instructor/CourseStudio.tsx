'use client';

import { useState, useTransition, useEffect } from 'react';
import type { ComponentProps } from 'react';
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

type Tab = 'settings' | 'curriculum' | 'analytics' | 'instructors' | 'feedback';

interface StudioLesson {
  id: string; title: string; position: number;
  videoUrl: string | null; duration: number | null;
  isPublished: boolean; isPreview: boolean; transcript: string | null;
  bodyContent: string | null;
  contentType: string;
  resources: { id: string; title: string; url: string; type: string }[];
  muxStatus: string;
  muxPlaybackId: string | null;
}

interface StudioModule {
  id: string; title: string; position: number;
  isPublished: boolean;
  lessons: StudioLesson[];
}

interface StudioCourse {
  id: string; title: string; slug: string;
  description: string; shortDesc: string | null;
  thumbnail: string | null; promoVideo?: string | null; difficulty: string;
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
  openFeedbackCount,
  initialRosterData,
  initialFeedbackData,
}: Props) {
  const router = useRouter();
  const validTabs: Tab[] = ['settings', 'curriculum', 'analytics', 'instructors', 'feedback'];
  const [activeTab, setActiveTab] = useState<Tab>(
    validTabs.includes(initialTab as Tab) ? (initialTab as Tab) : 'settings'
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
        setStatus('PENDING_REVIEW');
        toast.success('Course submitted for review!');
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
    setActiveTab(tab);
    const base = isAdmin ? '/dashboard/admin/courses' : '/dashboard/instructor/courses';
    router.replace(`${base}/${course.id}?tab=${tab}`, { scroll: false });
  };

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const isPublished = status === 'PUBLISHED';
  const isLocked = status === 'PENDING_REVIEW' && !isAdmin;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'instructors', label: 'Instructors' },
    { id: 'feedback', label: 'Feedback', badge: openFeedbackCount > 0 ? openFeedbackCount : undefined },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen bg-background font-jakarta">
      {/* Studio header */}
      <div className="bg-white border-b border-stroke px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={isAdmin ? '/dashboard/admin/courses' : '/dashboard/instructor/courses'}
            className="text-text-mute hover:text-primary transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-navy text-base lg:text-lg truncate">{course.title}</h1>
            <p className="text-xs text-text-mute">/{course.slug}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={
              status === 'PUBLISHED'
                ? `/courses/${course.slug}`
                : `/courses/${course.slug}?preview=true`
            }
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-body border border-stroke rounded-xl hover:bg-background transition-colors"
          >
            <Eye size={14} /> Preview
          </Link>

          {isAdmin ? (
            // Admin: direct publish / unpublish
            <button
              onClick={handleTogglePublish}
              disabled={publishing}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                isPublished
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isPublished ? <EyeOff size={14} /> : <Globe size={14} />}
              {publishing ? 'Updating…' : isPublished ? 'Unpublish' : 'Publish'}
            </button>
          ) : status === 'PENDING_REVIEW' ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-amber-100 text-amber-700 cursor-default">
                <Send size={14} /> In Review
              </span>
              <button
                onClick={handleWithdrawFromReview}
                disabled={publishing}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                Withdraw
              </button>
            </div>
          ) : isPublished ? (
            <button
              onClick={handleTogglePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <EyeOff size={14} />
              {publishing ? 'Updating…' : 'Unpublish'}
            </button>
          ) : (
            <button
              onClick={handleSubmitForReview}
              disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {publishing ? 'Submitting…' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-stroke px-6 py-3">
        <div className="flex items-center gap-[4px] bg-[#E3E8F4] p-[4px] rounded-[12px] w-fit">
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
      
      {isLocked && (
        <div className="mx-6 lg:mx-8 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 shrink-0">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <div className="text-sm font-medium">
            This course is currently pending admin review. All editing has been locked. Click <strong className="text-amber-950 font-bold">Withdraw</strong> above if you need to modify the course content.
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 p-6 lg:p-8 max-w-[1728px] mx-auto w-full">
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
