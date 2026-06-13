"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Layers3,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { ReviewStatus } from "@prisma/client";

import {
  approvePricingProposalAction,
  rejectPricingProposalAction,
  reviewCourseAction,
} from "@/actions/admin-courses";
import Button from "@/components/ui/Button";

type LessonSnapshot = {
  id: string;
  title: string;
  position?: number;
  overview: string | null;
  videoUrl: string | null;
  duration: number | null;
  isPublished: boolean;
  isPreview: boolean;
  contentType: string;
  bodyContent: string | null;
  transcript: string | null;
  resources?: { id: string; title: string; url: string; type: string }[];
};

type ModuleSnapshot = {
  id: string;
  title: string;
  position?: number;
  isPublished: boolean;
  lessons: LessonSnapshot[];
};

type CourseSnapshot = {
  title: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  thumbnail: string | null;
  promoVideo: string | null;
  difficulty: string;
  courseType?: string | null;
  previewCount: number;
  categoryId: string | null;
  certificateEnabled: boolean;
  examGated: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  modules: ModuleSnapshot[];
};

type ReviewCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  promoVideo?: string | null;
  status: string;
  price: unknown;
  baseCurrency?: string;
  instructor?: {
    payoutSetup: boolean;
    payoutDetails: unknown;
  } | null;
  pricingProposals?: {
    id: string;
    proposedPrice: unknown;
    currentPriceSnapshot: unknown;
    currency: string;
    status: string;
  }[];
  revisions?: {
    id: string;
    version: number;
    status: string;
    changeSummary: unknown;
    submittedAt: Date | string | null;
    liveSnapshot?: unknown;
    draftSnapshot?: unknown;
  }[];
  modules: {
    id: string;
    title: string;
    isPublished: boolean;
    lessons: { id: string; isPublished: boolean }[];
  }[];
};

type RevisionChangeSummary = {
  changedFields?: string[];
  addedModules?: string[];
  removedModules?: string[];
  editedModules?: string[];
  addedLessons?: string[];
  removedLessons?: string[];
  editedLessons?: string[];
};

type ChangeItem = {
  id: string;
  type: "added" | "edited" | "removed";
  area: "Settings" | "Modules" | "Lessons";
  title: string;
  before?: string | null;
  after?: string | null;
  detail?: string;
  targetId?: string;
};

type ReviewTab = "summary" | "curriculum" | "settings";

interface Props {
  course: ReviewCourse;
  permissions: {
    canReviewCourses: boolean;
    canPublishCourses: boolean;
    canManageBilling: boolean;
  };
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  description: "Full description",
  shortDesc: "Short description",
  thumbnail: "Thumbnail",
  promoVideo: "Trailer",
  difficulty: "Difficulty",
  courseType: "Course type",
  previewCount: "Preview lesson count",
  categoryId: "Category",
  certificateEnabled: "Certificate setting",
  examGated: "Assessment gate",
  metaTitle: "SEO title",
  metaDescription: "SEO description",
  finalExamId: "Final exam",
};

const LESSON_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  overview: "Overview",
  videoUrl: "Video",
  duration: "Duration",
  isPublished: "Publish visibility",
  isPreview: "Preview access",
  contentType: "Lesson type",
  bodyContent: "Article content",
  transcript: "Transcript",
};

function formatPrice(value: unknown, currency = "NGN") {
  if (value === null || value === undefined) return "Free";
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Free";
  return `${currency.toUpperCase()} ${amount.toLocaleString()}`;
}

function getRevisionSummary(summary: unknown): RevisionChangeSummary | null {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;
  return summary as RevisionChangeSummary;
}

function asSnapshot(value: unknown): CourseSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as CourseSnapshot;
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function getChangeCount(summary: RevisionChangeSummary | null) {
  if (!summary) return 0;
  return [
    summary.changedFields,
    summary.addedModules,
    summary.removedModules,
    summary.editedModules,
    summary.addedLessons,
    summary.removedLessons,
    summary.editedLessons,
  ].reduce((total, items) => total + (items?.length ?? 0), 0);
}

