'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import {
  ArrowLeft, GripVertical, Plus, ChevronDown, ChevronRight,
  Video, Lock, Eye, Trash2, Pencil, X, AlertTriangle, ExternalLink,
} from 'lucide-react';
import {
  createModuleAction, updateModuleAction, deleteModuleAction, reorderModulesAction,
  createLessonAction, createStandaloneLessonAction, reorderLessonsAction, deleteLessonAction, moveAndReorderLessonsAction,
  updateLessonPublishStateAction, updateModulePublishStateAction,
} from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import LessonEditor from './LessonEditor';
import type { LessonQuiz } from './QuizLessonBuilder';
import { LessonTypeIcon } from '@/components/dashboard/courses/LessonTypeIcon';
import { ArticleContent } from '@/components/dashboard/courses/ArticleContent';

interface Lesson {
  id: string; title: string; position: number;
  videoUrl: string | null; duration: number | null;
  isPublished: boolean; isPreview: boolean; overview: string | null; transcript: string | null;
  bodyContent: string | null;
  contentType: string;
  resources: { id: string; title: string; url: string; type: string }[];
  quiz: LessonQuiz;
  muxStatus: string;
  muxPlaybackId: string | null;
}
interface Module { id: string; title: string; position: number; isPublished: boolean; isDefault: boolean; lessons: Lesson[] }

interface Props { courseId: string; courseTitle: string; courseSlug: string; initialModules: Module[]; isAdmin?: boolean; isLocked?: boolean }

