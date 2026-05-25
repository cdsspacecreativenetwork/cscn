'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Clock, ExternalLink, FileQuestion, FileText, Link2, Loader2, Plus, Save, Trash2, Video } from 'lucide-react';
import { updateLessonAction } from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import VideoUploader from './VideoUploader';
import ArticleLessonEditor from './ArticleLessonEditor';
import LessonResourceManager from './LessonResourceManager';
import Link from 'next/link';

interface Resource { id: string; title: string; url: string; type: string }

interface Lesson {
  id: string; title: string; position: number; videoUrl: string | null;
  duration: number | null; isPublished: boolean; isPreview: boolean;
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
type TimestampItem = { time: string; label: string };

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

function normalizeTimestamps(value: unknown): TimestampItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      return {
        time: typeof record.time === 'string' ? record.time : '',
        label: typeof record.label === 'string' ? record.label : '',
      };
    })
    .filter((item): item is TimestampItem => !!item);
}

function cleanTimestamps(items: TimestampItem[]) {
  return items
    .map((item) => ({ time: item.time.trim(), label: item.label.trim() }))
    .filter((item) => item.time && item.label);
}

function parseVideoMetadata(value: string | null): { timestamps: TimestampItem[] } {
  if (!value) return { timestamps: [] };
  try {
    const parsed = JSON.parse(value) as { timestamps?: unknown };
    return { timestamps: normalizeTimestamps(parsed.timestamps) };
  } catch {
    return { timestamps: [] };
  }
}

function serializeVideoMetadata(timestamps: TimestampItem[]) {
  const clean = cleanTimestamps(timestamps);
  return clean.length > 0 ? JSON.stringify({ timestamps: clean }) : null;
}

export default function LessonEditor({ lesson, courseId, courseTitle, courseSlug, onUpdate, onDirtyChange, isReadOnly = false }: Props) {
  const [saving, startSave] = useTransition();

  const [title, setTitle] = useState(lesson.title);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? '');
  const [duration, setDuration] = useState<string>(lesson.duration?.toString() ?? '');
  const [isPreview, setIsPreview] = useState(lesson.isPreview);
  const [transcript, setTranscript] = useState(lesson.transcript ?? '');
  const [bodyContent, setBodyContent] = useState(lesson.bodyContent ?? '');
  const [resources, setResources] = useState<Resource[]>(lesson.resources);
  const [contentType, setContentType] = useState<'VIDEO' | 'ARTICLE' | 'QUIZ'>(
    lesson.contentType === 'ARTICLE' || lesson.contentType === 'QUIZ' ? lesson.contentType : 'VIDEO'
  );
  const [timestamps, setTimestamps] = useState<TimestampItem[]>(
    parseVideoMetadata(lesson.bodyContent).timestamps
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const mountedRef = useRef(false);

  const draft = useMemo(() => ({
    title,
    videoUrl: videoUrl.trim() || null,
    duration: duration ? Number(duration) : null,
    isPreview,
    transcript: transcript.trim() || null,
    bodyContent: contentType === 'VIDEO'
      ? serializeVideoMetadata(timestamps)
      : bodyContent.trim() || null,
    contentType,
  }), [title, videoUrl, duration, isPreview, transcript, bodyContent, timestamps, contentType]);

  const isDirty =
    title !== lesson.title ||
    videoUrl !== (lesson.videoUrl ?? '') ||
    duration !== (lesson.duration?.toString() ?? '') ||
    isPreview !== lesson.isPreview ||
    transcript !== (lesson.transcript ?? '') ||
    bodyContent !== (lesson.bodyContent ?? '') && contentType !== 'VIDEO' ||
    contentType !== (lesson.contentType === 'ARTICLE' || lesson.contentType === 'QUIZ' ? lesson.contentType : 'VIDEO') ||
    JSON.stringify(cleanTimestamps(timestamps)) !== JSON.stringify(cleanTimestamps(parseVideoMetadata(lesson.bodyContent).timestamps));

  const prevDirtyRef = useRef(false);
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      prevDirtyRef.current = isDirty;
      onDirtyChange?.(isDirty);
    }
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
          resources,
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">Uploaded Video</label>
          <VideoUploader
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            courseTitle={courseTitle}
            dbStatus={lesson.muxStatus}
            muxPlaybackId={lesson.muxPlaybackId}
            isReadOnly={isReadOnly}
          />
        </div>

        <div className="rounded-[8px] border border-stroke bg-[#F8FAFF] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
            <Link2 size={15} className="text-primary" />
            External video link
          </div>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={isReadOnly}
            className={inputCls}
            placeholder="YouTube link or video ID"
          />
          <p className="mt-2 text-[11px] leading-4 text-text-mute">
            Use this for curated free lessons already hosted on YouTube. Uploaded Mux video is preferred for paid premium content.
          </p>
        </div>
      </div>
      )}

      {contentType === 'ARTICLE' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">Article Body</label>
          <ArticleLessonEditor
            value={bodyContent}
            onChange={handleArticleChange}
            courseId={courseId}
            lessonId={lesson.id}
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
        <div className="flex flex-col gap-1.5">
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
      <>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-navy">Timestamps</label>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setTimestamps((prev) => [...prev, { time: '', label: '' }])}
                className="flex items-center gap-1.5 rounded-[8px] border border-stroke px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
              >
                <Plus size={13} />
                Add timestamp
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {timestamps.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-[#C8D1E0] bg-[#F8FAFF] px-4 py-3 text-xs font-medium text-text-mute">
                Add optional chapter markers like 00:00 Introduction or 04:30 Project setup.
              </div>
            ) : timestamps.map((item, index) => (
              <div key={index} className="grid grid-cols-[120px_1fr_auto] gap-2">
                <div className="relative">
                  <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input
                    value={item.time}
                    onChange={(e) => setTimestamps((prev) => prev.map((v, i) => i === index ? { ...v, time: e.target.value } : v))}
                    disabled={isReadOnly}
                    className={`${inputCls} pl-8`}
                    placeholder="04:30"
                  />
                </div>
                <input
                  value={item.label}
                  onChange={(e) => setTimestamps((prev) => prev.map((v, i) => i === index ? { ...v, label: e.target.value } : v))}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Chapter title"
                />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setTimestamps((prev) => prev.filter((_, i) => i !== index))}
                    className="flex h-10 w-10 items-center justify-center rounded-[8px] text-text-mute hover:bg-red-50 hover:text-red-500"
                    title="Remove timestamp"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">Transcript</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={isReadOnly}
            rows={6}
            className={`${inputCls} resize-y`}
            placeholder="Paste or type the lesson transcript here..."
          />
        </div>
      </>
      )}

      <LessonResourceManager
        courseId={courseId}
        lessonId={lesson.id}
        resources={resources}
        disabled={isReadOnly}
        onChange={(nextResources) => {
          setResources(nextResources);
          onUpdate({ ...lesson, ...draft, resources: nextResources });
        }}
      />
    </div>
  );
}