function flattenLessons(snapshot: CourseSnapshot | null) {
  return new Map(
    (snapshot?.modules ?? []).flatMap((module) =>
      module.lessons.map((lesson) => [lesson.id, { ...lesson, moduleTitle: module.title, moduleId: module.id }])
    )
  );
}

function changedLessonFields(liveLesson: LessonSnapshot, draftLesson: LessonSnapshot) {
  return ["title", "overview", "videoUrl", "duration", "isPublished", "isPreview", "contentType", "bodyContent", "transcript"].filter(
    (field) =>
      stringifyValue(liveLesson[field as keyof LessonSnapshot]) !==
      stringifyValue(draftLesson[field as keyof LessonSnapshot])
  );
}

function buildChangeItems(
  summary: RevisionChangeSummary | null,
  live: CourseSnapshot | null,
  draft: CourseSnapshot | null
): ChangeItem[] {
  const items: ChangeItem[] = [];
  const liveLessons = flattenLessons(live);
  const draftLessons = flattenLessons(draft);
  const liveModules = new Map((live?.modules ?? []).map((module) => [module.id, module]));
  const draftModules = new Map((draft?.modules ?? []).map((module) => [module.id, module]));

  for (const field of summary?.changedFields ?? []) {
    items.push({
      id: `setting-${field}`,
      type: "edited",
      area: "Settings",
      title: FIELD_LABELS[field] ?? field,
      before: stringifyValue(live?.[field as keyof CourseSnapshot]),
      after: stringifyValue(draft?.[field as keyof CourseSnapshot]),
    });
  }

  for (const module of draft?.modules ?? []) {
    if (!liveModules.has(module.id)) {
      items.push({
        id: `module-added-${module.id}`,
        type: "added",
        area: "Modules",
        title: module.title,
        targetId: module.id,
        detail: `${module.lessons.length} lesson${module.lessons.length === 1 ? "" : "s"} included`,
      });
    } else {
      const liveModule = liveModules.get(module.id);
      if (
        liveModule &&
        (liveModule.title !== module.title ||
          liveModule.isPublished !== module.isPublished ||
          liveModule.position !== module.position)
      ) {
        items.push({
          id: `module-edited-${module.id}`,
          type: "edited",
          area: "Modules",
          title: module.title,
          targetId: module.id,
          before: liveModule.title,
          after: module.title,
        });
      }
    }
  }

  for (const module of live?.modules ?? []) {
    if (!draftModules.has(module.id)) {
      items.push({
        id: `module-removed-${module.id}`,
        type: "removed",
        area: "Modules",
        title: module.title,
        targetId: module.id,
        detail: "This live module will be hidden after approval.",
      });
    }
  }

  for (const lesson of draftLessons.values()) {
    const liveLesson = liveLessons.get(lesson.id);
    if (!liveLesson) {
      items.push({
        id: `lesson-added-${lesson.id}`,
        type: "added",
        area: "Lessons",
        title: lesson.title,
        targetId: lesson.id,
        detail: `Added to ${lesson.moduleTitle}`,
      });
      continue;
    }

    const fields = changedLessonFields(liveLesson, lesson);
    if (fields.length > 0) {
      items.push({
        id: `lesson-edited-${lesson.id}`,
        type: "edited",
        area: "Lessons",
        title: lesson.title,
        targetId: lesson.id,
        before: liveLesson.title,
        after: lesson.title,
        detail: fields.map((field) => LESSON_FIELD_LABELS[field] ?? field).join(", "),
      });
    }
  }

  for (const lesson of liveLessons.values()) {
    if (!draftLessons.has(lesson.id)) {
      items.push({
        id: `lesson-removed-${lesson.id}`,
        type: "removed",
        area: "Lessons",
        title: lesson.title,
        targetId: lesson.id,
        detail: `Removed from ${lesson.moduleTitle}`,
      });
    }
  }

  if (items.length > 0 || !summary) return items;

  for (const title of summary.addedLessons ?? []) items.push({ id: `summary-added-${title}`, type: "added", area: "Lessons", title });
  for (const title of summary.editedLessons ?? []) items.push({ id: `summary-edited-${title}`, type: "edited", area: "Lessons", title });
  for (const title of summary.removedLessons ?? []) items.push({ id: `summary-removed-${title}`, type: "removed", area: "Lessons", title });
  for (const title of summary.addedModules ?? []) items.push({ id: `summary-added-module-${title}`, type: "added", area: "Modules", title });
  for (const title of summary.editedModules ?? []) items.push({ id: `summary-edited-module-${title}`, type: "edited", area: "Modules", title });
  for (const title of summary.removedModules ?? []) items.push({ id: `summary-removed-module-${title}`, type: "removed", area: "Modules", title });
  return items;
}

