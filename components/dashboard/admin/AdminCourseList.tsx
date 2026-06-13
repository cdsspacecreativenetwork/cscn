'use client';

import { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen, Users, Star, Search, ChevronDown,
  Eye, MoreHorizontal, CheckCircle2, XCircle,
  AlertCircle, Archive, RotateCcw, Loader2, ArrowUp, ArrowDown,
  GraduationCap, ClipboardList, Layers, Pencil, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  reviewCourseAction,
  toggleFeatureAction,
  adminArchiveCourseAction,
  adminRestoreCourseAction,
  approvePricingProposalAction,
  rejectPricingProposalAction,
  reorderFeaturedCoursesAction,
} from '@/actions/admin-courses';
import InstructorCourseList from '@/components/dashboard/instructor/InstructorCourseList';
import type { ReviewStatus } from '@prisma/client';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_REVIEW';
type Difficulty = 'ALL_LEVELS' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type Tab = 'all' | 'review' | 'featured' | 'mine';

interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: CourseStatus;
  difficulty: Difficulty;
  featuredOrder: number | null;
  createdAt: string;
  updatedAt: string;
  instructorId: string;
  instructor: {
    id: string;
    name: string | null;
    image: string | null;
    payoutSetup?: boolean;
    payoutDetails?: unknown;
  };
  price: number | null;
  baseCurrency: string;
  pricingProposal: {
    id: string;
    proposedPrice: number | null;
    currentPriceSnapshot: number | null;
    currency: string;
    status: string;
    createdAt: string;
    submittedBy: { name: string | null; email: string };
  } | null;
  revisions?: {
    id: string;
    version: number;
    status: string;
    changeSummary: unknown;
    submittedAt: string | null;
  }[];
  category: string | null;
  enrollments: number;
  lessons: number;
}

