'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { ExternalLink, FileQuestion, FileText, Loader2, Save, Video } from 'lucide-react';
import { updateLessonAction } from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import VideoUploader from './VideoUploader';
import ArticleLessonEditor from './ArticleLessonEditor';
import Link from 'next/link';

interface Resource { id: string; title: string; url: string; type: string }

interface Lesson {
  id: string; title: string; position: number; videoUrl: string | null;
  duration: number | null; isPreview: boolean;
  transcript: string | null; bodyContent: string | null; contentType: string;
  resources: Resource[];
  muxStatus: string;
  muxPlaybackId: string | null;
}

interface Props {
  lesson: Lesson;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  onUpdate: (updated: Lesson) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  isReadOnly?: boolean;
}

const inputCls =
  'w-full px-3 py-2.5 border border-stroke rounded-[8px] text-sm font-medium text-navy placeholder:text-text-mute bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const contentTypes = [
  { value: 'VIDEO', label: 'Video', icon: Video },
  { value: 'ARTICLE', label: 'Article', icon: FileText },
  { value: 'QUIZ', label: 'Quiz', icon: FileQuestion },
] as const;

function estimateArticleReadTime(html: string) {
  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plainText) return '';
  return String(Math.max(1, Math.ceil(plainText.split(/\s+/).length / 220)));
}