function payoutReady(course: ReviewCourse) {
  const details = (course.instructor?.payoutDetails || {}) as {
    payoutCountry?: unknown;
    preferredCurrency?: unknown;
  };
  return Boolean(course.instructor?.payoutSetup && details.payoutCountry && details.preferredCurrency);
}

function toneFor(type: ChangeItem["type"]) {
  if (type === "added") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (type === "removed") return "bg-red-50 text-red-600 border-red-100";
  return "bg-[#EEF3FF] text-[#1C4ED1] border-[#D8E6FF]";
}

function ChangePill({ type }: { type: ChangeItem["type"] }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${toneFor(type)}`}>
      {type}
    </span>
  );
}

function ReviewTabs({
  active,
  onChange,
  counts,
}: {
  active: ReviewTab;
  onChange: (tab: ReviewTab) => void;
  counts: Record<ReviewTab, number>;
}) {
  const tabs: { id: ReviewTab; label: string; icon: React.ElementType }[] = [
    { id: "summary", label: "Summary", icon: Sparkles },
    { id: "curriculum", label: "Curriculum", icon: Layers3 },
    { id: "settings", label: "Settings", icon: FileText },
  ];

  return (
    <div className="admin-horizontal-scrollbar overflow-x-auto pb-1">
      <div className="flex min-w-max rounded-[14px] bg-[#E9EEF8] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-black transition ${
                isActive ? "bg-white text-[#040B37] shadow-sm" : "text-[#8C96A8] hover:text-[#040B37]"
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? "bg-[#EEF3FF] text-[#1C4ED1]" : "bg-white/70 text-[#8C96A8]"}`}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChangeRow({ item, onClick }: { item: ChangeItem; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#E3E8F4] bg-white px-4 py-3 text-left transition hover:border-[#BFD0F7] hover:bg-[#F8FAFF]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ChangePill type={item.type} />
          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">{item.area}</span>
        </div>
        <p className="mt-1 truncate text-[14px] font-black text-[#040B37]">{item.title}</p>
        {item.detail && <p className="mt-0.5 text-[12px] font-semibold text-[#667085]">{item.detail}</p>}
      </div>
      <ArrowRight size={15} className="shrink-0 text-[#9CA3AF] transition group-hover:translate-x-0.5 group-hover:text-[#1C4ED1]" />
    </button>
  );
}

function SettingDiff({ item }: { item: ChangeItem }) {
  return (
    <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Setting changed</p>
          <h4 className="mt-1 text-[15px] font-black text-[#040B37]">{item.title}</h4>
        </div>
        <ChangePill type="edited" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="rounded-[13px] bg-[#F4F6FB] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Current live</p>
          <p className="mt-1 line-clamp-5 text-[12px] font-bold leading-relaxed text-[#4B5563]">{item.before ?? "Not set"}</p>
        </div>
        <div className="hidden items-center text-[#9CA3AF] md:flex">
          <ArrowRight size={16} />
        </div>
        <div className="rounded-[13px] bg-[#EEF3FF] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">Pending update</p>
          <p className="mt-1 line-clamp-5 text-[12px] font-bold leading-relaxed text-[#040B37]">{item.after ?? "Not set"}</p>
        </div>
      </div>
    </div>
  );
}

