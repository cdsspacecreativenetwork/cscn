import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Camera, ImageIcon, CheckCircle2, XCircle, Clock3, ClipboardPaste } from 'lucide-react';
import { updateCourseSettingsAction, uploadThumbnailAction, getAvailableExamsAction } from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';

type Difficulty = 'ALL_LEVELS' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type CourseType = 'SHORT_COURSE' | 'FULL_COURSE' | 'PROFESSIONAL_CERTIFICATE';

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
    promoVideo?: string | null;
    difficulty: string; courseType?: string; categoryId: string | null;
    previewCount: number; requirements: unknown; includes: unknown;
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
  };
  categories: { id: string; name: string }[];
  latestReview?: LatestReview | null;
  isLocked?: boolean;
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
  value, onChange, options, disabled = false, placeholder = 'Select option',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full"
      triggerClassName="h-[42px] rounded-xl border-stroke"
    />
  );
}

const THUMB_SPECS = ['16 : 9 ratio', '1280 × 720 px', 'JPG · PNG · WebP', 'Max 2 MB'];

const REVIEW_BANNER: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
  REJECTED: { icon: XCircle,      classes: 'bg-red-50 border-red-200 text-red-800',       label: 'Course rejected' },
  APPROVED: { icon: CheckCircle2, classes: 'bg-green-50 border-green-200 text-green-800', label: 'Course approved' },
};