export default function LessonEditor({ lesson, courseId, courseTitle, courseSlug, onUpdate, onDirtyChange, isReadOnly = false }: Props) {
  const [saving, startSave] = useTransition();

  const [title, setTitle] = useState(lesson.title);
  const [duration, setDuration] = useState<string>(lesson.duration?.toString() ?? '');
  const [isPreview, setIsPreview] = useState(lesson.isPreview);
  const [transcript, setTranscript] = useState(lesson.transcript ?? '');
  const [bodyContent, setBodyContent] = useState(lesson.bodyContent ?? '');
  const [contentType, setContentType] = useState<'VIDEO' | 'ARTICLE' | 'QUIZ'>(
    lesson.contentType === 'ARTICLE' || lesson.contentType === 'QUIZ' ? lesson.contentType : 'VIDEO'
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const mountedRef = useRef(false);

  const draft = useMemo(() => ({
    title,
    duration: duration ? Number(duration) : null,
    isPreview,
    transcript: transcript.trim() || null,
    bodyContent: bodyContent.trim() || null,
    contentType,
  }), [title, duration, isPreview, transcript, bodyContent, contentType]);

  const isDirty =
    title !== lesson.title ||
    duration !== (lesson.duration?.toString() ?? '') ||
    isPreview !== lesson.isPreview ||
    transcript !== (lesson.transcript ?? '') ||
    bodyContent !== (lesson.bodyContent ?? '') ||
    contentType !== (lesson.contentType === 'ARTICLE' || lesson.contentType === 'QUIZ' ? lesson.contentType : 'VIDEO');

  const prevDirtyRef = useRef(false);
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      prevDirtyRef.current = isDirty;
      onDirtyChange?.(isDirty);
    }
    if (isDirty) setSaveStatus('dirty');
  }, [isDirty, onDirtyChange]);

  const saveDraft = (showToast = false) => {
    if (isReadOnly || !isDirty) return;
    setSaveStatus('saving');
    startSave(async () => {
      try {
        await updateLessonAction(lesson.id, courseId, draft);
        onUpdate({
          ...lesson,
          ...draft,
        });
        onDirtyChange?.(false);
        setSaveStatus('saved');
        if (showToast) toast.success('Lesson saved.');
      } catch {
        setSaveStatus('error');
        toast.error('Failed to save lesson.');
      }
    });
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!isDirty || isReadOnly) return;

    const id = window.setTimeout(() => saveDraft(false), 2000);
    return () => window.clearTimeout(id);
  }, [draft, isDirty, isReadOnly]);

  const handleSave = () => saveDraft(true);

  const saveStatusLabel =
    saveStatus === 'saving' || saving ? 'Saving...' :
    saveStatus === 'saved' ? 'Saved to cloud' :
    saveStatus === 'error' ? 'Save failed' :
    isDirty ? 'Unsaved changes' : 'Saved';

  const durationLabel =
    contentType === 'ARTICLE' ? 'Estimated Read Time' :
    contentType === 'QUIZ' ? 'Quiz Duration' :
    'Duration';

  const durationHint =
    contentType === 'ARTICLE' ? 'Calculated from the article body.' :
    contentType === 'QUIZ' ? 'Set the time learners should expect for this quiz.' :
    'Video duration should come from the uploaded video when available.';

  const handleContentTypeChange = (nextType: typeof contentType) => {
    setContentType(nextType);
    if (nextType === 'ARTICLE') {
      setDuration(estimateArticleReadTime(bodyContent));
    }
  };

  const handleArticleChange = (nextBody: string) => {
    setBodyContent(nextBody);
    setDuration(estimateArticleReadTime(nextBody));
  };

  return (
    <div className="bg-white rounded-[8px] border border-stroke flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-navy text-base">Edit Lesson</h2>
          {!isReadOnly && (
            <p className={`text-xs font-medium mt-0.5 ${
              saveStatus === 'error' ? 'text-red-500' :
              saveStatus === 'saved' && !isDirty ? 'text-green-600' :
              saveStatus === 'saving' || saving ? 'text-primary' :
              isDirty ? 'text-amber-500' : 'text-text-mute'
            }`}>
              {saveStatusLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/courses/${courseSlug}/watch/${lesson.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-stroke rounded-[8px] text-xs font-semibold text-navy hover:bg-background transition-colors shrink-0"
          >
            <ExternalLink size={13} />
            <span>Preview in Player</span>
          </Link>
          {!isReadOnly && (
            <Button
              variant="primary"
              size="sm"
              rounded="md"
              leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              onClick={handleSave}
              disabled={saving || !isDirty}
            >
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">Lesson Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isReadOnly}
          className={inputCls}
          placeholder="Lesson title"
        />
      </div>

      {/* Content type */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-navy">Lesson Type</label>
        <div className="grid grid-cols-3 gap-2 bg-[#F4F6FB] p-1 rounded-[8px]">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            const active = contentType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleContentTypeChange(type.value)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                  active ? 'bg-white text-primary shadow-sm' : 'text-text-mute hover:text-navy'
                }`}
              >
                <Icon size={15} />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video upload */}
      {contentType === 'VIDEO' && (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">Video</label>
        <VideoUploader
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          courseTitle={courseTitle}
          dbStatus={lesson.muxStatus}
          muxPlaybackId={lesson.muxPlaybackId}
          isReadOnly={isReadOnly}
        />
      </div>
      )}

      {contentType === 'ARTICLE' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">Article Body</label>
          <ArticleLessonEditor
            value={bodyContent}
            onChange={handleArticleChange}
            disabled={isReadOnly}
          />
        </div>
      )}

      {contentType === 'QUIZ' && (
        <div className="rounded-[8px] border border-dashed border-[#C8D1E0] bg-[#F8FAFF] p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <FileQuestion size={18} />
            Quiz builder coming next
          </div>
          <p className="text-sm font-medium text-text-mute leading-6">
            This lesson is marked as a quiz. The question builder, scoring rules, explanations, and attempt settings should be wired in a dedicated quiz phase so it does not get mixed with final certification exams.
          </p>
        </div>
      )}

      {/* Duration + Preview toggle */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-1.5 w-40">
          <label className="text-sm font-semibold text-navy">{durationLabel} (mins)</label>
          <input
            type="number" min={0} max={999}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isReadOnly || contentType === 'ARTICLE'}
            className={inputCls}
            placeholder="0"
          />
          <p className="text-[11px] leading-4 text-text-mute">{durationHint}</p>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-semibold text-navy">Free Preview</label>
          <button
            type="button"
            onClick={() => !isReadOnly && setIsPreview((v) => !v)}
            disabled={isReadOnly}
            className={`w-fit flex items-center gap-2 px-4 py-2.5 rounded-[8px] border text-sm font-medium transition-all ${
              isReadOnly ? 'bg-gray-50 border-stroke text-text-mute cursor-not-allowed' :
              isPreview
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white border-stroke text-text-mute hover:border-primary/30'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
              isPreview ? 'border-primary bg-primary' : 'border-text-mute'
            }`}>
              {isPreview && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            {isPreview ? 'Publicly visible' : 'Enrolled only'}
          </button>
        </div>
      </div>

      {/* Transcript */}
      {contentType === 'VIDEO' && (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">Transcript</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={isReadOnly}
          rows={6}
          className={`${inputCls} resize-y`}
          placeholder="Paste or type the lesson transcript here…"
        />
      </div>
      )}

      {/* Resources (read-only) */}
      {lesson.resources.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-navy">Resources</label>
          {lesson.resources.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-background rounded-[8px] border border-stroke">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{r.type}</span>
                <span className="text-sm font-medium text-navy truncate">{r.title}</span>
              </div>
              <a href={r.url} target="_blank" rel="noopener noreferrer"
                className="text-text-mute hover:text-primary transition-colors shrink-0 p-1">
                <ExternalLink size={13} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
