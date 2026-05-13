'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Globe, EyeOff, Send } from 'lucide-react';
import { togglePublishAction, submitForReviewAction } from '@/actions/instructor';
import { adminTogglePublishAction } from '@/actions/admin-courses';
import { toast } from 'sonner';
import CourseSettingsForm from './CourseSettingsForm';
import CurriculumBuilder from './CurriculumBuilder';
import CourseAnalyticsTab from './CourseAnalyticsTab';
import InstructorRosterTab from './InstructorRosterTab';

type Tab = 'settings' | 'curriculum' | 'analytics' | 'instructors';

interface StudioLesson {
  id: string; title: string; position: number;
  videoUrl: string | null; duration: number | null;
  isPreview: boolean; transcript: string | null;
  contentType: string;
  resources: { id: string; title: string; url: string; type: string }[];
}

interface StudioModule {
  id: string; title: string; position: number;
  lessons: StudioLesson[];
}

interface StudioCourse {
  id: string; title: string; slug: string;
  description: string; shortDesc: string | null;
  thumbnail: string | null; difficulty: string;
  status: string; previewCount: number;
  categoryId: string | null;
  requirements: unknown; includes: unknown;
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
}

const STATUS_CONFIG = {
  DRAFT:          { label: 'Draft',     classes: 'bg-gray-100 text-gray-600' },
  PUBLISHED:      { label: 'Published', classes: 'bg-green-100 text-green-700' },
  PENDING_REVIEW: { label: 'In Review', classes: 'bg-amber-100 text-amber-700' },
  ARCHIVED:       { label: 'Archived',  classes: 'bg-red-100 text-red-600' },
} as Record<string, { label: string; classes: string }>;

export default function CourseStudio({ course, categories, analytics, initialTab, isAdmin, latestReview }: Props) {
  const router = useRouter();
  const validTabs: Tab[] = ['settings', 'curriculum', 'analytics', 'instructors'];
  const [activeTab, setActiveTab] = useState<Tab>(
    validTabs.includes(initialTab as Tab) ? (initialTab as Tab) : 'settings'
  );
  const [status, setStatus] = useState(course.status);
  const [publishing, startPublish] = useTransition();

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
      } catch {
        toast.error('Failed to submit for review.');
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'instructors', label: 'Instructors' },
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
            href={`/courses/${course.slug}`}
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
            <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-amber-100 text-amber-700 cursor-default">
              <Send size={14} /> In Review
            </span>
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
                className={`px-[12px] py-[8px] rounded-[8px] font-jakarta font-medium text-[14px] tracking-[-0.28px] transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-navy drop-shadow-[0px_4px_2px_rgba(0,0,0,0.12)]'
                    : 'text-[#9CA3AF] hover:text-text-body'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6 lg:p-8 max-w-[1728px] mx-auto w-full">
        {activeTab === 'settings' && (
          <CourseSettingsForm course={course} categories={categories} latestReview={latestReview} />
        )}
        {activeTab === 'curriculum' && (
          <CurriculumBuilder courseId={course.id} initialModules={course.modules} />
        )}
        {activeTab === 'analytics' && (
          <CourseAnalyticsTab courseId={course.id} data={analytics} />
        )}
        {activeTab === 'instructors' && (
          <InstructorRosterTab courseId={course.id} />
        )}
      </div>
    </div>
  );
}