function normalizeLessonForState(lesson: Lesson | (Omit<Lesson, 'quiz'> & { quiz: unknown })): Lesson {
  const quiz =
    lesson.quiz && typeof lesson.quiz === 'object' && !Array.isArray(lesson.quiz)
      ? (lesson.quiz as LessonQuiz)
      : null;

  return { ...lesson, quiz };
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

function ConfirmModal({
  title, message, confirmLabel = 'Confirm', destructive = false, onConfirm, onCancel,
}: ConfirmState & { onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            destructive ? 'bg-red-50' : 'bg-amber-50'
          }`}>
            <AlertTriangle size={18} className={destructive ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-navy text-base">{title}</h3>
            <p className="text-sm text-text-mute mt-1">{message}</p>
          </div>
          <button onClick={onCancel} className="text-text-mute hover:text-navy transition-colors shrink-0 -mt-0.5">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-stroke rounded-xl text-sm font-semibold text-navy hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
              destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Lesson Row ───────────────────────────────────────────────────────

function SortableLesson({
  lesson, isSelected, isReadOnly,
  onSelect, onDelete,
  onPublishToggle,
}: {
  lesson: Lesson; isSelected: boolean; isReadOnly: boolean;
  onSelect: () => void; onDelete: () => void;
  onPublishToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.id, disabled: isReadOnly });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-2.5 py-2.5 transition-all sm:ml-6 sm:px-3 ${
        isDragging ? 'opacity-50 bg-white shadow-lg z-50' :
        isSelected ? 'bg-primary/5 border-primary/30' :
        isReadOnly ? 'bg-white border-transparent' :
        'bg-white border-transparent hover:border-stroke hover:bg-background/60 cursor-pointer'
      }`}
      onClick={onSelect}
    >
      {!isReadOnly && (
        <button
          {...attributes} {...listeners}
          className="-ml-1 flex h-8 w-8 shrink-0 touch-none items-center justify-center rounded-lg text-text-mute/45 transition hover:bg-[#1C4ED1]/5 hover:text-text-mute active:cursor-grabbing sm:h-7 sm:w-7"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Drag ${lesson.title}`}
        >
          <GripVertical size={16} />
        </button>
      )}
      {isReadOnly && <span className="hidden" />}
      <span className="shrink-0">
        <LessonTypeIcon contentType={lesson.contentType} size="xs" />
      </span>
      <span className={`min-w-0 text-sm font-medium leading-snug break-words ${isSelected ? 'text-primary' : 'text-navy'}`}>
        {lesson.title}
      </span>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <span className={`hidden 2xl:inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
          lesson.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {lesson.isPublished ? 'Live' : 'Draft'}
        </span>
        {lesson.isPreview
          ? <Eye size={12} className="text-primary/60" aria-label="Preview" />
          : <Lock size={12} className="text-text-mute/50" aria-label="Locked" />
        }
        {lesson.duration && <span className="text-[11px] text-text-mute">{lesson.duration}m</span>}
        {!isReadOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); onPublishToggle(); }}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
              lesson.isPublished
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
            title={lesson.isPublished ? 'Move lesson to draft' : 'Publish lesson'}
          >
            {lesson.isPublished ? 'Live' : 'Draft'}
          </button>
        )}
        {!isReadOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-mute transition-colors hover:bg-red-50 hover:text-red-500 sm:h-7 sm:w-7"
            title="Delete lesson"
            aria-label={`Delete ${lesson.title}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sortable Module ───────────────────────────────────────────────────────────

function SortableModule({
  mod, courseId, selectedId, isReadOnly,
  onSelectLesson, onLessonDelete,
  onModuleRename, onModuleDelete, onAddLesson,
  onModulePublishToggle, onLessonPublishToggle,
}: {
  mod: Module; courseId: string; selectedId: string | null; isReadOnly: boolean;
  onSelectLesson: (l: Lesson) => void;
  onLessonDelete: (lessonId: string, moduleId: string) => void;
  onModuleRename: (moduleId: string, title: string) => void;
  onModuleDelete: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onModulePublishToggle: (moduleId: string, isPublished: boolean) => void;
  onLessonPublishToggle: (lessonId: string, isPublished: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(mod.title);
  const isDefaultModule = mod.isDefault;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id, disabled: isReadOnly });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col rounded-2xl border transition-all ${isDragging ? 'opacity-50 shadow-xl' : 'border-stroke bg-white'}`}
    >
      {/* Module header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {!isReadOnly && (
          <button
            {...attributes} {...listeners}
            className="flex h-8 w-8 shrink-0 touch-none items-center justify-center rounded-lg text-text-mute/45 transition hover:bg-[#1C4ED1]/5 hover:text-text-mute active:cursor-grabbing"
            aria-label={`Drag ${isDefaultModule ? 'Lessons section' : mod.title}`}
          >
            <GripVertical size={16} />
          </button>
        )}
        <button onClick={() => setOpen((o) => !o)} className="text-text-mute shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {editing && !isReadOnly && !isDefaultModule ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => { onModuleRename(mod.id, editTitle); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onModuleRename(mod.id, editTitle); setEditing(false); }
              if (e.key === 'Escape') { setEditTitle(mod.title); setEditing(false); }
            }}
            className="flex-1 text-sm font-semibold text-navy border-b border-primary outline-none bg-transparent"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-navy break-words cursor-text"
            onDoubleClick={() => !isReadOnly && !isDefaultModule && setEditing(true)}
          >
            {isDefaultModule ? 'Lessons' : mod.title}
          </span>
        )}

        <span className="text-[11px] text-text-mute shrink-0 ml-1">{mod.lessons.length} lessons</span>
        {!isReadOnly && (
          <button
            onClick={() => onModulePublishToggle(mod.id, !mod.isPublished)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
              mod.isPublished
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
            title={mod.isPublished ? 'Move module to draft' : 'Publish module'}
          >
            {mod.isPublished ? 'Live' : 'Draft'}
          </button>
        )}
        {!isReadOnly && !isDefaultModule && (
          <button onClick={() => setEditing(true)} className="p-1.5 text-text-mute hover:text-primary rounded transition-colors shrink-0">
            <Pencil size={13} />
          </button>
        )}
        {!isReadOnly && (
          <button
            onClick={() => onModuleDelete(mod.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-mute transition-colors hover:bg-red-50 hover:text-red-500"
            title={isDefaultModule ? 'Delete lessons section' : 'Delete module'}
            aria-label={isDefaultModule ? 'Delete lessons section' : `Delete ${mod.title}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Lessons */}
      {open && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          <SortableContext items={mod.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {mod.lessons.map((lesson) => (
              <SortableLesson
                key={lesson.id}
                lesson={lesson}
                isSelected={selectedId === lesson.id}
                isReadOnly={isReadOnly}
                onSelect={() => onSelectLesson(lesson)}
                onDelete={() => onLessonDelete(lesson.id, mod.id)}
                onPublishToggle={() => onLessonPublishToggle(lesson.id, !lesson.isPublished)}
              />
            ))}
          </SortableContext>

          {!isReadOnly && (
            <button
              onClick={() => onAddLesson(mod.id)}
              className="ml-6 mt-1 flex items-center gap-1.5 text-xs text-primary font-medium hover:underline w-fit px-2 py-1"
            >
              <Plus size={13} /> Add lesson
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})|^([a-zA-Z0-9_-]{11})$/);
  return match?.[1] ?? match?.[2] ?? null;
}

function LessonReadOnlyPreview({ lesson, courseSlug }: { lesson: Lesson; courseSlug: string }) {
  const youtubeId = extractYouTubeId(lesson.videoUrl);
  const isQuiz = lesson.contentType === 'QUIZ';
  const isArticle = lesson.contentType === 'ARTICLE';
  const canPreviewInPlayer = !lesson.id.startsWith('draft-') && !lesson.id.startsWith('temp-');

  return (
    <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 border-b border-stroke pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <LessonTypeIcon contentType={lesson.contentType} size="sm" />
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-primary">
              Read-only review
            </span>
          </div>
          <h3 className="mt-2 text-[20px] font-black leading-tight text-navy">{lesson.title}</h3>
          {lesson.overview && <p className="mt-2 text-sm font-medium leading-6 text-text-body">{lesson.overview}</p>}
        </div>
        {canPreviewInPlayer ? (
          <Link
            href={`/courses/${courseSlug}/watch/${lesson.id}?preview=true`}
            target="_blank"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#D8E0EE] bg-white px-4 text-[13px] font-black text-[#040B37] transition hover:border-primary hover:text-primary"
          >
            <ExternalLink size={14} /> Preview in player
          </Link>
        ) : (
          <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F4F6FB] px-4 text-[12px] font-black text-text-mute">
            Preview after approval
          </span>
        )}
      </div>

      {isQuiz ? (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-4">
            <p className="text-sm font-black text-navy">Quiz settings</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[12px] font-bold text-text-body">
              <span className="rounded-full bg-white px-3 py-1">Mode: {lesson.quiz?.mode ?? 'Not set'}</span>
              <span className="rounded-full bg-white px-3 py-1">Passing: {lesson.quiz?.passingScore ?? 'Optional'}</span>
              <span className="rounded-full bg-white px-3 py-1">Attempts: {lesson.quiz?.maxAttempts ?? 'Unlimited'}</span>
            </div>
            {lesson.quiz?.instructions && <p className="mt-3 text-sm font-medium leading-6 text-text-body">{lesson.quiz.instructions}</p>}
          </div>
          {lesson.quiz?.questions?.length ? (
            lesson.quiz.questions.map((question, index) => (
              <div key={question.id ?? index} className="rounded-[14px] border border-stroke bg-white p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.1em] text-primary">Question {index + 1}</p>
                <p className="mt-2 text-sm font-black text-navy">{question.prompt || 'Untitled question'}</p>
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={option.id ?? optionIndex} className={`rounded-[10px] border px-3 py-2 text-sm font-semibold ${
                      option.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#E3E8F4] bg-[#F8FAFF] text-text-body'
                    }`}>
                      {option.text || `Option ${optionIndex + 1}`}{option.isCorrect ? ' ✓' : ''}
                    </div>
                  ))}
                </div>
                {question.explanation && <p className="mt-3 text-xs font-semibold leading-5 text-text-mute">Explanation: {question.explanation}</p>}
              </div>
            ))
          ) : (
            <p className="rounded-[12px] bg-[#F8FAFF] p-4 text-sm font-semibold text-text-mute">No quiz questions yet.</p>
          )}
        </div>
      ) : isArticle ? (
        <div className="rounded-[14px] border border-[#E3E8F4] bg-white p-4">
          <ArticleContent body={lesson.bodyContent} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-[14px] bg-[#0B1020]">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title={lesson.title}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            ) : lesson.muxPlaybackId ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-white/75">
                Mux video is attached. Use public preview to test signed playback.
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-white/75">
                No video attached yet.
              </div>
            )}
          </div>
          {lesson.transcript && (
            <div className="rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-primary">Transcript</p>
              <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-text-body">{lesson.transcript}</p>
            </div>
          )}
        </div>
      )}

      {lesson.resources.length > 0 && (
        <div className="mt-5 rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-primary">Resources</p>
          <div className="space-y-2">
            {lesson.resources.map((resource) => (
              <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="block rounded-[10px] bg-white px-3 py-2 text-sm font-bold text-navy hover:text-primary">
                {resource.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Builder ──────────────────────────────────────────────────────────────

export default function CurriculumBuilder({ courseId, courseTitle, courseSlug, initialModules, isAdmin = false, isLocked = false }: Props) {
  const isReadOnly = isAdmin || isLocked;
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isLessonDetailOpen, setIsLessonDetailOpen] = useState(false);
  const [shouldRenderLessonDetail, setShouldRenderLessonDetail] = useState(false);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const [lessonIsDirty, setLessonIsDirty] = useState(false);
  const [adding, startAdd] = useTransition();
  const [, startReorder] = useTransition();
  const [structureSaveStatus, setStructureSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const showConfirm = (state: ConfirmState) => setConfirmState(state);
  const closeConfirm = () => setConfirmState(null);
  const realModules = modules.filter((module) => !module.isDefault);
  const defaultModule = modules.find((module) => module.isDefault) ?? null;
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  useEffect(() => {
    editorPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedLesson?.id]);

  useEffect(() => {
    if (isLessonDetailOpen) {
      setShouldRenderLessonDetail(true);
      return;
    }

    const timeoutId = window.setTimeout(() => setShouldRenderLessonDetail(false), 260);
    return () => window.clearTimeout(timeoutId);
  }, [isLessonDetailOpen]);

  useEffect(() => {
    setModules(initialModules);
    setSelectedLesson((current) => {
      if (!current) return current;
      const refreshed = initialModules.flatMap((module) => module.lessons).find((lesson) => lesson.id === current.id);
      return refreshed ?? current;
    });
  }, [initialModules]);

  const createLessonPlaceholder = (title: string, position: number): Lesson => ({
    id: `temp-les-${Date.now()}`,
    title,
    position,
    isPublished: false,
    isPreview: false,
    duration: null,
    videoUrl: null,
    overview: null,
    contentType: 'VIDEO',
    transcript: null,
    bodyContent: null,
    muxStatus: 'idle',
    muxPlaybackId: null,
    quiz: null,
    resources: [],
  });

  const openMobileLessonDetail = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1028) {
      setIsLessonDetailOpen(true);
    }
  };

  const selectLesson = (lesson: Lesson, moduleId: string) => {
    if (lessonIsDirty && selectedLesson?.id !== lesson.id) {
      showConfirm({
        title: 'Unsaved Changes',
        message: 'This lesson has unsaved changes. Leave without saving?',
        confirmLabel: 'Leave',
        destructive: false,
        onConfirm: () => {
          setSelectedLesson(lesson);
          setSelectedModuleId(moduleId);
          setLessonIsDirty(false);
          openMobileLessonDetail();
          closeConfirm();
        },
      });
    } else {
      setSelectedLesson(lesson);
      setSelectedModuleId(moduleId);
      openMobileLessonDetail();
    }
  };

  const closeLessonDetail = () => {
    if (!isAdmin && lessonIsDirty) {
      showConfirm({
        title: 'Unsaved Changes',
        message: 'This lesson has unsaved changes. Go back to the outline without saving?',
        confirmLabel: 'Go back',
        destructive: false,
        onConfirm: () => {
          setIsLessonDetailOpen(false);
          setLessonIsDirty(false);
          closeConfirm();
        },
      });
      return;
    }

    setIsLessonDetailOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Case 1: Reordering modules
    const isModule = modules.some((m) => m.id === activeId);
    if (isModule) {
      if (activeId === overId) return;
      const oldIdx = modules.findIndex((m) => m.id === activeId);
      const newIdx = modules.findIndex((m) => m.id === overId);
      if (oldIdx !== -1 && newIdx !== -1) {
        const original = [...modules];
        const reordered = arrayMove(modules, oldIdx, newIdx);
        setModules(reordered);
        setStructureSaveStatus('saving');
        reorderModulesAction(courseId, reordered.map((m) => m.id))
          .then(() => setStructureSaveStatus('saved'))
          .catch(() => {
            setModules(original);
            setStructureSaveStatus('error');
            toast.error('Failed to reorder modules.');
          });
      }
      return;
    }

    // Case 2: Dragging a lesson
    const activeModule = modules.find((m) => m.lessons.some((l) => l.id === activeId));
    if (!activeModule) return;

    let overModule = modules.find((m) => m.id === overId);
    let overLessonIndex = -1;

    if (!overModule) {
      overModule = modules.find((m) =>
        m.lessons.some((l, idx) => {
          if (l.id === overId) {
            overLessonIndex = idx;
            return true;
          }
          return false;
        })
      );
    }

    if (!overModule) return;

    const originalModules = [...modules];

    // Scenario A: Same module reordering
    if (activeModule.id === overModule.id) {
      const lessons = activeModule.lessons;
      const oldIdx = lessons.findIndex((l) => l.id === activeId);
      const newIdx = overLessonIndex !== -1 ? overLessonIndex : lessons.length - 1;
      if (oldIdx === newIdx || oldIdx === -1) return;

      const reorderedLessons = arrayMove([...lessons], oldIdx, newIdx);

      setModules((prev) =>
        prev.map((m) => (m.id === activeModule.id ? { ...m, lessons: reorderedLessons } : m))
      );

      setStructureSaveStatus('saving');
      reorderLessonsAction(activeModule.id, courseId, reorderedLessons.map((l) => l.id))
        .then(() => setStructureSaveStatus('saved'))
        .catch(() => {
          setModules(originalModules);
          setStructureSaveStatus('error');
          toast.error('Failed to reorder lessons.');
        });
    } else {
      // Scenario B: Moving lesson across modules
      const sourceLessons = [...activeModule.lessons];
      const activeIdx = sourceLessons.findIndex((l) => l.id === activeId);
      if (activeIdx === -1) return;
      const [movedLesson] = sourceLessons.splice(activeIdx, 1);

      const targetLessons = [...overModule.lessons];
      const insertIdx = overLessonIndex !== -1 ? overLessonIndex : targetLessons.length;
      targetLessons.splice(insertIdx, 0, movedLesson);

      setModules((prev) =>
        prev.map((m) => {
          if (m.id === activeModule.id) {
            return { ...m, lessons: sourceLessons };
          }
          if (m.id === overModule.id) {
            return { ...m, lessons: targetLessons };
          }
          return m;
        })
      );

      if (selectedLesson?.id === activeId) {
        setSelectedModuleId(overModule.id);
      }

      setStructureSaveStatus('saving');
      moveAndReorderLessonsAction(
        activeId,
        activeModule.id,
        overModule.id,
        targetLessons.map((l) => l.id),
        courseId
      )
        .then(() => setStructureSaveStatus('saved'))
        .catch(() => {
          setModules(originalModules);
          setStructureSaveStatus('error');
          toast.error('Failed to move lesson to another module.');
        });
    }
  };

  const handleAddModule = () => {
    const tempId = `temp-mod-${Date.now()}`;
    const newTitle = `Module ${realModules.length + 1}`;
    const placeholder: Module = {
      id: tempId,
      title: newTitle,
      position: modules.length + 1,
      isPublished: false,
      isDefault: false,
      lessons: [],
    };

    setModules((prev) => [...prev, placeholder]);

    createModuleAction(courseId, newTitle)
      .then((actualMod) => {
        setModules((prev) =>
          prev.map((m) => m.id === tempId ? { ...actualMod, isDefault: false, lessons: [] } : m)
        );
      })
      .catch(() => {
        setModules((prev) => prev.filter((m) => m.id !== tempId));
        toast.error('Failed to add module.');
      });
  };

  const handleAddLesson = (moduleId: string) => {
    const newTitle = `Lesson ${(modules.find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1}`;
    const placeholder = createLessonPlaceholder(
      newTitle,
      (modules.find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1
    );
    const tempId = placeholder.id;

    setModules((prev) =>
      prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, placeholder] } : m)
    );
    setSelectedLesson(placeholder);
    setSelectedModuleId(moduleId);
    setLessonIsDirty(false);

    createLessonAction(moduleId, newTitle, courseId)
      .then((actualLesson) => {
        const normalizedLesson = normalizeLessonForState(actualLesson);
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lessons: m.lessons.map((l) => l.id === tempId ? normalizedLesson : l),
                }
              : m
          )
        );
        setSelectedLesson((current) => current?.id === tempId ? normalizedLesson : current);
      })
      .catch(() => {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.filter((l) => l.id !== tempId) }
              : m
          )
        );
        setSelectedLesson((current) => current?.id === tempId ? null : current);
        toast.error('Failed to add lesson.');
      });
  };

  const handleAddStandaloneLesson = () => {
    const targetModuleId =
      selectedModuleId && modules.some((module) => module.id === selectedModuleId)
        ? selectedModuleId
        : realModules[realModules.length - 1]?.id ?? null;

    if (targetModuleId) {
      handleAddLesson(targetModuleId);
      return;
    }

    const tempModuleId = defaultModule?.id ?? `temp-default-mod-${Date.now()}`;
    const currentLessonCount = defaultModule?.lessons.length ?? 0;
    const newTitle = `Lesson ${currentLessonCount + 1}`;
    const placeholderLesson = createLessonPlaceholder(newTitle, currentLessonCount + 1);
    const tempLessonId = placeholderLesson.id;
    const placeholderModule: Module = defaultModule ?? {
      id: tempModuleId,
      title: 'Course lessons',
      position: 0,
      isPublished: false,
      isDefault: true,
      lessons: [],
    };

    setModules((prev) => {
      const hasDefault = prev.some((module) => module.id === tempModuleId);
      if (hasDefault) {
        return prev.map((module) =>
          module.id === tempModuleId
            ? { ...module, lessons: [...module.lessons, placeholderLesson] }
            : module
        );
      }
      return [{ ...placeholderModule, lessons: [placeholderLesson] }, ...prev];
    });
    setSelectedLesson(placeholderLesson);
    setSelectedModuleId(tempModuleId);
    setLessonIsDirty(false);

    createStandaloneLessonAction(courseId, newTitle)
      .then(({ module: actualModule, lesson: actualLesson }) => {
        const normalizedLesson = normalizeLessonForState(actualLesson);
        setModules((prev) => {
          const withoutTempDefault = prev.filter((module) => module.id !== tempModuleId || module.id === actualModule.id);
          const hasActualDefault = withoutTempDefault.some((module) => module.id === actualModule.id);

          if (hasActualDefault) {
            return withoutTempDefault.map((module) =>
              module.id === actualModule.id
                ? {
                  ...module,
                  ...actualModule,
                  lessons: module.lessons.map((lesson) => lesson.id === tempLessonId ? normalizedLesson : lesson),
                }
                : module
            );
          }

          return [
            { ...actualModule, lessons: [normalizedLesson] },
            ...withoutTempDefault.filter((module) => module.id !== tempModuleId),
          ];
        });
        setSelectedLesson((current) => current?.id === tempLessonId ? normalizedLesson : current);
        setSelectedModuleId(actualModule.id);
      })
      .catch(() => {
        setModules((prev) =>
          prev
            .map((module) =>
              module.id === tempModuleId
                ? { ...module, lessons: module.lessons.filter((lesson) => lesson.id !== tempLessonId) }
                : module
            )
            .filter((module) => module.id !== tempModuleId || module.lessons.length > 0 || module.id === defaultModule?.id)
        );
        setSelectedLesson((current) => current?.id === tempLessonId ? null : current);
        toast.error('Failed to add lesson.');
      });
  };

  const handleLessonPublishToggle = (lessonId: string, isPublished: boolean) => {
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, isPublished } : l)),
      }))
    );
    setSelectedLesson((current) => current?.id === lessonId ? { ...current, isPublished } : current);
    updateLessonPublishStateAction(lessonId, courseId, isPublished)
      .then(() => toast.success(isPublished ? 'Lesson published.' : 'Lesson moved to draft.'))
      .catch(() => toast.error('Failed to update lesson visibility.'));
  };

  const handleModulePublishToggle = (moduleId: string, isPublished: boolean) => {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, isPublished } : m)));
    updateModulePublishStateAction(moduleId, courseId, isPublished)
      .then(() => toast.success(isPublished ? 'Module published.' : 'Module moved to draft.'))
      .catch(() => toast.error('Failed to update module visibility.'));
  };

  const handleModuleRename = (moduleId: string, title: string) => {
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, title } : m));
    updateModuleAction(moduleId, title, courseId).catch(() => toast.error('Failed to rename module.'));
  };

  const handleModuleDelete = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    const isDefaultModule = !!mod?.isDefault;
    showConfirm({
      title: isDefaultModule ? 'Delete Lessons Section' : 'Delete Module',
      message: isDefaultModule
        ? `The flat lessons section and its ${mod?.lessons.length ?? 0} lesson${mod?.lessons.length === 1 ? '' : 's'} will be permanently deleted.`
        : `"${mod?.title}" and all its lessons will be permanently deleted.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        setModules((prev) => prev.filter((m) => m.id !== moduleId));
        if (selectedModuleId === moduleId) { setSelectedLesson(null); setSelectedModuleId(null); }
        deleteModuleAction(moduleId, courseId).catch(() => toast.error('Failed to delete module.'));
        closeConfirm();
      },
    });
  };

  const handleLessonDelete = (lessonId: string, moduleId: string) => {
    const lesson = modules.find((m) => m.id === moduleId)?.lessons.find((l) => l.id === lessonId);
    showConfirm({
      title: 'Delete Lesson',
      message: `"${lesson?.title}" will be permanently deleted.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        setModules((prev) =>
          prev.map((m) => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m)
        );
        if (selectedLesson?.id === lessonId) { setSelectedLesson(null); setLessonIsDirty(false); }
        deleteLessonAction(lessonId, courseId).catch(() => toast.error('Failed to delete lesson.'));
        closeConfirm();
      },
    });
  };

  const handleLessonUpdate = (updated: Lesson) => {
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => l.id === updated.id ? updated : l),
      }))
    );
    setSelectedLesson(updated);
  };

  const selectedModule = modules.find((module) => module.id === selectedModuleId);

  const lessonDetailContent = selectedLesson ? (
    isAdmin ? (
      <LessonReadOnlyPreview lesson={selectedLesson} courseSlug={courseSlug} />
    ) : (
      <LessonEditor
        key={selectedLesson.id}
        lesson={selectedLesson}
        courseId={courseId}
        courseTitle={courseTitle}
        courseSlug={courseSlug}
        onUpdate={handleLessonUpdate}
        onDirtyChange={setLessonIsDirty}
        isReadOnly={isReadOnly}
      />
    )
  ) : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 min-[1028px]:h-[calc(100vh-230px)] min-[1028px]:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] min-[1028px]:items-stretch">
        {/* Left: module/lesson tree */}
        <div className="relative flex min-h-0 flex-col gap-3 min-[1028px]:overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-navy">
                {realModules.length} module{realModules.length !== 1 ? 's' : ''} · {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
              </span>
              {!isReadOnly && structureSaveStatus !== 'idle' && (
                <span className={`text-xs font-medium ${
                  structureSaveStatus === 'saving' ? 'text-primary' :
                  structureSaveStatus === 'saved' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {structureSaveStatus === 'saving' ? 'Saving structure...' :
                    structureSaveStatus === 'saved' ? 'Structure saved' : 'Structure save failed'}
                </span>
              )}
            </div>
          </div>

          <div className="custom-scrollbar flex min-h-0 flex-col gap-3 min-[1028px]:flex-1 min-[1028px]:overflow-y-auto min-[1028px]:pr-2">
            {modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-2xl border border-stroke px-6 text-center">
                <div>
                  <p className="font-bold text-navy">Start building your course</p>
                  <p className="mt-1 text-text-mute text-sm font-medium">
                    Add a lesson for a short course, or create a module for a structured curriculum.
                  </p>
                </div>
                {!isReadOnly && (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      rounded="lg"
                      leftIcon={<Plus size={13} />}
                      onClick={handleAddStandaloneLesson}
                    >
                      Add first lesson
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      rounded="lg"
                      leftIcon={<Plus size={13} />}
                      onClick={handleAddModule}
                    >
                      Create module
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  {modules.map((mod) => (
                    <SortableModule
                      key={mod.id}
                      mod={mod}
                      courseId={courseId}
                      selectedId={selectedLesson?.id ?? null}
                      isReadOnly={isReadOnly}
                      onSelectLesson={(l) => selectLesson(l, mod.id)}
                      onLessonDelete={handleLessonDelete}
                      onModuleRename={handleModuleRename}
                      onModuleDelete={handleModuleDelete}
                      onAddLesson={handleAddLesson}
                      onModulePublishToggle={handleModulePublishToggle}
                      onLessonPublishToggle={handleLessonPublishToggle}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {!isReadOnly && modules.length > 0 && (
            <div className="sticky bottom-4 z-20 mt-2 rounded-2xl border border-[#C8D7FF] bg-white/95 p-2 shadow-[0_18px_45px_rgba(4,11,55,0.14)] backdrop-blur md:bottom-6 min-[1028px]:static min-[1028px]:mt-0">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  rounded="lg"
                  leftIcon={<Plus size={13} />}
                  onClick={handleAddStandaloneLesson}
                  loading={adding}
                >
                  Add Lesson
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  rounded="lg"
                  leftIcon={<Plus size={13} />}
                  onClick={handleAddModule}
                  loading={adding}
                >
                  Add Module
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: editor panel / admin read-only preview */}
        <div ref={editorPanelRef} className="custom-scrollbar hidden min-h-0 min-[1028px]:block min-[1028px]:h-full min-[1028px]:overflow-y-auto min-[1028px]:pr-2">
          {isAdmin ? (
            selectedLesson ? (
              lessonDetailContent
            ) : (
            <div className="bg-white rounded-2xl border border-stroke flex flex-col items-center justify-center py-24 gap-3 text-center px-8">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                <Video size={20} className="text-text-mute" />
              </div>
              <p className="font-semibold text-navy">Select a lesson to review</p>
              <p className="text-sm text-text-mute max-w-xs">
                Admins see the final learner-facing output here without editing instructor content.
              </p>
            </div>
            )
          ) : selectedLesson ? (
            lessonDetailContent
          ) : (
            <div className="bg-white rounded-2xl border border-stroke flex flex-col items-center justify-center py-24 gap-3 text-center px-8">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                <Video size={20} className="text-text-mute" />
              </div>
              <p className="font-semibold text-navy">Select a lesson to edit</p>
              <p className="text-sm text-text-mute max-w-xs">
                Click any lesson in the outline to edit its title, video URL, transcript, and more.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedLesson && shouldRenderLessonDetail && (
        <div
          className={`fixed inset-0 z-[95] flex transform-gpu flex-col bg-background font-jakarta shadow-[-18px_0_50px_rgba(4,11,55,0.18)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] min-[1028px]:hidden ${
            isLessonDetailOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        >
          <header className="sticky top-0 z-10 border-b border-stroke bg-white px-4 py-3 shadow-[0_10px_28px_rgba(4,11,55,0.06)]">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={closeLessonDetail}
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E3E8F4] text-[#4B5563] transition hover:border-primary hover:text-primary"
                aria-label="Back to curriculum outline"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-primary">
                  {isAdmin ? 'Review lesson' : 'Edit lesson'}
                </p>
                <h2 className="mt-1 break-words text-[17px] font-black leading-tight text-navy">
                  {selectedLesson.title}
                </h2>
                {selectedModule && (
                  <p className="mt-1 break-words text-xs font-semibold text-text-mute">
                    {selectedModule.isDefault ? 'Lessons' : selectedModule.title}
                  </p>
                )}
              </div>
              {!selectedLesson.id.startsWith('draft-') && !selectedLesson.id.startsWith('temp-') && (
                <Link
                  href={`/courses/${courseSlug}/watch/${selectedLesson.id}?preview=true`}
                  target="_blank"
                  className="mt-0.5 hidden h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E3E8F4] bg-white px-3 text-[12px] font-black text-[#040B37] sm:inline-flex"
                >
                  <ExternalLink size={14} /> Preview
                </Link>
              )}
            </div>
          </header>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(96px+env(safe-area-inset-bottom))]">
            {lessonDetailContent}
          </div>
        </div>
      )}

      {confirmState && (
        <ConfirmModal {...confirmState} onCancel={closeConfirm} />
      )}
    </>
  );
}