function ContentBlock({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "pending";
}) {
  return (
    <div className={`rounded-[14px] p-4 ${tone === "pending" ? "bg-[#EEF3FF]" : "bg-[#F4F6FB]"}`}>
      <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${tone === "pending" ? "text-[#1C4ED1]" : "text-[#9CA3AF]"}`}>
        {title}
      </p>
      <div className="mt-2 text-[12px] font-semibold leading-relaxed text-[#040B37]">
        {children}
      </div>
    </div>
  );
}

function LessonContentDetails({ lesson }: { lesson: LessonSnapshot }) {
  const article = lesson.bodyContent?.trim();
  const transcript = lesson.transcript?.trim();
  const resources = lesson.resources ?? [];

  return (
    <div className="space-y-3">
      <p><span className="font-black">Title:</span> {lesson.title}</p>
      <p><span className="font-black">Overview:</span> {lesson.overview || "Not set"}</p>
      <p><span className="font-black">Type:</span> {lesson.contentType}</p>
      {lesson.videoUrl && <p className="break-all"><span className="font-black">Video:</span> {lesson.videoUrl}</p>}
      {article && (
        <div>
          <p className="font-black">Article content</p>
          <div className="mt-1 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-[10px] border border-white/70 bg-white/70 p-3 text-[12px] leading-relaxed text-[#4B5563]">
            {article}
          </div>
        </div>
      )}
      {transcript && (
        <div>
          <p className="font-black">Transcript</p>
          <div className="mt-1 max-h-[180px] overflow-y-auto whitespace-pre-wrap rounded-[10px] border border-white/70 bg-white/70 p-3 text-[12px] leading-relaxed text-[#4B5563]">
            {transcript}
          </div>
        </div>
      )}
      {resources.length > 0 && (
        <div>
          <p className="font-black">Resources</p>
          <div className="mt-2 space-y-1.5">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate rounded-[9px] border border-white/70 bg-white/70 px-3 py-2 text-[12px] font-bold text-[#1C4ED1] hover:underline"
              >
                {resource.title} <span className="text-[#9CA3AF]">({resource.type})</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function lessonStatus(lesson: LessonSnapshot, liveLessons: Map<string, LessonSnapshot & { moduleTitle: string; moduleId: string }>) {
  const liveLesson = liveLessons.get(lesson.id);
  if (!liveLesson) return "added" as const;
  return changedLessonFields(liveLesson, lesson).length > 0 ? ("edited" as const) : null;
}

function LessonPreview({
  live,
  draft,
  courseSlug,
}: {
  live?: (LessonSnapshot & { moduleTitle: string; moduleId: string }) | null;
  draft?: (LessonSnapshot & { moduleTitle: string; moduleId: string }) | null;
  courseSlug: string;
}) {
  const target = draft ?? live;
  if (!target) return null;
  const type = !live ? "added" : !draft ? "removed" : "edited";
  const fields = live && draft ? changedLessonFields(live, draft) : [];

  const previewLesson = draft ?? live;
  const canPreviewInPlayer = previewLesson && !previewLesson.id.startsWith("draft-");

  return (
    <div className="rounded-[18px] border border-[#D8E0EE] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#1C4ED1]" />
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">Lesson preview</p>
          </div>
          <h3 className="mt-1 text-[18px] font-black text-[#040B37]">{target.title}</h3>
          <p className="mt-1 text-[12px] font-bold text-[#9CA3AF]">{target.moduleTitle}</p>
        </div>
        <ChangePill type={type} />
      </div>

      {canPreviewInPlayer && (
        <a
          href={`/courses/${courseSlug}/watch/${previewLesson.id}?preview=true`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] border border-[#D8E0EE] bg-white px-4 text-[13px] font-black text-[#040B37] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
        >
          Preview lesson in player
        </a>
      )}

      {fields.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {fields.map((field) => (
            <span key={field} className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[11px] font-black text-[#1C4ED1]">
              {LESSON_FIELD_LABELS[field] ?? field}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ContentBlock title="Current live">
          {live ? (
            <LessonContentDetails lesson={live} />
          ) : (
            <p className="text-[12px] font-bold text-[#9CA3AF]">This lesson is new in the pending update.</p>
          )}
        </ContentBlock>
        <ContentBlock title="Pending update" tone="pending">
          {draft ? (
            <LessonContentDetails lesson={draft} />
          ) : (
            <p className="text-[12px] font-bold text-red-600">This lesson will be removed from the live course after approval.</p>
          )}
        </ContentBlock>
      </div>
    </div>
  );
}

export function AdminCourseApprovalWorkspace({ course, permissions }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>("summary");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [pricingRejectOpen, setPricingRejectOpen] = useState(false);
  const [pricingNote, setPricingNote] = useState("");

  const pendingPricing = course.pricingProposals?.find((proposal) => proposal.status === "PENDING") ?? null;
  const pendingRevision = course.revisions?.find((revision) => revision.status === "PENDING_REVIEW") ?? null;
  const revisionSummary = getRevisionSummary(pendingRevision?.changeSummary);
  const liveSnapshot = asSnapshot(pendingRevision?.liveSnapshot);
  const draftSnapshot = asSnapshot(pendingRevision?.draftSnapshot);
  const revisionChangeCount = getChangeCount(revisionSummary);
  const changeItems = useMemo(
    () => buildChangeItems(revisionSummary, liveSnapshot, draftSnapshot),
    [revisionSummary, liveSnapshot, draftSnapshot]
  );
  const liveLessons = useMemo(() => flattenLessons(liveSnapshot), [liveSnapshot]);
  const draftLessons = useMemo(() => flattenLessons(draftSnapshot), [draftSnapshot]);
  const selectedLiveLesson = selectedLessonId ? liveLessons.get(selectedLessonId) : null;
  const selectedDraftLesson = selectedLessonId ? draftLessons.get(selectedLessonId) : null;
  const currency = pendingPricing?.currency ?? course.baseCurrency ?? "NGN";
  const effectiveModules = draftSnapshot?.modules ?? course.modules;
  const readyThumbnail = Boolean(draftSnapshot ? draftSnapshot.thumbnail : course.thumbnail);
  const readyTrailer = Boolean(draftSnapshot ? draftSnapshot.promoVideo : course.promoVideo);
  const publishedModules = effectiveModules.filter((module) => module.isPublished);
  const publishedLessons = effectiveModules.flatMap((module) => module.lessons).filter((lesson) => lesson.isPublished);
  const isPaid = Number(course.price ?? pendingPricing?.proposedPrice ?? 0) > 0;
  const isReviewable = course.status === "PENDING_REVIEW" || Boolean(pendingRevision);
  const hasReviewWork = isReviewable || Boolean(pendingPricing);
  const settingsChanges = changeItems.filter((item) => item.area === "Settings");
  const curriculumChanges = changeItems.filter((item) => item.area !== "Settings");
  const addedCount = changeItems.filter((item) => item.type === "added").length;
  const editedCount = changeItems.filter((item) => item.type === "edited").length;
  const removedCount = changeItems.filter((item) => item.type === "removed").length;

  const readiness = useMemo(
    () => [
      { ok: readyThumbnail, label: "Thumbnail", required: true },
      { ok: readyTrailer, label: "Trailer", required: false },
      { ok: publishedModules.length > 0, label: "Published module", required: true },
      { ok: publishedLessons.length > 0, label: "Published lesson", required: true },
      { ok: !isPaid || payoutReady(course), label: "Payout ready", required: isPaid },
      { ok: !pendingPricing, label: "Pricing resolved", required: true },
    ],
    [course, isPaid, pendingPricing, publishedLessons.length, publishedModules.length, readyThumbnail, readyTrailer]
  );
  const canPublishNow = readiness.filter((item) => item.required).every((item) => item.ok) && isReviewable;

  if (!pendingRevision || !hasReviewWork) return null;

  const openReview = () => {
    setOpen(true);
    setActiveTab("summary");
  };

  const submitReview = (status: ReviewStatus) => {
    startTransition(async () => {
      const res = await reviewCourseAction(course.id, status, reviewNote);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        status === "APPROVED"
          ? pendingRevision
            ? "Course update approved and promoted live."
            : "Course approved and published."
          : status === "REJECTED"
            ? "Course rejected."
            : "Changes requested."
      );
      setReviewStatus(null);
      setReviewNote("");
      setOpen(false);
      router.refresh();
    });
  };

  const approvePricing = () => {
    if (!pendingPricing) return;
    startTransition(async () => {
      const res = await approvePricingProposalAction(pendingPricing.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Pricing approved.");
      router.refresh();
    });
  };

  const rejectPricing = () => {
    if (!pendingPricing) return;
    startTransition(async () => {
      const res = await rejectPricingProposalAction(pendingPricing.id, pricingNote);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Pricing rejected.");
      setPricingRejectOpen(false);
      setPricingNote("");
      router.refresh();
    });
  };

  return (
    <>
      <section className="border-b border-stroke bg-white px-4 py-3 font-jakarta sm:px-6">
        <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 shadow-[0_10px_30px_rgba(251,191,36,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-amber-100 text-amber-700 sm:mt-0">
              <AlertTriangle size={17} />
            </div>
            <div className="min-w-0">
              <p className="mt-1 text-[13px] font-black text-[#7A3B00]">
                {revisionChangeCount || changeItems.length || "Pending"} change{revisionChangeCount === 1 ? "" : "s"} waiting. Live course is untouched.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            rounded="[10px]"
            hasBorder={false}
            leftIcon={<Eye size={15} />}
            onClick={openReview}
            className="w-full bg-amber-600 text-white hover:bg-amber-700 sm:w-auto"
          >
            Open review
          </Button>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[120] font-jakarta">
          <button
            type="button"
            aria-label="Close review drawer"
            className="absolute inset-0 bg-[#040B37]/35 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-1/2 flex-col overflow-hidden bg-[#F4F6FB] shadow-[-24px_0_60px_rgba(4,11,55,0.18)]">
            <header className="border-b border-[#D8E0EE] bg-white px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="mt-1 text-[22px] font-black leading-tight tracking-[-0.04em] text-[#040B37] sm:text-[26px]">
                    {course.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pendingRevision && (
                      <span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">
                        Published update v{pendingRevision.version}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D8E0EE] bg-white text-[#040B37] transition hover:border-[#1C4ED1]"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="border-b border-[#D8E0EE] bg-white px-5 py-3 sm:px-6">
              <ReviewTabs
                active={activeTab}
                onChange={setActiveTab}
                counts={{
                  summary: changeItems.length,
                  curriculum: curriculumChanges.length,
                  settings: settingsChanges.length + (pendingPricing ? 1 : 0),
                }}
              />
            </div>

            <div className="admin-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {activeTab === "summary" && (
                <div className="space-y-5">
                  <section className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Added", value: addedCount, tone: "bg-emerald-50 text-emerald-700" },
                      { label: "Edited", value: editedCount, tone: "bg-[#EEF3FF] text-[#1C4ED1]" },
                      { label: "Removed", value: removedCount, tone: "bg-red-50 text-red-600" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[18px] border border-[#D8E0EE] bg-white p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">{item.label}</p>
                        <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-[22px] font-black text-black`}>{item.value}</p>
                      </div>
                    ))}
                  </section>

                  <section className="rounded-[18px] border border-[#D8E0EE] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-black text-[#040B37]">Change summary</h3>
                    </div>
                    <div className="mt-4 space-y-2">
                      {changeItems.length > 0 ? (
                        changeItems.map((item) => (
                          <ChangeRow
                            key={item.id}
                            item={item}
                            onClick={() => {
                              if (item.area === "Settings") setActiveTab("settings");
                              else {
                                setActiveTab("curriculum");
                                if (item.area === "Lessons" && item.targetId) setSelectedLessonId(item.targetId);
                              }
                            }}
                          />
                        ))
                      ) : (
                        <p className="rounded-[14px] bg-[#F8FAFF] p-4 text-[13px] font-bold text-[#667085]">
                          No field-level changes were detected for this review.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[18px] border border-[#D8E0EE] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#1C4ED1]" />
                      <h3 className="text-[16px] font-black text-[#040B37]">Readiness</h3>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {readiness.map((item) => (
                        <span
                          key={item.label}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black ${
                            item.ok
                              ? "bg-emerald-50 text-emerald-700"
                              : item.required
                                ? "bg-amber-50 text-amber-800"
                                : "bg-[#F4F6FB] text-[#667085]"
                          }`}
                        >
                          {item.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          {item.label}
                          {!item.required && !item.ok ? " recommended" : ""}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "curriculum" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                  <section className="space-y-3">
                    {(draftSnapshot?.modules ?? []).map((module) => {
                      const moduleItem = changeItems.find((item) => item.area === "Modules" && item.targetId === module.id);
                      return (
                        <div key={module.id} className="rounded-[18px] border border-[#D8E0EE] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Module</p>
                              <h3 className="mt-1 truncate text-[15px] font-black text-[#040B37]">{module.title}</h3>
                            </div>
                            {moduleItem && <ChangePill type={moduleItem.type} />}
                          </div>
                          <div className="mt-3 space-y-2">
                            {module.lessons.length > 0 ? (
                              module.lessons.map((lesson) => {
                                const status = lessonStatus(lesson, liveLessons);
                                return (
                                  <button
                                    key={lesson.id}
                                    type="button"
                                    onClick={() => setSelectedLessonId(lesson.id)}
                                    className={`flex w-full items-center justify-between gap-3 rounded-[13px] border px-3 py-2.5 text-left transition ${
                                      selectedLessonId === lesson.id
                                        ? "border-[#1C4ED1] bg-[#EEF3FF]"
                                        : "border-[#E3E8F4] bg-[#F8FAFF] hover:border-[#BFD0F7]"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-[13px] font-black text-[#040B37]">{lesson.title}</p>
                                      <p className="mt-0.5 text-[11px] font-semibold text-[#9CA3AF]">
                                        {lesson.contentType} {lesson.duration ? `• ${lesson.duration}m` : ""}
                                      </p>
                                    </div>
                                    {status && <ChangePill type={status} />}
                                  </button>
                                );
                              })
                            ) : (
                              <p className="rounded-[13px] bg-[#F8FAFF] p-3 text-[12px] font-bold text-[#9CA3AF]">No lessons in this module.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {changeItems.filter((item) => item.area === "Lessons" && item.type === "removed").length > 0 && (
                      <div className="rounded-[18px] border border-red-100 bg-red-50 p-4">
                        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-red-600">Removed from live</p>
                        <div className="mt-3 space-y-2">
                          {changeItems
                            .filter((item) => item.area === "Lessons" && item.type === "removed")
                            .map((item) => (
                              <ChangeRow key={item.id} item={item} onClick={() => item.targetId && setSelectedLessonId(item.targetId)} />
                            ))}
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="lg:sticky lg:top-5 lg:self-start">
                    {selectedLessonId ? (
                      <LessonPreview live={selectedLiveLesson} draft={selectedDraftLesson} courseSlug={course.slug} />
                    ) : (
                      <div className="rounded-[18px] border border-dashed border-[#BFD0F7] bg-white p-6 text-center">
                        <BookOpen className="mx-auto text-[#1C4ED1]" size={24} />
                        <h3 className="mt-3 text-[16px] font-black text-[#040B37]">Select a changed lesson</h3>
                        <p className="mt-1 text-[13px] font-semibold leading-relaxed text-[#667085]">
                          Click a lesson to compare the current live version with the pending update.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-5">
                  {settingsChanges.length > 0 ? (
                    settingsChanges.map((item) => <SettingDiff key={item.id} item={item} />)
                  ) : (
                    <section className="rounded-[18px] border border-[#D8E0EE] bg-white p-6 text-center">
                      <FileText className="mx-auto text-[#1C4ED1]" size={24} />
                      <h3 className="mt-3 text-[16px] font-black text-[#040B37]">No settings changes</h3>
                      <p className="mt-1 text-[13px] font-semibold text-[#667085]">This update only changed curriculum content.</p>
                    </section>
                  )}

                  {pendingPricing && (
                    <section className="rounded-[18px] border border-[#D8E0EE] bg-white p-4">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-[#1C4ED1]" />
                        <h3 className="text-[16px] font-black text-[#040B37]">Pricing review</h3>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[14px] bg-[#F4F6FB] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Current</p>
                          <p className="mt-1 text-[18px] font-black text-[#040B37]">{formatPrice(pendingPricing.currentPriceSnapshot, currency)}</p>
                        </div>
                        <div className="rounded-[14px] bg-[#EEF3FF] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">Proposed</p>
                          <p className="mt-1 text-[18px] font-black text-[#040B37]">{formatPrice(pendingPricing.proposedPrice, currency)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" size="sm" rounded="[10px]" disabled={!permissions.canManageBilling || pending} loading={pending && !pricingRejectOpen} leftIcon={<CheckCircle2 size={15} />} onClick={approvePricing}>
                          Approve price
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          rounded="[10px]"
                          disabled={!permissions.canManageBilling || pending}
                          leftIcon={<XCircle size={15} />}
                          onClick={() => setPricingRejectOpen((value) => !value)}
                          className="text-red-600 hover:border-red-300 hover:text-red-600"
                        >
                          Reject price
                        </Button>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            <footer className="border-t border-[#D8E0EE] bg-white px-5 py-4 sm:px-6">
              {(reviewStatus || pricingRejectOpen) && (
                <div className="mb-4 rounded-[16px] border border-[#D8E0EE] bg-[#F8FAFF] p-4">
                  {reviewStatus && (
                    <div className="space-y-3">
                      <label className="text-[12px] font-black uppercase tracking-[0.1em] text-[#040B37]">
                        {reviewStatus === "APPROVED" ? "Optional approval note" : "Feedback for instructor"}
                      </label>
                      <textarea
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        rows={3}
                        placeholder={reviewStatus === "APPROVED" ? "Optional note after approval." : "Tell the instructor exactly what to fix and why."}
                        className="w-full resize-none rounded-[12px] border border-[#E3E8F4] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" rounded="[10px]" disabled={pending} onClick={() => setReviewStatus(null)}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" rounded="[10px]" disabled={pending} loading={pending} onClick={() => submitReview(reviewStatus)}>
                          Confirm decision <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}

                  {pricingRejectOpen && (
                    <div className="space-y-3">
                      <label className="text-[12px] font-black uppercase tracking-[0.1em] text-[#040B37]">Pricing rejection note</label>
                      <textarea
                        value={pricingNote}
                        onChange={(event) => setPricingNote(event.target.value)}
                        rows={3}
                        placeholder="Explain what price or justification you need before approval."
                        className="w-full resize-none rounded-[12px] border border-[#E3E8F4] bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" rounded="[10px]" disabled={pending} onClick={() => setPricingRejectOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" rounded="[10px]" disabled={pending} loading={pending} onClick={rejectPricing} className="bg-red-600 hover:bg-red-700">
                          Reject pricing
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    rounded="[10px]"
                    hasBorder={false}
                    disabled={!permissions.canPublishCourses || !canPublishNow || pending}
                    loading={pending && reviewStatus === "APPROVED"}
                    leftIcon={<CheckCircle2 size={15} />}
                    onClick={() => setReviewStatus("APPROVED")}
                  >
                    {pendingRevision ? "Approve update" : "Approve & publish"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    rounded="[10px]"
                    disabled={!permissions.canReviewCourses || !isReviewable || pending}
                    leftIcon={<MessageSquareWarning size={15} />}
                    onClick={() => setReviewStatus("CHANGES_REQUESTED")}
                  >
                    Request changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rounded="[10px]"
                    disabled={!permissions.canReviewCourses || !isReviewable || pending}
                    leftIcon={<XCircle size={15} />}
                    onClick={() => setReviewStatus("REJECTED")}
                    className="text-red-600 hover:border-red-300 hover:text-red-600"
                  >
                    Reject
                  </Button>
                </div>
              </div>
              {!canPublishNow && isReviewable && (
                <p className="mt-2 text-[12px] font-bold text-amber-700">
                  Required readiness checks must pass before publishing. Trailer is recommended, not blocking.
                </p>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
