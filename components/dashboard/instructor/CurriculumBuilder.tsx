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
  Video, Lock, Eye, Trash2, Pencil, X, AlertTriangle,
} from 'lucide-react';
import {
  createModuleAction, updateModuleAction, deleteModuleAction, reorderModulesAction,
  createLessonAction, reorderLessonsAction, deleteLessonAction,
} from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import LessonEditor from './LessonEditor';

interface Lesson {
  id: string; title: string; position: number;
  videoUrl: string | null; duration: number | null;
  isPreview: boolean; transcript: string | null;
  contentType: string;
  resources: { id: string; title: string; url: string; type: string }[];
}
interface Module { id: string; title: string; position: number; lessons: Lesson[] }

interface Props { courseId: string; initialModules: Module[] }

// ── Confirm Modal ────────────────────────────────────────────────────────────

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
          <button
            onClick={onCancel}
            className="text-text-mute hover:text-navy transition-colors shrink-0 -mt-0.5"
          >
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
              destructive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Lesson Row ──────────────────────────────────────────────────────

function SortableLesson({
  lesson, isSelected,
  onSelect, onDelete,
}: {
  lesson: Lesson; isSelected: boolean; courseId: string; moduleId: string;
  onSelect: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 px-3 py-2.5 ml-6 rounded-xl border transition-all cursor-pointer ${
        isDragging ? 'opacity-50 bg-white shadow-lg z-50' :
        isSelected ? 'bg-primary/5 border-primary/30' : 'bg-white border-transparent hover:border-stroke hover:bg-background/60'
      }`}
      onClick={onSelect}
    >
      <button
        {...attributes} {...listeners}
        className="text-text-mute/40 hover:text-text-mute cursor-grab active:cursor-grabbing p-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </button>
      <Video size={13} className="text-text-mute shrink-0" />
      <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-navy'}`}>
        {lesson.title}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {lesson.isPreview
          ? <Eye size={12} className="text-primary/60" aria-label="Preview" />
          : <Lock size={12} className="text-text-mute/50" aria-label="Locked" />
        }
        {lesson.duration && <span className="text-[11px] text-text-mute">{lesson.duration}m</span>}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 text-text-mute hover:text-red-500 transition-colors rounded ml-1"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Sortable Module ──────────────────────────────────────────────────────────

function SortableModule({
  mod, courseId, selectedId, onSelectLesson, onLessonDelete,
  onModuleRename, onModuleDelete, onAddLesson,
}: {
  mod: Module; courseId: string; selectedId: string | null;
  onSelectLesson: (l: Lesson) => void;
  onLessonDelete: (lessonId: string, moduleId: string) => void;
  onModuleRename: (moduleId: string, title: string) => void;
  onModuleDelete: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(mod.title);
  const [, startReorder] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id });

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = mod.lessons.findIndex((l) => l.id === active.id);
    const newIdx = mod.lessons.findIndex((l) => l.id === over.id);
    arrayMove(mod.lessons, oldIdx, newIdx); // optimistic update handled by parent
    startReorder(async () => {
      try {
        await reorderLessonsAction(mod.id, courseId, arrayMove(mod.lessons, oldIdx, newIdx).map((l) => l.id));
      } catch { toast.error('Failed to reorder lessons.'); }
    });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col rounded-2xl border transition-all ${isDragging ? 'opacity-50 shadow-xl' : 'border-stroke bg-white'}`}
    >
      {/* Module header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          {...attributes} {...listeners}
          className="text-text-mute/40 hover:text-text-mute cursor-grab active:cursor-grabbing p-0.5 shrink-0"
        >
          <GripVertical size={16} />
        </button>
        <button onClick={() => setOpen((o) => !o)} className="text-text-mute shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {editing ? (
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
            onDoubleClick={() => setEditing(true)}
          >
            {mod.title}
          </span>
        )}

        <span className="text-[11px] text-text-mute shrink-0 ml-1">{mod.lessons.length} lessons</span>
        <button onClick={() => setEditing(true)} className="p-1.5 text-text-mute hover:text-primary rounded transition-colors shrink-0">
          <Pencil size={13} />
        </button>
        <button onClick={() => onModuleDelete(mod.id)} className="p-1.5 text-text-mute hover:text-red-500 rounded transition-colors shrink-0">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Lessons */}
      {open && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
            <SortableContext items={mod.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {mod.lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  isSelected={selectedId === lesson.id}
                  courseId={mod.id}
                  moduleId={mod.id}
                  onSelect={() => onSelectLesson(lesson)}
                  onDelete={() => onLessonDelete(lesson.id, mod.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            onClick={() => onAddLesson(mod.id)}
            className="ml-6 mt-1 flex items-center gap-1.5 text-xs text-primary font-medium hover:underline w-fit px-2 py-1"
          >
            <Plus size={13} /> Add lesson
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Builder ─────────────────────────────────────────────────────────────

export default function CurriculumBuilder({ courseId, initialModules }: Props) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonIsDirty, setLessonIsDirty] = useState(false);
  const [adding, startAdd] = useTransition();
  const [, startReorder] = useTransition();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const showConfirm = (state: ConfirmState) => setConfirmState(state);
  const closeConfirm = () => setConfirmState(null);

  // Intercept lesson selection — warn if the current lesson has unsaved changes
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

  const handleModuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIdx, newIdx);
    setModules(reordered);
    startReorder(async () => {
      try {
        await reorderModulesAction(courseId, reordered.map((m) => m.id));
      } catch { toast.error('Failed to reorder modules.'); }
    });
  };

  const handleAddModule = () => {
    startAdd(async () => {
      try {
        const mod = await createModuleAction(courseId, `Module ${modules.length + 1}`);
        setModules((prev) => [...prev, { ...mod, lessons: [] }]);
      } catch { toast.error('Failed to add module.'); }
    });
  };

  const handleAddLesson = (moduleId: string) => {
    startAdd(async () => {
      try {
        const lesson = await createLessonAction(
          moduleId,
          `Lesson ${(modules.find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1}`,
          courseId
        );
        setModules((prev) =>
          prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m)
        );
        setSelectedLesson(lesson);
        setSelectedModuleId(moduleId);
        setLessonIsDirty(false);
      } catch { toast.error('Failed to add lesson.'); }
    });
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
            <span className="text-sm font-semibold text-navy">
              {modules.length} modules · {totalLessons} lessons
            </span>
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

          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-stroke">
              <p className="text-text-mute text-sm font-medium">No modules yet.</p>
              <button onClick={handleAddModule} className="text-primary text-sm font-semibold hover:underline">
                Add your first module →
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
              <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                {modules.map((mod) => (
                  <SortableModule
                    key={mod.id}
                    mod={mod}
                    courseId={courseId}
                    selectedId={selectedLesson?.id ?? null}
                    onSelectLesson={(l) => selectLesson(l, mod.id)}
                    onLessonDelete={handleLessonDelete}
                    onModuleRename={handleModuleRename}
                    onModuleDelete={handleModuleDelete}
                    onAddLesson={handleAddLesson}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Right: editor panel */}
        <div className="sticky top-[140px]">
          {selectedLesson ? (
            // key forces a full remount when switching lessons, clearing all form state
            <LessonEditor
              key={selectedLesson.id}
              lesson={selectedLesson}
              courseId={courseId}
              onUpdate={handleLessonUpdate}
              onDirtyChange={setLessonIsDirty}
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

      {/* Confirm modal */}
      {confirmState && (
        <ConfirmModal
          {...confirmState}
          onCancel={closeConfirm}
        />
      )}
    </>
  );
}
