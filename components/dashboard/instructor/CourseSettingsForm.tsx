'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, ChevronDown, Camera, ImageIcon, AlertTriangle, CheckCircle2, XCircle, CheckCheck } from 'lucide-react';
import { updateCourseSettingsAction, uploadThumbnailAction, markFeedbackAddressedAction } from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';

type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface LatestReview {
  id: string;
  status: string;
  comment: string | null;
  addressedAt: Date | null;
  createdAt: Date;
  reviewer: { name: string | null; image: string | null };
}

interface Props {
  course: {
    id: string; title: string; shortDesc: string | null;
    description: string; thumbnail: string | null;
    difficulty: string; categoryId: string | null;
    previewCount: number; requirements: unknown; includes: unknown;
  };
  categories: { id: string; name: string }[];
  latestReview?: LatestReview | null;
}

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

const inputCls =
  'w-full px-4 py-2.5 border border-stroke rounded-xl text-sm font-medium text-navy placeholder:text-text-mute bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-navy">{label}</label>
      {hint && <p className="text-xs text-text-mute -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function SelectField({
  value, onChange, children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-10 cursor-pointer`}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mute pointer-events-none shrink-0"
      />
    </div>
  );
}

const THUMB_SPECS = ['16 : 9 ratio', '1280 × 720 px', 'JPG · PNG · WebP', 'Max 2 MB'];

const REVIEW_BANNER: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
  CHANGES_REQUESTED: { icon: AlertTriangle, classes: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Changes requested' },
  REJECTED:          { icon: XCircle,       classes: 'bg-red-50 border-red-200 text-red-800',       label: 'Course rejected' },
  APPROVED:          { icon: CheckCircle2,  classes: 'bg-green-50 border-green-200 text-green-800', label: 'Course approved' },
};

export default function CourseSettingsForm({ course, categories, latestReview }: Props) {
  const [saving, startSave] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [addressing, startAddress] = useTransition();
  const [addressed, setAddressed] = useState(!!latestReview?.addressedAt);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [title, setTitle] = useState(course.title);
  const [shortDesc, setShortDesc] = useState(course.shortDesc ?? '');
  const [description, setDescription] = useState(course.description);
  const [difficulty, setDifficulty] = useState<Difficulty>(course.difficulty as Difficulty);
  const [categoryId, setCategoryId] = useState(course.categoryId ?? '');
  const [previewCount, setPreviewCount] = useState(course.previewCount);
  const [thumbnail, setThumbnail] = useState(course.thumbnail ?? '');
  const [requirements, setRequirements] = useState<string[]>(toStringArray(course.requirements));
  const [includes, setIncludes] = useState<string[]>(toStringArray(course.includes));

  const handleSave = () => {
    startSave(async () => {
      try {
        await updateCourseSettingsAction(course.id, {
          title, shortDesc: shortDesc || undefined, description,
          difficulty, categoryId: categoryId || null,
          previewCount, requirements, includes,
        });
        toast.success('Settings saved.');
      } catch {
        toast.error('Failed to save settings.');
      }
    });
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB.'); return; }
    const fd = new FormData();
    fd.append('file', file);
    startUpload(async () => {
      try {
        const result = await uploadThumbnailAction(course.id, fd);
        if ('error' in result) { toast.error(result.error); return; }
        setThumbnail(result.url);
        toast.success('Thumbnail updated.');
      } catch {
        toast.error('Upload failed.');
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleRemoveThumbnail = () => {
    setThumbnail('');
    updateCourseSettingsAction(course.id, { thumbnail: '' }).catch(() =>
      toast.error('Failed to remove thumbnail.')
    );
  };

  const addItem    = (list: string[], set: (v: string[]) => void) => set([...list, '']);
  const updateItem = (list: string[], set: (v: string[]) => void, i: number, val: string) => {
    const next = [...list]; next[i] = val; set(next);
  };
  const removeItem = (list: string[], set: (v: string[]) => void, i: number) =>
    set(list.filter((_, idx) => idx !== i));

  const reviewBanner = latestReview ? REVIEW_BANNER[latestReview.status] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Review feedback banner */}
      {reviewBanner && latestReview?.comment && (
        <div className={`flex items-start gap-3 p-4 border rounded-xl ${reviewBanner.classes}`}>
          <reviewBanner.icon size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{reviewBanner.label}</p>
            <p className="text-sm mt-0.5">{latestReview.comment}</p>
            <p className="text-xs mt-1 opacity-70">
              by {latestReview.reviewer.name ?? 'Admin'} · {new Date(latestReview.createdAt).toLocaleDateString()}
            </p>
            {latestReview.status === 'CHANGES_REQUESTED' && (
              <div className="mt-3">
                {addressed ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <CheckCheck size={13} /> Marked as addressed
                  </span>
                ) : (
                  <button
                    disabled={addressing}
                    onClick={() => {
                      if (!latestReview?.id) return;
                      startAddress(async () => {
                        try {
                          await markFeedbackAddressedAction(latestReview.id, course.id);
                          setAddressed(true);
                          toast.success('Feedback marked as addressed. The admin will review your changes.');
                        } catch {
                          toast.error('Failed to mark as addressed.');
                        }
                      });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-current bg-white/60 hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {addressing ? 'Saving…' : <><CheckCheck size={13} /> I&apos;ve addressed this feedback</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 items-start">

      {/* ── Left: main fields ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">

        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-5">
          <h2 className="font-semibold text-navy text-base">Course Details</h2>

          <Field label="Title *">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className={inputCls} placeholder="Course title" />
          </Field>

          <Field label={`Short Description (${shortDesc.length}/160)`}>
            <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, 160))}
              rows={2} className={`${inputCls} resize-none`}
              placeholder="One-line pitch shown on course cards" />
          </Field>

          <Field label="Full Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={5} className={`${inputCls} resize-y`}
              placeholder="Detailed course description" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <SelectField value={categoryId} onChange={setCategoryId}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
            </Field>
            <Field label="Difficulty">
              <SelectField value={difficulty} onChange={(v) => setDifficulty(v as Difficulty)}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </SelectField>
            </Field>
          </div>

          <Field label="Free Preview Lessons" hint="How many lessons non-enrolled users can watch">
            <input type="number" min={0} max={50} value={previewCount}
              onChange={(e) => setPreviewCount(Number(e.target.value))}
              className={`${inputCls} w-28`} />
          </Field>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-navy text-base">Requirements</h2>
            <p className="text-sm text-text-mute mt-0.5">What students need before starting this course.</p>
          </div>
          {requirements.map((req, i) => (
            <div key={i} className="flex gap-2">
              <input value={req}
                onChange={(e) => updateItem(requirements, setRequirements, i, e.target.value)}
                placeholder="e.g. Basic JavaScript knowledge"
                className={`${inputCls} flex-1`} />
              <button onClick={() => removeItem(requirements, setRequirements, i)}
                className="p-2 text-text-mute hover:text-red-500 transition-colors shrink-0 rounded-lg hover:bg-red-50">
                <X size={16} />
              </button>
            </div>
          ))}
          <button onClick={() => addItem(requirements, setRequirements)}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline w-fit">
            <Plus size={14} /> Add requirement
          </button>
        </div>

        {/* What's included */}
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-navy text-base">What&apos;s Included</h2>
            <p className="text-sm text-text-mute mt-0.5">What students get (certificate, hours of video, etc.).</p>
          </div>
          {includes.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input value={item}
                onChange={(e) => updateItem(includes, setIncludes, i, e.target.value)}
                placeholder="e.g. 10 hours on-demand video"
                className={`${inputCls} flex-1`} />
              <button onClick={() => removeItem(includes, setIncludes, i)}
                className="p-2 text-text-mute hover:text-red-500 transition-colors shrink-0 rounded-lg hover:bg-red-50">
                <X size={16} />
              </button>
            </div>
          ))}
          <button onClick={() => addItem(includes, setIncludes)}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline w-fit">
            <Plus size={14} /> Add item
          </button>
        </div>

        <Button variant="primary" size="md" rounded="xl" className="w-fit" onClick={handleSave} loading={saving}>
          Save Settings
        </Button>
      </div>

      {/* ── Right: thumbnail ─────────────────────────────────────────────────── */}
      <div className="sticky top-[140px] flex flex-col gap-5">
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-4">

          <div>
            <h2 className="font-semibold text-navy text-base">Course Thumbnail</h2>
            <p className="text-xs text-text-mute mt-0.5">
              The first image students see — make it compelling.
            </p>
          </div>

          {/* Spec chips */}
          <div className="flex flex-wrap gap-1.5">
            {THUMB_SPECS.map((spec) => (
              <span key={spec}
                className="px-2.5 py-1 rounded-lg bg-[#F4F6FB] text-[11px] font-semibold text-text-mute tracking-wide">
                {spec}
              </span>
            ))}
          </div>

          {/* Upload zone — click OR drag & drop */}
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-[#F4F6FB] border-2 border-dashed group cursor-pointer select-none transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-stroke'
            }`}
          >
            {thumbnail ? (
              <>
                <Image src={thumbnail} alt="Course thumbnail" fill className="object-cover" unoptimized />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Camera size={18} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-semibold">Change thumbnail</span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveThumbnail(); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove thumbnail"
                >
                  <X size={12} className="text-white" />
                </button>
              </>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-transform duration-200 ${isDragOver ? 'scale-105' : 'group-hover:scale-[1.02]'}`}>
                <div className={`w-14 h-14 rounded-2xl bg-white border flex items-center justify-center shadow-sm transition-colors ${isDragOver ? 'border-primary' : 'border-stroke'}`}>
                  <ImageIcon size={24} className={`transition-colors ${isDragOver ? 'text-primary' : 'text-text-mute group-hover:text-primary'}`} />
                </div>
                <div className="text-center px-4">
                  <p className={`text-sm font-semibold transition-colors ${isDragOver ? 'text-primary' : 'text-navy group-hover:text-primary'}`}>
                    {isDragOver ? 'Drop to upload' : 'Click or drag & drop'}
                  </p>
                  <p className="text-xs text-text-mute mt-0.5">JPG, PNG or WebP up to 2 MB</p>
                </div>
                {!isDragOver && (
                  <span className="px-4 py-1.5 rounded-full border border-stroke bg-white text-xs font-semibold text-text-body shadow-sm group-hover:border-primary group-hover:text-primary transition-colors">
                    Browse files
                  </span>
                )}
              </div>
            )}

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
                <span className="text-sm font-semibold text-primary">Uploading…</span>
              </div>
            )}

            {/* Drag overlay hint */}
            {isDragOver && !uploading && (
              <div className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none" />
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />

          {thumbnail && !uploading && (
            <p className="text-xs text-text-mute text-center">
              Hover the image to change or remove it.
            </p>
          )}
        </div>
      </div>

    </div>
    </div>
  );
}
