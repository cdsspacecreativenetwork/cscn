'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Plus, Eye, Trash2, Pencil, BookOpen, Users } from 'lucide-react';
import { createCourseAction, deleteCourseAction } from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';

type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_REVIEW';
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: CourseStatus;
  difficulty: Difficulty;
  category: string | null;
  enrollments: number;
  lessons: number;
  updatedAt: string;
  isOwner: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  courses: InstructorCourse[];
  categories: Category[];
  studioPath?: string; // defaults to /dashboard/instructor/courses
}

const STATUS_CONFIG: Record<CourseStatus, { label: string; classes: string }> = {
  DRAFT:          { label: 'Draft',     classes: 'bg-gray-100 text-gray-600' },
  PUBLISHED:      { label: 'Published', classes: 'bg-green-100 text-green-700' },
  PENDING_REVIEW: { label: 'In Review', classes: 'bg-amber-100 text-amber-700' },
  ARCHIVED:       { label: 'Archived',  classes: 'bg-red-100 text-red-600' },
};

const DIFF_LABEL: Record<Difficulty, string> = {
  BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced',
};

export default function InstructorCourseList({ courses, categories, studioPath = '/dashboard/instructor/courses' }: Props) {
  const router = useRouter();
  const [creating, startCreate] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filter, setFilter] = useState<CourseStatus | 'ALL'>('ALL');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  const filtered = filter === 'ALL' ? courses : courses.filter((c) => c.status === filter);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    startCreate(async () => {
      try {
        const result = await createCourseAction({
          title: newTitle.trim(),
          categoryId: newCategory || undefined,
        });
        toast.success('Course created!');
        setShowModal(false);
        setCategoryOpen(false);
        setNewTitle('');
        setNewCategory('');
        router.push(`${studioPath}/${result.courseId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create course.');
      }
    });
  };

  const handleDeleteConfirmed = () => {
    if (!confirmDelete) return;
    const { id: courseId } = confirmDelete;
    setConfirmDelete(null);
    startDelete(async () => {
      try {
        await deleteCourseAction(courseId);
        toast.success('Course deleted.');
        router.refresh();
      } catch {
        toast.error('Failed to delete course.');
      }
    });
  };

  const tabs: { id: CourseStatus | 'ALL'; label: string }[] = [
    { id: 'ALL',           label: 'All' },
    { id: 'PUBLISHED',     label: 'Published' },
    { id: 'DRAFT',         label: 'Draft' },
    { id: 'PENDING_REVIEW', label: 'In Review' },
    { id: 'ARCHIVED',      label: 'Archived' },
  ];

  return (
    <>
      <ConfirmModal
        open={!!confirmDelete}
        title="Delete course"
        message={`Delete "${confirmDelete?.title}"? All modules, lessons, and enrollments will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] lg:text-[28px] font-bold text-navy tracking-tight">
            My Courses
          </h1>
          <p className="text-sm font-medium text-text-mute">
            {courses.length} course{courses.length !== 1 ? 's' : ''} in your catalog
          </p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          rounded="[10px]"
          hasBorder={false}
          leftIcon={<Plus size={15} />}
          onClick={() => setShowModal(true)}
        >
          New Course
        </Button>
      </div>

      {/* Filter tabs — Figma pill style */}
      <div className="flex items-center gap-[4px] bg-[#E3E8F4] p-[4px] rounded-[12px] w-fit overflow-x-auto">
        {tabs.map((tab) => {
          const count = tab.id === 'ALL' ? courses.length : courses.filter((c) => c.status === tab.id).length;
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-[12px] py-[8px] rounded-[8px] font-jakarta font-medium text-[14px] tracking-[-0.28px] transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-navy drop-shadow-[0px_4px_2px_rgba(0,0,0,0.12)]'
                  : 'text-[#9CA3AF] hover:text-text-body'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Course list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center">
            <BookOpen size={28} className="text-text-mute" />
          </div>
          <p className="text-text-mute font-medium">No courses here yet.</p>
          <Button
            variant="gradient"
            size="sm"
            rounded="[10px]"
            hasBorder={false}
            onClick={() => setShowModal(true)}
          >
            Create your first course
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((course) => {
            const status = STATUS_CONFIG[course.status];
            return (
              <Link
                key={course.id}
                href={`${studioPath}/${course.id}`}
                className="bg-white border border-stroke rounded-2xl p-4 flex items-center gap-5 hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative w-[120px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-background">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <BookOpen size={24} className="text-primary/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${status.classes}`}>
                      {status.label}
                    </span>
                    {course.category && (
                      <span className="text-[11px] text-text-mute font-medium">{course.category}</span>
                    )}
                    <span className="text-[11px] text-text-mute font-medium">· {DIFF_LABEL[course.difficulty]}</span>
                  </div>
                  <h3 className="font-semibold text-navy text-[15px] truncate group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="flex items-center gap-1 text-[12px] text-text-mute">
                      <BookOpen size={12} /> {course.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-text-mute">
                      <Users size={12} /> {course.enrollments} enrolled
                    </span>
                    <span className="text-[12px] text-text-mute">
                      Updated {new Date(course.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
                  <Link
                    href={`${studioPath}/${course.id}`}
                    className="p-2 text-text-mute hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                    title="Edit course"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil size={15} />
                  </Link>
                  <Link
                    href={`/courses/${course.slug}?preview=true`}
                    target="_blank"
                    className="p-2 text-text-mute hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                    title="Preview"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye size={15} />
                  </Link>
                  {course.isOwner && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete({ id: course.id, title: course.title }); }}
                      disabled={deleting}
                      className="p-2 text-text-mute hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                      title="Delete course"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Course Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#040B37]/45 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col gap-5 rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(4,11,55,0.22)] md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">Create New Course</h2>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-text-mute transition-colors hover:bg-background hover:text-navy"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-navy">Course Title *</label>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Machine Learning A-Z"
                  className="w-full px-4 py-3 border border-stroke rounded-xl text-sm font-medium text-navy placeholder:text-text-mute focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="relative flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-navy">Category</label>
                <button
                  type="button"
                  onClick={() => setCategoryOpen((open) => !open)}
                  className={`flex py-3 w-full items-center justify-between rounded-[10px] border bg-white px-4 text-left text-sm font-medium transition-all ${
                    categoryOpen
                      ? 'border-primary ring-4 ring-primary/10'
                      : 'border-stroke hover:border-primary/40'
                  }`}
                >
                  <span className={newCategory ? 'text-navy' : 'text-text-mute'}>
                    {categories.find((category) => category.id === newCategory)?.name ?? 'Select a category'}
                  </span>
                  <ChevronDown
                    size={17}
                    className={`text-text-mute transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {categoryOpen && (
                  <div className="absolute left-0 right-0 top-[74px] z-[130] overflow-hidden rounded-[14px] border border-stroke bg-white shadow-[0_18px_50px_rgba(4,11,55,0.16)]">
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategory('');
                        setCategoryOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-navy transition-colors hover:bg-[#F8FAFF]"
                    >
                      Select a category
                      {!newCategory && <Check size={16} className="text-primary" />}
                    </button>
                    <div className="max-h-[260px] overflow-y-auto py-1">
                      {categories.map((category) => {
                        const active = newCategory === category.id;
                        return (
                          <button
                            type="button"
                            key={category.id}
                            onClick={() => {
                              setNewCategory(category.id);
                              setCategoryOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors ${
                              active
                                ? 'bg-[#EEF3FF] text-primary'
                                : 'text-navy hover:bg-[#F8FAFF]'
                            }`}
                          >
                            {category.name}
                            {active && <Check size={16} className="text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                rounded="[10px]"
                hasBorder={false}
                className="flex-1"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                rounded="[10px]"
                hasBorder={false}
                className="flex-1"
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                loading={creating}
              >
                Create & Edit
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