const difficultyOptions = [
  { value: 'ALL_LEVELS', label: 'All levels' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const courseTypeOptions = [
  { value: 'SHORT_COURSE', label: 'Short course' },
  { value: 'FULL_COURSE', label: 'Full course' },
  { value: 'PROFESSIONAL_CERTIFICATE', label: 'Professional certificate' },
];

function parseBulkItems(value: string) {
  return value
    .split(/\r?\n|•|●|;/)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function BulkListInput({
  title,
  hint,
  label,
  placeholder,
  items,
  setItems,
  isLocked,
}: {
  title?: string;
  hint?: string;
  label: string;
  placeholder: string;
  items: string[];
  setItems: (items: string[]) => void;
  isLocked: boolean;
}) {
  const [bulkText, setBulkText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  const addBulkItems = () => {
    const parsed = parseBulkItems(bulkText);
    if (parsed.length === 0) {
      toast.error('Paste at least one item.');
      return;
    }
    setItems([...items.filter((item) => item.trim()), ...parsed]);
    setBulkText('');
    setShowPasteBox(false);
    toast.success(`${parsed.length} ${parsed.length === 1 ? 'item' : 'items'} added.`);
  };

  const addItem = () => setItems([...items, '']);
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    setItems(next);
  };
  const removeItem = (index: number) => setItems(items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div className="flex flex-col gap-4">
      {title && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-navy text-base">{title}</h2>
            {hint && <p className="text-sm text-text-mute mt-0.5">{hint}</p>}
          </div>
          {!isLocked && (
            <button
              type="button"
              onClick={() => setShowPasteBox(true)}
              className="inline-flex w-fit items-center gap-1.5 rounded-[10px] border border-[#C8D7FF] bg-[#1C4ED1]/5 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-primary transition-colors hover:bg-[#1C4ED1]/10"
            >
              <ClipboardPaste size={14} />
              Paste items
            </button>
          )}
        </div>
      )}

      {!title && !isLocked && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowPasteBox(true)}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#C8D7FF] bg-[#1C4ED1]/5 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-primary transition-colors hover:bg-[#1C4ED1]/10"
          >
            <ClipboardPaste size={14} />
            Paste items
          </button>
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            value={item}
            onChange={(event) => updateItem(index, event.target.value)}
            disabled={isLocked}
            placeholder={placeholder}
            className={`${inputCls} flex-1`}
          />
          {!isLocked && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="p-2 text-text-mute hover:text-red-500 transition-colors shrink-0 rounded-lg hover:bg-red-50"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}

      {!isLocked && showPasteBox && (
        <div className="rounded-[14px] border border-dashed border-[#C8D7FF] bg-[#F8FAFF] p-3">
          <label className="text-xs font-black uppercase tracking-[0.12em] text-primary">
            Paste multiple {label.toLowerCase()}
          </label>
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={3}
            className={`${inputCls} mt-2 resize-y bg-white`}
            placeholder={`Paste one ${label.toLowerCase()} per line, or separate with bullets/semicolons.`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addBulkItems}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#1C4ED1] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173FA8]"
            >
              <ClipboardPaste size={14} />
              Add pasted items
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkText('');
                setShowPasteBox(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-stroke bg-white px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-[#1C4ED1]/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isLocked && (
        <button
          type="button"
          onClick={addItem}
          className="inline-flex w-fit items-center gap-1.5 rounded-[10px] border border-stroke bg-white px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-[#1C4ED1]/5"
        >
          <Plus size={14} />
          Add one manually
        </button>
      )}
    </div>
  );
}

export default function CourseSettingsForm({ course, categories, latestReview, isLocked = false }: Props) {
  const [saving, startSave] = useTransition();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const latestPricingProposal = course.pricingProposals?.[0] ?? null;
  const pendingPricingProposal =
    latestPricingProposal?.status === 'PENDING' ? latestPricingProposal : null;
  const displayPrice = pendingPricingProposal?.proposedPrice ?? course.price;

  const [title, setTitle] = useState(course.title);
  const [shortDesc, setShortDesc] = useState(course.shortDesc ?? '');
  const [description, setDescription] = useState(course.description);
  const [difficulty, setDifficulty] = useState<Difficulty>(course.difficulty as Difficulty);
  const [courseType, setCourseType] = useState<CourseType>((course.courseType ?? 'FULL_COURSE') as CourseType);
  const [categoryId, setCategoryId] = useState(course.categoryId ?? '');
  const [previewCount, setPreviewCount] = useState(course.previewCount);
  const [thumbnail, setThumbnail] = useState(course.thumbnail ?? '');
  const [promoVideo, setPromoVideo] = useState(course.promoVideo ?? '');
  const [requirements, setRequirements] = useState<string[]>(toStringArray(course.requirements));
  const [includes, setIncludes] = useState<string[]>(toStringArray(course.includes));

  const [certificateEnabled, setCertificateEnabled] = useState(course.certificateEnabled ?? false);
  const [examGated, setExamGated] = useState(course.examGated ?? false);
  const [metaTitle, setMetaTitle] = useState(course.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(course.metaDescription ?? '');
  const [price, setPrice] = useState<string>(displayPrice ? String(displayPrice) : '');
  const [finalExamId, setFinalExamId] = useState(course.finalExamId ?? '');
  const [availableExams, setAvailableExams] = useState<{ id: string; title: string; duration: number }[]>([]);
  const isProfessionalCertificate = courseType === 'PROFESSIONAL_CERTIFICATE';

  useEffect(() => {
    getAvailableExamsAction()
      .then((data) => setAvailableExams(data))
      .catch(() => {});
  }, []);

  const handleSave = () => {
    startSave(async () => {
      try {
        const shouldSaveCertificate = courseType === 'PROFESSIONAL_CERTIFICATE';
        const result = await updateCourseSettingsAction(course.id, {
          title, shortDesc: shortDesc || undefined, description,
          difficulty, courseType, categoryId: categoryId || null,
          previewCount, requirements, includes,
          certificateEnabled: shouldSaveCertificate ? certificateEnabled : false,
          examGated: shouldSaveCertificate ? examGated : false,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          promoVideo: promoVideo.trim() || null,
          price: price ? parseFloat(price) : null,
          finalExamId: shouldSaveCertificate && finalExamId ? finalExamId : null,
        });
        toast.success(
          result?.pricingProposalSubmitted
            ? 'Settings saved. Pricing is pending admin approval.'
            : 'Settings saved.'
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save settings.');
      }
    });
  };

  const handleCourseTypeChange = (value: string) => {
    const nextCourseType = value as CourseType;
    setCourseType(nextCourseType);
    if (nextCourseType !== 'PROFESSIONAL_CERTIFICATE') {
      setCertificateEnabled(false);
      setExamGated(false);
      setFinalExamId('');
    }
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

  const reviewBanner = latestReview ? REVIEW_BANNER[latestReview.status] : null;
  const proposalCurrency = String(
    latestPricingProposal?.currency ?? course.baseCurrency ?? course.instructor?.payoutDetails?.preferredCurrency ?? 'NGN'
  ).toUpperCase();
  const proposedPriceLabel =
    latestPricingProposal?.proposedPrice
      ? `${proposalCurrency} ${Number(latestPricingProposal.proposedPrice).toLocaleString()}`
      : 'Free';

  return (
    <div className="flex flex-col gap-6">
      {/* Review status banner — REJECTED and APPROVED only */}
      {reviewBanner && latestReview?.comment && (
        <div className={`flex items-start gap-3 p-4 border rounded-xl ${reviewBanner.classes}`}>
          <reviewBanner.icon size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{reviewBanner.label}</p>
            <p className="text-sm mt-0.5">{latestReview.comment}</p>
            <p className="text-xs mt-1 opacity-70">
              by {latestReview.reviewer.name ?? 'Admin'} · {new Date(latestReview.createdAt).toLocaleDateString()}
            </p>
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
              disabled={isLocked}
              className={inputCls} placeholder="Course title" />
          </Field>

          <Field label={`Short Description (${shortDesc.length}/160)`}>
            <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, 160))}
              disabled={isLocked}
              rows={2} className={`${inputCls} resize-none`}
              placeholder="One-line pitch shown on course cards" />
          </Field>

          <Field label="Full Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              disabled={isLocked}
              rows={5} className={`${inputCls} resize-y`}
              placeholder="Detailed course description" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <SelectField
                value={categoryId}
                onChange={setCategoryId}
                disabled={isLocked}
                placeholder="Uncategorized"
                options={[
                  { value: '', label: 'Uncategorized' },
                  ...categories.map((category) => ({ value: category.id, label: category.name })),
                ]}
              />
            </Field>
            <Field label="Difficulty">
              <SelectField
                value={difficulty}
                onChange={(v) => setDifficulty(v as Difficulty)}
                disabled={isLocked}
                options={difficultyOptions}
              />
            </Field>
          </div>

          <Field label="Course Type" hint="Tell learners what kind of commitment and outcome this course offers.">
            <SelectField
              value={courseType}
              onChange={handleCourseTypeChange}
              disabled={isLocked}
              options={courseTypeOptions}
            />
          </Field>

          <Field label="Free Preview Lessons" hint="How many lessons non-enrolled users can watch">
            <input type="number" min={0} max={50} value={previewCount}
              onChange={(e) => setPreviewCount(Number(e.target.value))}
              disabled={isLocked}
              className={`${inputCls} w-28`} />
          </Field>

          <Field label="Course Trailer" hint="Paste a YouTube, Vimeo, or hosted trailer URL. Use this for your public course preview video.">
            <input
              value={promoVideo}
              onChange={(e) => setPromoVideo(e.target.value)}
              disabled={isLocked}
              className={inputCls}
              placeholder="https://youtube.com/watch?v=..."
            />
          </Field>
        </div>

        {/* Course Pricing */}
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-navy text-base">Course Pricing</h2>
            <p className="text-sm text-text-mute mt-0.5">Set the price learners should see after admin approval.</p>
          </div>
          <div className="grid gap-3">
            {latestPricingProposal && (
              <div className={`rounded-[8px] border p-3 ${
                latestPricingProposal.status === 'PENDING'
                  ? 'border-amber-200 bg-amber-50'
                  : latestPricingProposal.status === 'APPROVED'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
              }`}>
                <div className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide ${
                  latestPricingProposal.status === 'PENDING'
                    ? 'text-amber-700'
                    : latestPricingProposal.status === 'APPROVED'
                      ? 'text-emerald-700'
                      : 'text-red-700'
                }`}>
                  {latestPricingProposal.status === 'PENDING' ? <Clock3 size={14} /> : <CheckCircle2 size={14} />}
                  {latestPricingProposal.status === 'PENDING'
                    ? 'Pending approval'
                    : latestPricingProposal.status === 'APPROVED'
                      ? 'Last approved'
                      : 'Rejected proposal'}
                </div>
                <p className="mt-2 text-[20px] font-bold text-navy">{proposedPriceLabel}</p>
                {latestPricingProposal.adminNote && (
                  <p className="mt-1 text-xs font-medium text-red-700">{latestPricingProposal.adminNote}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 bg-[#F4F6FB] p-1 rounded-full w-fit">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setPrice('')}
              className={`px-5 py-2 rounded-full cursor-pointer text-sm font-semibold transition-all ${
                price === ''
                  ? 'bg-[#1C4ED1] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-navy'
              }`}
            >
              Free Course
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setPrice('4999.00')}
              className={`px-5 py-2 rounded-full cursor-pointer text-sm font-semibold transition-all ${
                price !== ''
                  ? 'bg-[#1C4ED1] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-navy'
              }`}
            >
              Paid Course
            </button>
          </div>

          {price !== '' && (
            <Field label="Proposed Price" hint="Changing this creates a pricing proposal for admin approval.">
              <div className="flex w-full max-w-[360px] overflow-hidden rounded-[8px] border border-stroke bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <span className="flex min-w-[72px] items-center justify-center border-r border-stroke bg-[#F8FAFF] px-4 text-sm font-bold text-[#1C4ED1] select-none">
                  {proposalCurrency}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isLocked}
                  className="min-w-0 flex-1 border-0 bg-white px-4 py-2.5 text-sm font-medium text-navy placeholder:text-text-mute focus:outline-none disabled:bg-[#F4F6FB] disabled:text-[#9CA3AF]"
                  placeholder="0.00"
                />
              </div>
            </Field>
          )}
        </div>

        {/* Certificate & Assessments */}
        {isProfessionalCertificate && (
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-navy text-base">Certificate & Assessments</h2>
            <p className="text-sm text-text-mute mt-0.5">Reward completion and verify learner skills.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={certificateEnabled}
              onChange={(e) => {
                setCertificateEnabled(e.target.checked);
                if (!e.target.checked) setExamGated(false);
              }}
              disabled={isLocked}
              className="mt-1 w-4 h-4 rounded border-stroke text-primary focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-navy group-hover:text-primary transition-colors">Award certificate on completion</span>
              <span className="text-xs text-text-mute">Generate a verification credential automatically when a student finishes the course requirements.</span>
            </div>
          </label>

          {certificateEnabled && (
            <div className="pl-7 flex flex-col gap-4 border-l border-stroke">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={examGated}
                  onChange={(e) => setExamGated(e.target.checked)}
                  disabled={isLocked}
                  className="mt-1 w-4 h-4 rounded border-stroke text-primary focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-navy group-hover:text-primary transition-colors">Gated by Final Certification Exam</span>
                  <span className="text-xs text-text-mute">Students must achieve passing marks on an exam to qualify for certification.</span>
                </div>
              </label>

              {examGated && (
                <Field label="Link Graded Exam" hint="Choose the assessment student must pass.">
                  {availableExams.length > 0 ? (
                    <SelectField
                      value={finalExamId}
                      onChange={setFinalExamId}
                      disabled={isLocked}
                      placeholder="Select exam"
                      options={[
                        { value: '', label: 'Select exam' },
                        ...availableExams.map((exam) => ({
                          value: exam.id,
                          label: `${exam.title} (${exam.duration} min)`,
                        })),
                      ]}
                    />
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      No exams available. Certification exams are created by Admins/Owners.
                    </div>
                  )}
                </Field>
              )}
            </div>
          )}
        </div>
        )}

        {/* Search Engine Optimization */}
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-navy text-base">Search Engine Optimization (SEO)</h2>
            <p className="text-sm text-text-mute mt-0.5">Improve how your course page ranks on search engines.</p>
          </div>

          <Field label={`Meta Title (${metaTitle.length}/60)`} hint="Clear title shown in search engine results.">
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value.slice(0, 60))}
              disabled={isLocked}
              placeholder="e.g. Master React and TypeScript from Scratch"
              className={inputCls}
            />
          </Field>

          <Field label={`Meta Description (${metaDescription.length}/160)`} hint="Summary shown in search engine results snippets.">
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
              disabled={isLocked}
              rows={3}
              placeholder="e.g. Learn components, hooks, routing, state management, and deployment with real-world projects and quizzes."
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-4">
          <BulkListInput
            title="Requirements"
            hint="What students need before starting this course."
            label="requirements"
            placeholder="e.g. Basic JavaScript knowledge"
            items={requirements}
            setItems={setRequirements}
            isLocked={isLocked}
          />
        </div>

        {/* What's included */}
        <div className="bg-white rounded-2xl border border-stroke p-6 flex flex-col gap-4">
          <BulkListInput
            title="What&apos;s Included"
            hint="What students get (certificate, hours of video, etc.)."
            label="included items"
            placeholder="e.g. 10 hours on-demand video"
            items={includes}
            setItems={setIncludes}
            isLocked={isLocked}
          />
        </div>

        {!isLocked && (
          <Button variant="primary" size="md" rounded="xl" className="w-fit" onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
        )}
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
            onClick={() => !uploading && !isLocked && fileRef.current?.click()}
            onDragOver={isLocked ? undefined : handleDragOver}
            onDragLeave={isLocked ? undefined : handleDragLeave}
            onDrop={isLocked ? undefined : handleDrop}
            className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-[#F4F6FB] border-2 border-dashed select-none transition-colors ${
              isLocked ? 'border-stroke cursor-default' :
              isDragOver ? 'border-primary bg-primary/5 cursor-pointer' : 'border-stroke group cursor-pointer'
            }`}
          >
            {thumbnail ? (
              <>
                <Image src={thumbnail} alt="Course thumbnail" fill className="object-cover" unoptimized />

                {!isLocked && (
                  <>
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
                )}
              </>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-transform duration-200 ${isDragOver && !isLocked ? 'scale-105' : 'group-hover:scale-[1.02]'}`}>
                <div className={`w-14 h-14 rounded-2xl bg-white border flex items-center justify-center shadow-sm transition-colors ${isDragOver && !isLocked ? 'border-primary' : 'border-stroke'}`}>
                  <ImageIcon size={24} className={`transition-colors ${isDragOver && !isLocked ? 'text-primary' : 'text-text-mute group-hover:text-primary'}`} />
                </div>
                <div className="text-center px-4">
                  <p className={`text-sm font-semibold transition-colors ${isDragOver && !isLocked ? 'text-primary' : 'text-navy group-hover:text-primary'}`}>
                    {isLocked ? 'No thumbnail uploaded' : isDragOver ? 'Drop to upload' : 'Click or drag & drop'}
                  </p>
                  {!isLocked && <p className="text-xs text-text-mute mt-0.5">JPG, PNG or WebP up to 2 MB</p>}
                </div>
                {!isDragOver && !isLocked && (
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
            disabled={isLocked}
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