interface Props {
  courses: AdminCourse[];
  adminId: string;
  permissions: {
    canManageCourses: boolean;
    canReviewCourses: boolean;
    canPublishCourses: boolean;
    canManageBilling: boolean;
    canManageMarketing: boolean;
  };
  categories: { id: string; name: string }[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CourseStatus, { label: string; dot: string; badge: string }> = {
  DRAFT: { label: 'Draft', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
  PUBLISHED: { label: 'Published', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  PENDING_REVIEW: { label: 'In Review', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  ARCHIVED: { label: 'Archived', dot: 'bg-red-400', badge: 'bg-red-50 text-red-600' },
};

const REVIEW_CONFIG: Record<ReviewStatus, { label: string; icon: React.ReactNode; classes: string; confirmClasses: string }> = {
  APPROVED: { label: 'Approve', icon: <CheckCircle2 size={14} />, classes: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50', confirmClasses: 'bg-emerald-600 hover:bg-emerald-700' },
  CHANGES_REQUESTED: { label: 'Request Changes', icon: <AlertCircle size={14} />, classes: 'border-amber-200 text-amber-700 hover:bg-amber-50', confirmClasses: 'bg-amber-500 hover:bg-amber-600' },
  REJECTED: { label: 'Reject', icon: <XCircle size={14} />, classes: 'border-red-200 text-red-600 hover:bg-red-50', confirmClasses: 'bg-red-600 hover:bg-red-700' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatPrice(value: number | null, currency = 'NGN'): string {
  return value === null ? 'Free' : `${currency.toUpperCase()} ${value.toLocaleString()}`;
}

function getInstructorPayoutMeta(course: AdminCourse) {
  const details = (course.instructor.payoutDetails || {}) as {
    payoutCountry?: unknown;
    preferredCurrency?: unknown;
  };
  const country =
    typeof details.payoutCountry === 'string' && details.payoutCountry
      ? details.payoutCountry
      : 'Not set';
  const currency =
    typeof details.preferredCurrency === 'string' && details.preferredCurrency
      ? details.preferredCurrency.toUpperCase()
      : course.baseCurrency.toUpperCase();
  const ready = Boolean(course.instructor.payoutSetup && country !== 'Not set' && currency);
  return { country, currency, ready };
}

type RevisionChangeSummary = {
  mode?: string;
  changedFields?: string[];
  addedModules?: string[];
  removedModules?: string[];
  editedModules?: string[];
  addedLessons?: string[];
  removedLessons?: string[];
  editedLessons?: string[];
};

function getPendingRevision(course: AdminCourse) {
  return course.revisions?.find((revision) => revision.status === 'PENDING_REVIEW') ?? null;
}

function getRevisionChangeSummary(summary: unknown): RevisionChangeSummary | null {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null;
  return summary as RevisionChangeSummary;
}

function humanizeField(field: string) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function getRevisionChangeChips(summary: RevisionChangeSummary | null) {
  if (!summary) return [];
  const chips: { label: string; tone: 'blue' | 'green' | 'amber' | 'red' }[] = [];

  if (summary.changedFields?.length) {
    chips.push({
      label: `${summary.changedFields.length} setting${summary.changedFields.length === 1 ? '' : 's'} changed`,
      tone: 'blue',
    });
  }
  if (summary.addedModules?.length) chips.push({ label: `${summary.addedModules.length} module${summary.addedModules.length === 1 ? '' : 's'} added`, tone: 'green' });
  if (summary.editedModules?.length) chips.push({ label: `${summary.editedModules.length} module${summary.editedModules.length === 1 ? '' : 's'} edited`, tone: 'blue' });
  if (summary.removedModules?.length) chips.push({ label: `${summary.removedModules.length} module${summary.removedModules.length === 1 ? '' : 's'} removed`, tone: 'red' });
  if (summary.addedLessons?.length) chips.push({ label: `${summary.addedLessons.length} lesson${summary.addedLessons.length === 1 ? '' : 's'} added`, tone: 'green' });
  if (summary.editedLessons?.length) chips.push({ label: `${summary.editedLessons.length} lesson${summary.editedLessons.length === 1 ? '' : 's'} edited`, tone: 'amber' });
  if (summary.removedLessons?.length) chips.push({ label: `${summary.removedLessons.length} lesson${summary.removedLessons.length === 1 ? '' : 's'} removed`, tone: 'red' });

  return chips;
}

function InstructorAvatar({ instructor, size = 'sm' }: { instructor: AdminCourse['instructor']; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-8 h-8' : 'w-6 h-6';
  const text = size === 'md' ? 'text-xs' : 'text-[10px]';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`relative ${dim} rounded-full overflow-hidden shrink-0 bg-primary/10`}>
        {instructor.image ? (
          <Image src={instructor.image} alt="" fill className="object-cover" />
        ) : (
          <span className={`absolute inset-0 flex items-center justify-center ${text} font-bold text-primary`}>
            {(instructor.name ?? 'I').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-sm text-text-body truncate max-w-[140px]">{instructor.name ?? '—'}</span>
    </div>
  );
}

// ─── Card Action Menu (used in grid cards) ────────────────────────────────────

function CardActionMenu({ course, canManageCourses, onArchive, onRestore }: {
  course: AdminCourse;
  canManageCourses: boolean;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg text-navy shadow-sm hover:bg-white transition-all"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-[50] w-48 bg-white border border-stroke rounded-xl shadow-xl py-1.5 overflow-hidden">
          <Link
            href={`/courses/${course.slug}?preview=true`}
            target="_blank"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-body hover:bg-background transition-colors"
          >
            <Eye size={15} /> Preview
          </Link>
          <Link
            href={`/dashboard/admin/courses/${course.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-body hover:bg-background transition-colors"
          >
            <Layers size={15} /> View Studio
          </Link>
          {canManageCourses && (
            <>
              <div className="my-1 border-t border-stroke" />
              {course.status !== 'ARCHIVED' ? (
                <button
                  onClick={() => { setOpen(false); onArchive(course.id); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Archive size={15} /> Archive
                </button>
              ) : (
                <button
                  onClick={() => { setOpen(false); onRestore(course.id); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <RotateCcw size={15} /> Restore
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Table Action Menu (used in list view) ────────────────────────────────────

function TableActionMenu({ course, canManageCourses, onArchive, onRestore }: {
  course: AdminCourse;
  canManageCourses: boolean;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-text-mute hover:text-navy hover:bg-background transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white border border-stroke rounded-xl shadow-lg py-1 overflow-hidden">
          <Link
            href={`/courses/${course.slug}?preview=true`}
            target="_blank"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-body hover:bg-background transition-colors"
          >
            <Eye size={14} /> Preview
          </Link>
          <Link
            href={`/dashboard/admin/courses/${course.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-body hover:bg-background transition-colors"
          >
            <Layers size={14} /> View Studio
          </Link>
          {canManageCourses && (
            <>
              <div className="my-1 border-t border-stroke" />
              {course.status !== 'ARCHIVED' ? (
                <button
                  onClick={() => { setOpen(false); onArchive(course.id); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Archive size={14} /> Archive
                </button>
              ) : (
                <button
                  onClick={() => { setOpen(false); onRestore(course.id); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <RotateCcw size={14} /> Restore
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

function AdminCourseCard({ course, canManageCourses, onFeatureToggle, onArchive, onRestore }: {
  course: AdminCourse;
  canManageCourses: boolean;
  onFeatureToggle: (id: string, order: number | null) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const s = STATUS_CONFIG[course.status];
  const isFeatured = course.featuredOrder !== null;

  return (
    <div className="relative bg-white border border-[#C8D1E0] rounded-[16px] flex flex-col group hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative w-full h-[220px] rounded-t-[16px] overflow-hidden bg-background shrink-0">
        {course.thumbnail ? (
          <Image src={course.thumbnail ?? ''} alt={course.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <BookOpen size={36} className="text-primary/30" />
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Action buttons — overlaid on the top-right corner */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {canManageCourses && (
          <button
            onClick={() => onFeatureToggle(course.id, course.featuredOrder)}
            title={isFeatured ? `Featured #${course.featuredOrder} — click to remove` : 'Add to featured'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all ${isFeatured
                ? 'bg-amber-400 text-white hover:bg-amber-500'
                : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-amber-400 hover:bg-white'
              }`}
          >
            <Star size={15} fill={isFeatured ? 'currentColor' : 'none'} />
          </button>
        )}
        <CardActionMenu course={course} canManageCourses={canManageCourses} onArchive={onArchive} onRestore={onRestore} />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {course.category && (
          <span className="text-[12px] font-semibold text-text-mute uppercase tracking-wider">{course.category}</span>
        )}
        <Link
          href={`/dashboard/admin/courses/${course.id}`}
          className="text-[16px] font-bold text-navy leading-snug line-clamp-2 hover:text-primary transition-colors"
        >
          {course.title}
        </Link>
        <div className="flex items-center gap-4 text-[13px] text-text-mute">
          <span className="flex items-center gap-1.5"><BookOpen size={13} /> {course.lessons} lessons</span>
          <span className="flex items-center gap-1.5"><Users size={13} /> {course.enrollments.toLocaleString()} enrolled</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <InstructorAvatar instructor={course.instructor} />
        <span className="text-[11px] text-text-mute">{relativeTime(course.updatedAt)}</span>
      </div>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function CourseRow({ course, canManageCourses, onFeatureToggle, onArchive, onRestore }: {
  course: AdminCourse;
  canManageCourses: boolean;
  onFeatureToggle: (id: string, order: number | null) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const s = STATUS_CONFIG[course.status];
  const isFeatured = course.featuredOrder !== null;
  return (
    <tr className="group border-b border-stroke last:border-0 hover:bg-[#FAFBFF] transition-colors">
      <td className="pl-5 pr-3 py-4 w-[100px]">
        <div className="relative w-[84px] h-[52px] rounded-xl overflow-hidden bg-background shrink-0">
          {course.thumbnail ? (
            <Image src={course.thumbnail ?? ''} alt={course.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <BookOpen size={18} className="text-primary/40" />
            </div>
          )}
        </div>
      </td>
      <td className="py-4 pr-4 max-w-[260px]">
        <Link
          href={`/dashboard/admin/courses/${course.id}`}
          className="text-[14px] font-semibold text-navy hover:text-primary transition-colors line-clamp-2 leading-snug"
        >
          {course.title}
        </Link>
        {course.category && (
          <span className="mt-0.5 inline-block text-[11px] text-text-mute font-medium">{course.category}</span>
        )}
      </td>
      <td className="py-4 pr-4">
        <InstructorAvatar instructor={course.instructor} />
      </td>
      <td className="py-4 pr-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </td>
      <td className="py-4 pr-4 text-sm text-text-mute whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          <Users size={13} className="shrink-0" />
          {course.enrollments.toLocaleString()}
        </span>
      </td>
      <td className="py-4 pr-4 text-sm text-text-mute whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          <BookOpen size={13} className="shrink-0" />
          {course.lessons}
        </span>
      </td>
      <td className="py-4 pr-4 text-[12px] text-text-mute whitespace-nowrap">
        {relativeTime(course.updatedAt)}
      </td>
      <td className="py-4 pr-1">
        {canManageCourses && (
          <button
            onClick={() => onFeatureToggle(course.id, course.featuredOrder)}
            title={isFeatured ? `Featured #${course.featuredOrder}` : 'Add to featured'}
            className={`p-1.5 rounded-lg transition-all ${isFeatured ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
          >
            <Star size={15} fill={isFeatured ? 'currentColor' : 'none'} />
          </button>
        )}
      </td>
      <td className="py-4 pr-4">
        <TableActionMenu course={course} canManageCourses={canManageCourses} onArchive={onArchive} onRestore={onRestore} />
      </td>
    </tr>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({
  course,
  permissions,
  onCourseReviewDone,
  onPricingDone,
}: {
  course: AdminCourse;
  permissions: Props['permissions'];
  onCourseReviewDone: () => void;
  onPricingDone: (approved: boolean) => void;
}) {
  const [active, setActive] = useState<ReviewStatus | null>(null);
  const [pricingDecision, setPricingDecision] = useState<'reject' | null>(null);
  const [comment, setComment] = useState('');
  const router = useRouter();

  const [pricingNote, setPricingNote] = useState('');
  const [pending, startTransition] = useTransition();
  const pendingRevision = getPendingRevision(course);
  const hasUpdateReview = Boolean(pendingRevision);
  const revisionSummary = getRevisionChangeSummary(pendingRevision?.changeSummary);
  const revisionChips = getRevisionChangeChips(revisionSummary);
  const hasCourseReview = course.status === 'PENDING_REVIEW' || hasUpdateReview;
  const hasPricingReview = course.pricingProposal?.status === 'PENDING';
  const payoutMeta = getInstructorPayoutMeta(course);
  const reviewCurrency = course.pricingProposal?.currency ?? course.baseCurrency;
  const reviewBadgeLabel = hasUpdateReview ? `UPDATE v${pendingRevision?.version}` : hasCourseReview ? 'IN REVIEW' : 'PRICE REVIEW';

  const handleQuickPricingApprove = () => {
    if (!course.pricingProposal) return;
    startTransition(async () => {
      const res = await approvePricingProposalAction(course.pricingProposal!.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success('Pricing approved.');
      onPricingDone(true);
    });
  };

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#D8E0EE] bg-white shadow-sm transition-all hover:border-[#1C4ED1]/25 hover:shadow-md">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <Link
          href={`/dashboard/admin/courses/${course.id}`}
          className="relative h-[108px] w-full shrink-0 overflow-hidden rounded-[14px] bg-[#F4F6FB] sm:w-[168px]"
        >
          {course.thumbnail ? (
            <Image src={course.thumbnail ?? ''} alt={course.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1C4ED1]/5 text-[#1C4ED1]">
              <BookOpen size={28} />
            </div>
          )}
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${hasUpdateReview ? 'bg-[#EEF3FF] text-[#1C4ED1]' : hasPricingReview && !hasCourseReview ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
            {reviewBadgeLabel}
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {hasCourseReview && (
              <span className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">
                {hasUpdateReview ? 'Published update' : 'Course review'}
              </span>
            )}
            {hasPricingReview && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">
                Pricing review
              </span>
            )}
            <span className="rounded-full bg-[#F4F6FB] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#667085]">
              Updated {relativeTime(course.updatedAt)}
            </span>
          </div>

          <Link
            href={`/dashboard/admin/courses/${course.id}`}
            className="mt-2 block text-[20px] font-black leading-tight tracking-[-0.03em] text-[#040B37] transition-colors hover:text-[#1C4ED1]"
          >
            {course.title}
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-bold text-[#9CA3AF]">
            <InstructorAvatar instructor={course.instructor} />
            {course.category && <span>{course.category}</span>}
            <span className="inline-flex items-center gap-1"><BookOpen size={13} /> {course.lessons} lessons</span>
            <span className="inline-flex items-center gap-1"><Users size={13} /> {course.enrollments.toLocaleString()} enrolled</span>
            <span className="inline-flex items-center gap-1"><CreditCard size={13} /> {formatPrice(course.price, course.baseCurrency)}</span>
          </div>

          {revisionChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {revisionChips.slice(0, 5).map((chip) => (
                <span
                  key={chip.label}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${chip.tone === 'green' ? 'bg-emerald-50 text-emerald-700' :
                      chip.tone === 'red' ? 'bg-red-50 text-red-600' :
                        chip.tone === 'amber' ? 'bg-amber-50 text-amber-700' :
                          'bg-[#EEF3FF] text-[#1C4ED1]'
                    }`}
                >
                  {chip.label}
                </span>
              ))}
              {revisionChips.length > 5 && (
                <span className="rounded-full bg-[#F4F6FB] px-2.5 py-1 text-[11px] font-bold text-[#667085]">
                  +{revisionChips.length - 5} more
                </span>
              )}
            </div>
          )}

          {hasPricingReview && course.pricingProposal && (
            <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-bold text-[#667085]">
              <span className="rounded-[10px] border border-[#D8E0EE] bg-[#F8FAFF] px-3 py-1.5">
                Current: <strong className="text-[#040B37]">{formatPrice(course.pricingProposal!.currentPriceSnapshot, reviewCurrency)}</strong>
              </span>
              <span className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">
                Proposed: <strong>{formatPrice(course.pricingProposal!.proposedPrice, reviewCurrency)}</strong>
              </span>
              <span className={`rounded-[10px] border px-3 py-1.5 ${payoutMeta.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}>
                Payout {payoutMeta.ready ? 'ready' : 'needs setup'}
              </span>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[168px]">
          <Button
            variant="gradient"
            size="sm"
            rounded="[10px]"
            hasBorder={false}
            className="w-full sm:w-auto"
            onClick={() => router.push(`/dashboard/admin/courses/${course.id}`)}
            leftIcon={<Eye size={18} className="sm:w-[20px] sm:h-[20px]" />}
          >
            Open review
          </Button>

          {hasPricingReview && permissions.canManageBilling && course.pricingProposal && (
            <button
              type="button"
              onClick={handleQuickPricingApprove}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 text-[12px] font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve price
            </button>
          )}
        </div>
      </div>
    </article>
  );

  const handleConfirm = () => {
    if (!active) return;
    startTransition(async () => {
      const res = await reviewCourseAction(course.id, active, comment);
      if (res.error) { toast.error(res.error); return; }
      toast.success(
        active === 'APPROVED' ? hasUpdateReview ? 'Course update approved and promoted live!' : 'Course approved and published!'
          : active === 'CHANGES_REQUESTED' ? 'Changes requested.'
            : 'Course rejected.'
      );
      onCourseReviewDone();
    });
  };

  const handlePricingApprove = () => {
    if (!course.pricingProposal) return;
    startTransition(async () => {
      const res = await approvePricingProposalAction(course.pricingProposal!.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success('Pricing approved.');
      onPricingDone(true);
    });
  };

  const handlePricingReject = () => {
    if (!course.pricingProposal) return;
    startTransition(async () => {
      const res = await rejectPricingProposalAction(course.pricingProposal!.id, pricingNote);
      if (res.error) { toast.error(res.error); return; }
      toast.success('Pricing proposal rejected.');
      setPricingDecision(null);
      setPricingNote('');
      onPricingDone(false);
    });
  };

  return (
    <div className="bg-white border border-stroke rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all">
      <div className="flex gap-6 p-6">
        <div className="relative w-[180px] h-[108px] rounded-xl overflow-hidden shrink-0 bg-background">
          {course.thumbnail ? (
            <Image src={course.thumbnail ?? ''} alt={course.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <BookOpen size={28} className="text-primary/30" />
            </div>
          )}
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {reviewBadgeLabel}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-navy leading-snug line-clamp-2">{course.title}</h3>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <InstructorAvatar instructor={course.instructor} />
              {course.category && (
                <span className="text-[11px] text-text-mute font-medium bg-background px-2 py-0.5 rounded-full border border-stroke">
                  {course.category}
                </span>
              )}
              <span className="text-[11px] text-text-mute flex items-center gap-1">
                <BookOpen size={11} /> {course.lessons} lessons
              </span>
              <span className="text-[11px] text-text-mute flex items-center gap-1">
                <CreditCard size={11} /> {formatPrice(course.price, course.baseCurrency)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {hasCourseReview && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  <ClipboardList size={12} /> {hasUpdateReview ? 'Update pending' : 'Content pending'}
                </span>
              )}
              {hasPricingReview && course.pricingProposal && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1C4ED1]/20 bg-[#EEF3FF] px-2.5 py-1 text-[11px] font-bold text-[#1C4ED1]">
                  <CreditCard size={12} />
                  Price: {formatPrice(course.pricingProposal!.proposedPrice, reviewCurrency)}
                </span>
              )}
              {hasPricingReview && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${payoutMeta.ready
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                >
                  {payoutMeta.ready ? 'Payout ready' : 'Payout incomplete'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
            <span className="text-[11px] text-text-mute">Updated {relativeTime(course.updatedAt)}</span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Link
                href={`/dashboard/admin/courses/${course.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stroke bg-white text-[12px] font-semibold text-navy hover:bg-background hover:border-primary/30 transition-all"
              >
                <Pencil size={12} /> Edit
              </Link>
              {hasCourseReview && (permissions.canReviewCourses || permissions.canPublishCourses) && (
                <div className="flex items-center gap-1.5 rounded-[10px] border border-stroke bg-[#FAFBFF] p-1">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wide text-text-mute">
                    {hasUpdateReview ? 'Update' : 'Content'}
                  </span>
                  {(Object.entries(REVIEW_CONFIG) as [ReviewStatus, typeof REVIEW_CONFIG[ReviewStatus]][]).map(([key, cfg]) => {
                    const hasPermission = key === 'APPROVED' ? permissions.canPublishCourses : permissions.canReviewCourses;
                    const blockedByPricing = key === 'APPROVED' && hasPricingReview;
                    return (
                      <button
                        key={key}
                        onClick={() => { setPricingDecision(null); setActive((v) => (v === key ? null : key)); }}
                        disabled={pending || !hasPermission || blockedByPricing}
                        title={
                          !hasPermission
                            ? key === 'APPROVED'
                              ? 'Publishing permission required.'
                              : 'Review permission required.'
                            : blockedByPricing
                              ? 'Resolve the pending price before publishing.'
                              : undefined
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border bg-white text-[12px] font-semibold transition-all disabled:opacity-50
                          ${active === key ? 'ring-2 ring-offset-1 ring-current' : ''} ${cfg.classes}`}
                      >
                        {cfg.icon} {key === 'APPROVED' ? hasUpdateReview ? 'Approve Update' : 'Approve & Publish' : cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {hasPricingReview && permissions.canManageBilling && (
                <div className="flex items-center gap-1.5 rounded-[10px] border border-[#1C4ED1]/15 bg-[#F8FAFF] p-1">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wide text-[#1C4ED1]">
                    Pricing
                  </span>
                  <button
                    onClick={handlePricingApprove}
                    disabled={pending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-emerald-200 bg-white text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Approve Price
                  </button>
                  <button
                    onClick={() => { setActive(null); setPricingDecision((v) => (v === 'reject' ? null : 'reject')); }}
                    disabled={pending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-red-200 bg-white text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 ${pricingDecision === 'reject' ? 'ring-2 ring-offset-1 ring-red-500' : ''
                      }`}
                  >
                    <XCircle size={14} /> Reject Price
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasUpdateReview && pendingRevision && (
        <div className="border-t border-stroke bg-[#FAFBFF] px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-primary">
                Published course update
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">
                Version {pendingRevision!.version} is waiting for admin approval. Current live course remains unchanged until this update is approved.
              </p>
              {pendingRevision!.submittedAt && (
                <p className="mt-1 text-xs font-medium text-text-mute">
                  Submitted {relativeTime(String(pendingRevision!.submittedAt))}
                </p>
              )}
            </div>
            <Link
              href={`/dashboard/admin/courses/${course.id}`}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#1C4ED1]/20 bg-white px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-[#1C4ED1]/5"
            >
              Review in Studio
            </Link>
          </div>

          {revisionChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {revisionChips.map((chip) => (
                <span
                  key={chip.label}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${chip.tone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                      chip.tone === 'red' ? 'border-red-200 bg-red-50 text-red-600' :
                        chip.tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                          'border-[#1C4ED1]/20 bg-[#EEF3FF] text-[#1C4ED1]'
                    }`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )}

          {revisionSummary?.changedFields?.length ? (
            <p className="mt-3 text-xs font-medium text-text-mute">
              Settings changed: {revisionSummary!.changedFields!.slice(0, 6).map(humanizeField).join(', ')}
              {revisionSummary!.changedFields!.length > 6 ? '...' : ''}
            </p>
          ) : null}
        </div>
      )}

      {hasPricingReview && course.pricingProposal && (
        <details className="border-t border-stroke bg-[#FAFBFF] px-6 py-3">
          <summary className="cursor-pointer select-none text-[12px] font-bold uppercase tracking-wide text-[#1C4ED1]">
            Pricing details
          </summary>
          <div className="mt-3 grid gap-2 text-[12px] font-medium text-text-body sm:grid-cols-2 lg:grid-cols-4">
            <span>Current: <strong className="text-navy">{formatPrice(course.pricingProposal!.currentPriceSnapshot, reviewCurrency)}</strong></span>
            <span>Proposed: <strong className="text-navy">{formatPrice(course.pricingProposal!.proposedPrice, reviewCurrency)}</strong></span>
            <span>Instructor region: <strong className="text-navy">{payoutMeta.country}</strong></span>
            <span>Payout currency: <strong className="text-navy">{payoutMeta.currency}</strong></span>
          </div>
        </details>
      )}

      {pricingDecision === 'reject' && (
        <div className="border-t border-stroke px-6 py-4 bg-[#FAFBFF] space-y-3">
          <label className="text-[12px] font-semibold text-navy uppercase tracking-wide">
            Rejection note for pricing
          </label>
          <textarea
            value={pricingNote}
            onChange={(e) => setPricingNote(e.target.value)}
            placeholder="Example: Please adjust the launch price or explain the premium positioning."
            rows={2}
            className="w-full px-4 py-3 text-sm text-navy border border-stroke bg-white rounded-[8px] resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-text-mute transition-all"
          />
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={() => { setPricingDecision(null); setPricingNote(''); }}
              disabled={pending}
              className="px-4 py-2 text-sm font-medium text-text-body hover:text-navy border border-stroke rounded-[8px] hover:bg-background transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePricingReject}
              disabled={pending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-[8px] bg-red-600 hover:bg-red-700 transition-all disabled:opacity-60"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Reject Pricing
            </button>
          </div>
        </div>
      )}

      {active && (
        <div className="border-t border-stroke px-6 py-4 bg-[#FAFBFF] space-y-3">
          <label className="text-[12px] font-semibold text-navy uppercase tracking-wide">
            {active === 'APPROVED' ? 'Optional note for instructor' : 'Feedback for instructor (recommended)'}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              active === 'APPROVED'
                ? 'Great work! Your course is now live.'
                : active === 'CHANGES_REQUESTED'
                  ? 'Please update the course thumbnail and add a detailed description...'
                  : 'The content does not meet our quality standards...'
            }
            rows={3}
            className="w-full px-4 py-3 text-sm text-navy border border-stroke bg-white rounded-xl resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-text-mute transition-all"
          />
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={() => { setActive(null); setComment(''); }}
              disabled={pending}
              className="px-4 py-2 text-sm font-medium text-text-body hover:text-navy border border-stroke rounded-xl hover:bg-background transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={pending}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60 ${REVIEW_CONFIG[active ?? 'APPROVED'].confirmClasses}`}
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : REVIEW_CONFIG[active ?? 'APPROVED'].icon}
              Confirm {REVIEW_CONFIG[active ?? 'APPROVED'].label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminCourseList({ courses: initialCourses, adminId, permissions, categories }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [view, setView] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    const saved = window.localStorage.getItem('admin-course-view');
    return saved === 'grid' || saved === 'list' ? saved : 'grid';
  });
  const [featurePending, startFeature] = useTransition();
  const [archivePending, startArchive] = useTransition();

  const handleViewChange = (v: 'grid' | 'list') => {
    setView(v);
    localStorage.setItem('admin-course-view', v);
  };

  const needsCourseReview = (course: AdminCourse) =>
    course.status === 'PENDING_REVIEW' ||
    course.pricingProposal?.status === 'PENDING' ||
    course.revisions?.some((revision) => revision.status === 'PENDING_REVIEW');

  const stats = useMemo(() => ({
    total: courses.length,
    published: courses.filter((c) => c.status === 'PUBLISHED').length,
    pendingReview: courses.filter(needsCourseReview).length,
    featured: courses.filter((c) => c.featuredOrder !== null).length,
  }), [courses]);

  const myCourses = useMemo(() => courses.filter((c) => c.instructorId === adminId), [courses, adminId]);
  const reviewQueue = useMemo(
    () => courses.filter(needsCourseReview),
    [courses]
  );
  const featuredCourses = useMemo(
    () =>
      courses
        .filter((c) => c.featuredOrder !== null)
        .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999)),
    [courses]
  );

  const filteredAll = useMemo(() => {
    // Course and pricing reviews live exclusively in the Review Queue tab
    let list = courses.filter((c) => !needsCourseReview(c));
    if (statusFilter !== 'ALL') list = list.filter((c) => c.status === statusFilter);
    if (categoryFilter) list = list.filter((c) => c.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        (c.instructor.name ?? '').toLowerCase().includes(q) ||
        (c.category ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, statusFilter, categoryFilter, search]);

  const handleFeatureToggle = (id: string, currentOrder: number | null) => {
    startFeature(async () => {
      const res = await toggleFeatureAction(id, currentOrder);
      if (res.error) { toast.error(res.error); return; }
      setCourses((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, featuredOrder: currentOrder !== null ? null : (stats.featured + 1) }
            : c
        )
      );
      toast.success(currentOrder !== null ? 'Removed from featured.' : 'Added to featured!');
    });
  };

  const handleFeaturedMove = (courseId: string, direction: -1 | 1) => {
    const currentIndex = featuredCourses.findIndex((course) => course.id === courseId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= featuredCourses.length) return;

    const nextFeatured = [...featuredCourses];
    const [moved] = nextFeatured.splice(currentIndex, 1);
    nextFeatured.splice(targetIndex, 0, moved);
    const orderedIds = nextFeatured.map((course) => course.id);

    setCourses((prev) =>
      prev.map((course) => {
        const nextIndex = orderedIds.indexOf(course.id);
        return nextIndex === -1 ? course : { ...course, featuredOrder: nextIndex + 1 };
      })
    );

    startFeature(async () => {
      const res = await reorderFeaturedCoursesAction(orderedIds);
      if (res.error) {
        toast.error(res.error);
        setCourses(initialCourses);
        return;
      }
      toast.success('Featured order updated.');
    });
  };

  const handleArchive = (id: string) => {
    startArchive(async () => {
      const res = await adminArchiveCourseAction(id);
      if (res.error) { toast.error(res.error); return; }
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'ARCHIVED' as const } : c)));
      toast.success('Course archived.');
    });
  };

  const handleRestore = (id: string) => {
    startArchive(async () => {
      const res = await adminRestoreCourseAction(id);
      if (res.error) { toast.error(res.error); return; }
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'DRAFT' as const } : c)));
      toast.success('Course restored to Draft.');
    });
  };

  const tabs: { id: Tab; label: string; count: number; accent?: string }[] = [
    { id: 'all', label: 'All Courses', count: courses.length },
    { id: 'review', label: 'Review Queue', count: stats.pendingReview, accent: stats.pendingReview > 0 ? 'amber' : undefined },
    { id: 'featured', label: 'Featured', count: stats.featured },
    { id: 'mine', label: 'My Courses', count: myCourses.length },
  ];

  const statusTabs: { id: CourseStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'PUBLISHED', label: 'Published' },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  const activeList = activeTab === 'mine' ? myCourses : filteredAll;
  const isMineTab = activeTab === 'mine';

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] lg:text-[32px] font-bold text-navy tracking-tight">Course Management</h1>
          <p className="text-base font-medium text-text-mute mt-1">
            Manage, review, and curate all courses on the platform
          </p>
        </div>
      </div>

      {/* ── Stats Cards — collapse when "My Courses" tab is active ── */}
      <div className={`grid transition-all duration-500 ease-in-out ${isMineTab ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 pb-1">
            {[
              { label: 'Total Courses', value: stats.total, Icon: Layers },
              { label: 'Published', value: stats.published, Icon: GraduationCap },
              { label: 'Pending Review', value: stats.pendingReview, Icon: ClipboardList, pulse: stats.pendingReview > 0 },
              { label: 'Featured', value: `${stats.featured}/8`, Icon: Star },
            ].map(({ label, value, Icon, pulse }) => (
              <div key={label} className="bg-white border border-[#E3E8F4] rounded-[12px] p-6 flex flex-col gap-7 relative">
                <div className="flex items-start justify-between">
                  <p className="text-[16px] font-medium text-text-mute leading-tight">{label}</p>
                  <div className="shrink-0 rounded-[12px] bg-[#1C4ED1]/5 p-2.5 text-[#1C4ED1]">
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                </div>
                <p className="text-[36px] font-bold text-navy leading-none">{value}</p>
                {pulse && (
                  <span className="absolute top-4 right-14 w-2.5 h-2.5 rounded-full bg-amber-500">
                    <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Strip ── */}
      <div className="flex items-center gap-[4px] bg-[#E3E8F4] p-[4px] rounded-[12px] w-fit overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-[16px] py-[10px] rounded-[8px] font-jakarta font-medium text-[14px] tracking-[-0.28px] transition-all whitespace-nowrap ${isActive
                  ? 'bg-linear-to-r from-[#0035C1] to-[#0575FF] text-white shadow-[0_8px_20px_rgba(28,78,209,0.22)]'
                  : 'text-[#9CA3AF] hover:text-text-body'
                }`}
            >
              {tab.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${tab.accent === 'amber'
                  ? 'bg-amber-100 text-amber-700'
                  : isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#D1D5DB]/60 text-[#9CA3AF]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── My Courses Tab — reuses InstructorCourseList UI ── */}
      {isMineTab && (
        <InstructorCourseList
          courses={myCourses.map((c) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            thumbnail: c.thumbnail,
            status: c.status,
            difficulty: c.difficulty,
            category: c.category,
            enrollments: c.enrollments,
            lessons: c.lessons,
            updatedAt: c.updatedAt,
            isOwner: true,
          }))}
          categories={categories}
          studioPath="/dashboard/admin/courses"
        />
      )}

      {/* ── Review Queue Tab ── */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {reviewQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-[16px] font-semibold text-navy">All caught up!</p>
                <p className="text-sm text-text-mute mt-0.5">No courses are currently waiting for review.</p>
              </div>
            </div>
          ) : (
            reviewQueue.map((course) => (
              <ReviewCard
                key={course.id}
                course={course}
                permissions={permissions}
                onCourseReviewDone={() => setCourses((prev) => prev.filter((c) => c.id !== course.id))}
                onPricingDone={(approved) =>
                  setCourses((prev) =>
                    prev.map((c) =>
                      c.id === course.id
                        ? {
                          ...c,
                          price: approved ? course.pricingProposal?.proposedPrice ?? c.price : c.price,
                          baseCurrency: approved ? course.pricingProposal?.currency ?? c.baseCurrency : c.baseCurrency,
                          pricingProposal: null,
                        }
                        : c
                    )
                  )
                }
              />
            ))
          )}
        </div>
      )}

      {/* ── Featured Courses Tab ── */}
      {activeTab === 'featured' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#D8E0EE] bg-white p-5">
            <h2 className="text-[18px] font-bold text-navy">Homepage Featured Courses</h2>
            <p className="mt-1 text-sm font-medium text-text-mute">
              The homepage shows featured published courses in this order. Use the star on any course card to add or remove it.
            </p>
          </div>

          {featuredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-stroke bg-white">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Star size={26} className="text-primary" />
              </div>
              <p className="font-semibold text-navy">No featured courses yet</p>
              <p className="text-sm text-text-mute">Go to All Courses and click the star on a published course.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-stroke bg-white overflow-hidden">
              {featuredCourses.map((course, index) => (
                <div key={course.id} className="flex items-center gap-4 border-b border-stroke last:border-0 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                    {index + 1}
                  </div>
                  <div className="relative h-16 w-24 overflow-hidden rounded-[8px] bg-background shrink-0">
                    {course.thumbnail ? (
                      <Image src={course.thumbnail ?? ''} alt={course.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                        <BookOpen size={18} className="text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy">{course.title}</p>
                    <p className="mt-0.5 text-xs font-medium text-text-mute">
                      {course.category ?? 'Uncategorized'} · {course.status}
                    </p>
                  </div>
                  {permissions.canManageCourses && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={index === 0 || featurePending}
                        onClick={() => handleFeaturedMove(course.id, -1)}
                        className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-stroke text-navy transition-colors hover:bg-background disabled:opacity-40"
                        title="Move up"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={index === featuredCourses.length - 1 || featurePending}
                        onClick={() => handleFeaturedMove(course.id, 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-stroke text-navy transition-colors hover:bg-background disabled:opacity-40"
                        title="Move down"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={featurePending}
                        onClick={() => handleFeatureToggle(course.id, course.featuredOrder)}
                        className="flex h-9 items-center gap-2 rounded-[8px] border border-red-200 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        <XCircle size={14} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── All Courses Tab ── */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Search + Filters + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, instructor, or category…"
                className="w-full pl-11 pr-4 py-3 text-sm border border-stroke rounded-xl bg-white text-navy placeholder:text-text-mute focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none pl-4 pr-9 py-3 text-sm border border-stroke rounded-xl bg-white text-navy focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-mute" />
              </div>

              <div className="flex items-center bg-white border border-stroke rounded-xl gap-1 p-1">
                <button
                  onClick={() => handleViewChange('grid')}
                  title="Grid view"
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${view === 'grid' ? 'bg-background' : 'opacity-40 hover:opacity-70'}`}
                >
                  <Image src="/assets/courses/grid-view.svg" alt="Grid" width={20} height={20} />
                </button>
                <div className="w-px h-5 bg-stroke" />
                <button
                  onClick={() => handleViewChange('list')}
                  title="List view"
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${view === 'list' ? 'bg-background' : 'opacity-40 hover:opacity-70'}`}
                >
                  <Image src="/assets/courses/menu-01.svg" alt="List" width={20} height={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Status sub-tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {statusTabs.map((t) => {
              const count = t.id === 'ALL'
                ? courses.length
                : courses.filter((c) => c.status === t.id).length;
              const isActive = statusFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-mute hover:text-navy hover:bg-white border border-transparent hover:border-stroke'
                    }`}
                >
                  {t.label}
                  <span className={`text-[11px] font-bold ${isActive ? 'text-white/80' : 'text-text-mute'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <BookOpen size={28} className="text-text-mute" />
              </div>
              <p className="text-text-mute font-medium text-sm">
                {search || statusFilter !== 'ALL' || categoryFilter
                  ? 'No courses match your filters.'
                  : 'No courses found.'}
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeList.map((course) => (
                <AdminCourseCard
                  key={course.id}
                  course={course}
                  canManageCourses={permissions.canManageCourses}
                  onFeatureToggle={handleFeatureToggle}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-stroke rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stroke bg-[#FAFBFF]">
                      <th className="pl-5 pr-3 py-3.5 text-left" />
                      <th className="py-3.5 pr-4 text-left text-[11px] font-semibold text-text-mute uppercase tracking-wider">Course</th>
                      <th className="py-3.5 pr-4 text-left text-[11px] font-semibold text-text-mute uppercase tracking-wider">Instructor</th>
                      <th className="py-3.5 pr-4 text-left text-[11px] font-semibold text-text-mute uppercase tracking-wider">Status</th>
                      <th className="py-3.5 pr-4 text-left text-[11px] font-semibold text-text-mute uppercase tracking-wider">Enrolled</th>
                      <th className="py-3.5 pr-4 text-left text-[11px] font-semibold text-text-mute uppercase tracking-wider">Lessons</th>
                      <th className="py-3.5 pr-4 text-left text-[11px] font-semibold text-text-mute uppercase tracking-wider">Updated</th>
                      <th className="py-3.5 pr-1 text-left text-[11px] font-semibold text-text-mute uppercase tracking-wider">
                        <Star size={12} />
                      </th>
                      <th className="py-3.5 pr-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeList.map((course) => (
                      <CourseRow
                        key={course.id}
                        course={course}
                        canManageCourses={permissions.canManageCourses}
                        onFeatureToggle={handleFeatureToggle}
                        onArchive={handleArchive}
                        onRestore={handleRestore}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3.5 border-t border-stroke bg-[#FAFBFF]">
                <p className="text-[12px] text-text-mute">
                  Showing <span className="font-semibold text-navy">{activeList.length}</span> of{' '}
                  <span className="font-semibold text-navy">{courses.length}</span> courses
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {(featurePending || archivePending) && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-navy text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium">
          <Loader2 size={14} className="animate-spin" />
          Saving…
        </div>
      )}
    </div>
  );
}
