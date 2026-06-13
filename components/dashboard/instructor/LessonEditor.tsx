'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { ClipboardPaste, Clock, ExternalLink, FileQuestion, FileText, Link2, Loader2, Plus, Save, Trash2, Video } from 'lucide-react';
import { updateLessonAction } from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import VideoUploader from './VideoUploader';
import ArticleLessonEditor from './ArticleLessonEditor';
import LessonResourceManager from './LessonResourceManager';
import QuizLessonBuilder, { type LessonQuiz } from './QuizLessonBuilder';
import Link from 'next/link';

interface Resource { id: string; title: string; url: string; type: string }

interface Lesson {
  id: string; title: string; position: number; videoUrl: string | null;
  duration: number | null; isPublished: boolean; isPreview: boolean;
  overview: string | null; transcript: string | null; bodyContent: string | null; contentType: string;
  resources: Resource[];
  quiz: LessonQuiz;
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

function parseTimestampLines(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const valid: TimestampItem[] = [];
  const invalid: string[] = [];
  const timePattern = /^\d{1,2}:\d{2}(?::\d{2})?$/;

  for (const line of lines) {
    const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
    if (!match || !timePattern.test(match[1]) || !match[2].trim()) {
      invalid.push(line);
      continue;
    }
    valid.push({ time: match[1], label: match[2].trim() });
  }

  return { valid, invalid };
}

export default function LessonEditor({ lesson, courseId, courseTitle, courseSlug, onUpdate, onDirtyChange, isReadOnly = false }: Props) {
  const [saving, startSave] = useTransition();

  const [title, setTitle] = useState(lesson.title);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? '');
  const [duration, setDuration] = useState<string>(lesson.duration?.toString() ?? '');
  const [isPreview, setIsPreview] = useState(lesson.isPreview);
  const [overview, setOverview] = useState(lesson.overview ?? '');
  const [transcript, setTranscript] = useState(lesson.transcript ?? '');
  const [bodyContent, setBodyContent] = useState(lesson.bodyContent ?? '');
  const [resources, setResources] = useState<Resource[]>(lesson.resources);
  const [contentType, setContentType] = useState<'VIDEO' | 'ARTICLE' | 'QUIZ'>(
    lesson.contentType === 'ARTICLE' || lesson.contentType === 'QUIZ' ? lesson.contentType : 'VIDEO'
  );
  const [timestamps, setTimestamps] = useState<TimestampItem[]>(
    parseVideoMetadata(lesson.bodyContent).timestamps
  );
  const [showTimestampPaste, setShowTimestampPaste] = useState(false);
  const [timestampPasteText, setTimestampPasteText] = useState('');
  const [timestampPasteErrors, setTimestampPasteErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const mountedRef = useRef(false);

  const draft = useMemo(() => ({
    title,
    videoUrl: videoUrl.trim() || null,
    duration: contentType === 'QUIZ' ? null : duration ? Number(duration) : null,
    isPreview,
    overview: overview.trim() || null,
    transcript: transcript.trim() || null,
    bodyContent: contentType === 'VIDEO'
      ? serializeVideoMetadata(timestamps)
      : bodyContent.trim() || null,
    contentType,
  }), [title, videoUrl, duration, isPreview, overview, transcript, bodyContent, timestamps, contentType]);

  const isDirty =
    title !== lesson.title ||
    videoUrl !== (lesson.videoUrl ?? '') ||
    duration !== (lesson.duration?.toString() ?? '') ||
    isPreview !== lesson.isPreview ||
    overview !== (lesson.overview ?? '') ||
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
    'Duration';

  const durationHint =
    contentType === 'ARTICLE' ? 'Calculated from the article body.' :
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

  const addPastedTimestamps = () => {
    const parsed = parseTimestampLines(timestampPasteText);
    setTimestampPasteErrors(parsed.invalid);
    if (parsed.invalid.length > 0) return;
    if (parsed.valid.length === 0) {
      setTimestampPasteErrors(['Paste at least one timestamp line.']);
      return;
    }
    setTimestamps((prev) => [...prev, ...parsed.valid]);
    setTimestampPasteText('');
    setTimestampPasteErrors([]);
    setShowTimestampPaste(false);
    toast.success(`${parsed.valid.length} timestamp${parsed.valid.length === 1 ? '' : 's'} added.`);
  };

  return (
    <div className="bg-white rounded-[8px] border border-stroke flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-navy text-lg leading-tight sm:text-base">Edit Lesson</h2>
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
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
          <Link
            href={`/courses/${courseSlug}/watch/${lesson.id}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[8px] border border-stroke px-3 text-xs font-semibold text-navy transition-colors hover:bg-background sm:h-auto sm:shrink-0 sm:py-2"
          >
            <ExternalLink size={13} />
            <span className="truncate">Preview</span>
          </Link>
          {!isReadOnly && (
            <Button
              variant="primary"
              size="sm"
              rounded="md"
              className="h-10 w-full sm:h-auto sm:w-auto"
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

      {/* Overview */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">Lesson Overview</label>
        <textarea
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
          disabled={isReadOnly}
          rows={4}
          className={`${inputCls} resize-y`}
          placeholder="Briefly explain what this lesson covers and what learners should expect..."
        />
        <p className="text-[11px] leading-4 text-text-mute">
          This appears in the lesson player overview so students understand the purpose of the lesson.
        </p>
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
        <QuizLessonBuilder
          lessonId={lesson.id}
          courseId={courseId}
          quiz={lesson.quiz}
          disabled={isReadOnly}
          onSaved={(quiz) => onUpdate({ ...lesson, ...draft, resources, quiz })}
        />
      )}

      {/* Duration + Preview toggle */}
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        {contentType !== 'QUIZ' && (
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
        )}

        <div className="flex min-w-0 flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">Free Preview</label>
          <button
            type="button"
            onClick={() => !isReadOnly && setIsPreview((v) => !v)}
            disabled={isReadOnly}
            className={`inline-flex h-[42px] w-fit max-w-full items-center gap-2 rounded-[8px] border px-3 text-sm font-semibold leading-none transition-all sm:px-4 ${
              isReadOnly ? 'bg-gray-50 border-stroke text-text-mute cursor-not-allowed' :
              isPreview
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white border-stroke text-text-mute hover:border-primary/30'
            }`}
          >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              isPreview ? 'border-primary bg-primary' : 'border-text-mute'
            }`}>
              {isPreview && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <span className="whitespace-nowrap">{isPreview ? 'Public preview' : 'Enrolled only'}</span>
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
              <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTimestampPaste(true)}
                className="flex items-center gap-1.5 rounded-[8px] border border-[#C8D7FF] bg-[#1C4ED1]/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-[#1C4ED1]/10"
              >
                <ClipboardPaste size={13} />
                Paste timestamps
              </button>
              <button
                type="button"
                onClick={() => setTimestamps((prev) => [...prev, { time: '', label: '' }])}
                className="flex items-center gap-1.5 rounded-[8px] border border-stroke px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
              >
                <Plus size={13} />
                Add timestamp
              </button>
              </div>
            )}
          </div>
          {!isReadOnly && showTimestampPaste && (
            <div className={`rounded-[14px] border border-dashed p-3 ${
              timestampPasteErrors.length > 0 ? 'border-red-300 bg-red-50/60' : 'border-[#C8D7FF] bg-[#F8FAFF]'
            }`}>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">Paste multiple timestamps</p>
                <p className="text-[11px] font-medium leading-4 text-text-mute">
                  Format: <span className="font-bold text-navy">00:00 Introduction</span> or <span className="font-bold text-navy">01:02:15 Final walkthrough</span>. One timestamp per line.
                </p>
              </div>
              <textarea
                value={timestampPasteText}
                onChange={(event) => {
                  setTimestampPasteText(event.target.value);
                  if (timestampPasteErrors.length > 0) setTimestampPasteErrors([]);
                }}
                rows={4}
                className={`${inputCls} mt-3 resize-y bg-white ${timestampPasteErrors.length > 0 ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                placeholder={`00:00 Introduction\n04:30 Project setup\n12:10 Wrap up`}
              />
              {timestampPasteErrors.length > 0 && (
                <div className="mt-2 rounded-[10px] border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold leading-5 text-red-600">
                  Use MM:SS or HH:MM:SS followed by a chapter title. Invalid line{timestampPasteErrors.length === 1 ? '' : 's'}: {timestampPasteErrors.slice(0, 3).join(' | ')}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addPastedTimestamps}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#1C4ED1] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173FA8]"
                >
                  <ClipboardPaste size={14} />
                  Add pasted timestamps
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimestampPasteText('');
                    setTimestampPasteErrors([]);
                    setShowTimestampPaste(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-stroke bg-white px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-[#1C4ED1]/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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

      {contentType !== 'QUIZ' && (
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
      )}
    </div>
  );
}
