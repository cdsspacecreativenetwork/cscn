'use client';

import { useState, useTransition } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, ChevronDown, ChevronRight,
  Video, Lock, Eye, Trash2, Pencil, X, AlertTriangle, BadgeCheck, BadgeX,
} from 'lucide-react';
import {
  createModuleAction, updateModuleAction, deleteModuleAction, reorderModulesAction,
  createLessonAction, reorderLessonsAction, deleteLessonAction, moveAndReorderLessonsAction,
  updateLessonPublishStateAction, updateModulePublishStateAction,
} from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import LessonEditor from './LessonEditor';
import type { LessonQuiz } from './QuizLessonBuilder';
import { LessonTypeIcon } from '@/components/dashboard/courses/LessonTypeIcon';

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
interface Module { id: string; title: string; position: number; isPublished: boolean; lessons: Lesson[] }

interface Props { courseId: string; courseTitle: string; courseSlug: string; initialModules: Module[]; isAdmin?: boolean; isLocked?: boolean }

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
      className={`flex items-center gap-2 px-3 py-2.5 ml-6 rounded-xl border transition-all ${
        isDragging ? 'opacity-50 bg-white shadow-lg z-50' :
        isSelected && !isReadOnly ? 'bg-primary/5 border-primary/30' :
        isReadOnly ? 'bg-white border-transparent' :
        'bg-white border-transparent hover:border-stroke hover:bg-background/60 cursor-pointer'
      }`}
      onClick={isReadOnly ? undefined : onSelect}
    >
      {!isReadOnly && (
        <button
          {...attributes} {...listeners}
          className="text-text-mute/40 hover:text-text-mute cursor-grab active:cursor-grabbing p-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      )}
      <LessonTypeIcon contentType={lesson.contentType} size="xs" />
      <span className={`flex-1 text-sm font-medium truncate ${isSelected && !isReadOnly ? 'text-primary' : 'text-navy'}`}>
        {lesson.title}
      </span>
      <div className="flex items-center gap-1 shrink-0">
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
            className={`p-1 transition-colors rounded ml-1 ${
              lesson.isPublished ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
            }`}
            title={lesson.isPublished ? 'Move lesson to draft' : 'Publish lesson'}
          >
            {lesson.isPublished ? <BadgeCheck size={12} /> : <BadgeX size={12} />}
          </button>
        )}
        {!isReadOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-text-mute hover:text-red-500 transition-colors rounded ml-1"
          >
            <Trash2 size={12} />
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
            className="text-text-mute/40 hover:text-text-mute cursor-grab active:cursor-grabbing p-0.5 shrink-0"
          >
            <GripVertical size={16} />
          </button>
        )}
        <button onClick={() => setOpen((o) => !o)} className="text-text-mute shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {editing && !isReadOnly ? (
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
            className="flex-1 text-sm font-semibold text-navy truncate cursor-text"
            onDoubleClick={() => !isReadOnly && setEditing(true)}
          >
            {mod.title}
          </span>
        )}

        <span className="text-[11px] text-text-mute shrink-0 ml-1">{mod.lessons.length} lessons</span>
        <span className={`hidden 2xl:inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
          mod.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {mod.isPublished ? 'Live' : 'Draft'}
        </span>
        {!isReadOnly && (
          <button
            onClick={() => onModulePublishToggle(mod.id, !mod.isPublished)}
            className={`p-1.5 rounded transition-colors shrink-0 ${
              mod.isPublished ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
            }`}
            title={mod.isPublished ? 'Move module to draft' : 'Publish module'}
          >
            {mod.isPublished ? <BadgeCheck size={13} /> : <BadgeX size={13} />}
          </button>
        )}
        {!isReadOnly && (
          <button onClick={() => setEditing(true)} className="p-1.5 text-text-mute hover:text-primary rounded transition-colors shrink-0">
            <Pencil size={13} />
          </button>
        )}
        {!isReadOnly && (
          <button onClick={() => onModuleDelete(mod.id)} className="p-1.5 text-text-mute hover:text-red-500 rounded transition-colors shrink-0">
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

// ── Main Builder ──────────────────────────────────────────────────────────────

export default function CurriculumBuilder({ courseId, courseTitle, courseSlug, initialModules, isAdmin = false, isLocked = false }: Props) {
  const isReadOnly = isAdmin || isLocked;
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonIsDirty, setLessonIsDirty] = useState(false);
  const [adding, startAdd] = useTransition();
  const [, startReorder] = useTransition();
  const [structureSaveStatus, setStructureSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const showConfirm = (state: ConfirmState) => setConfirmState(state);
  const closeConfirm = () => setConfirmState(null);

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
          closeConfirm();
        },
      });
    } else {
      setSelectedLesson(lesson);
      setSelectedModuleId(moduleId);
    }
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
    const newTitle = `Module ${modules.length + 1}`;
    const placeholder: Module = {
      id: tempId,
      title: newTitle,
      position: modules.length + 1,
      isPublished: false,
      lessons: [],
    };

    setModules((prev) => [...prev, placeholder]);

    createModuleAction(courseId, newTitle)
      .then((actualMod) => {
        setModules((prev) =>
          prev.map((m) => m.id === tempId ? { ...actualMod, lessons: [] } : m)
        );
      })
      .catch(() => {
        setModules((prev) => prev.filter((m) => m.id !== tempId));
        toast.error('Failed to add module.');
      });
  };

  const handleAddLesson = (moduleId: string) => {
    const tempId = `temp-les-${Date.now()}`;
    const newTitle = `Lesson ${(modules.find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1}`;
    const placeholder: Lesson = {
      id: tempId,
      title: newTitle,
      position: (modules.find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1,
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
    };

    setModules((prev) =>
      prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, placeholder] } : m)
    );
    setSelectedLesson(placeholder);
    setSelectedModuleId(moduleId);
    setLessonIsDirty(false);

    createLessonAction(moduleId, newTitle, courseId)
      .then((actualLesson) => {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lessons: m.lessons.map((l) => l.id === tempId ? actualLesson : l),
                }
              : m
          )
        );
        setSelectedLesson((current) => current?.id === tempId ? actualLesson : current);
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
    showConfirm({
      title: 'Delete Module',
      message: `"${mod?.title}" and all its lessons will be permanently deleted.`,
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

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">
        {/* Left: module/lesson tree */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-navy">
                {modules.length} modules · {totalLessons} lessons
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
            {!isReadOnly && (
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
            )}
          </div>

          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-stroke">
              <p className="text-text-mute text-sm font-medium">No modules yet.</p>
              {!isReadOnly && (
                <button onClick={handleAddModule} className="text-primary text-sm font-semibold hover:underline">
                  Add your first module →
                </button>
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

        {/* Right: editor panel — read-only placeholder for admin */}
        <div className="sticky top-[140px]">
          {isAdmin ? (
            <div className="bg-white rounded-2xl border border-stroke flex flex-col items-center justify-center py-24 gap-3 text-center px-8">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                <Video size={20} className="text-text-mute" />
              </div>
              <p className="font-semibold text-navy">Lesson content is read-only</p>
              <p className="text-sm text-text-mute max-w-xs">
                Admins can add and rename modules. Use the Feedback tab to request lesson changes from the instructor.
              </p>
            </div>
          ) : selectedLesson ? (
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

      {confirmState && (
        <ConfirmModal {...confirmState} onCancel={closeConfirm} />
      )}
    </>
  );
}
