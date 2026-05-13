'use client';

import { useState, useTransition, useRef } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { updateLessonAction } from '@/actions/instructor';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';

interface Resource { id: string; title: string; url: string; type: string }

interface Lesson {
  id: string; title: string; position: number; videoUrl: string | null;
  duration: number | null; isPreview: boolean;
  transcript: string | null; contentType: string;
  resources: Resource[];
}

interface Props {
  lesson: Lesson;
  courseId: string;
  onUpdate: (updated: Lesson) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const inputCls =
  'w-full px-3 py-2.5 border border-stroke rounded-xl text-sm font-medium text-navy placeholder:text-text-mute bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

export default function LessonEditor({ lesson, courseId, onUpdate, onDirtyChange }: Props) {
  const [saving, startSave] = useTransition();

  const [title, setTitle] = useState(lesson.title);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? '');
  const [duration, setDuration] = useState<string>(lesson.duration?.toString() ?? '');
  const [isPreview, setIsPreview] = useState(lesson.isPreview);
  const [transcript, setTranscript] = useState(lesson.transcript ?? '');

  const isDirty =
    title !== lesson.title ||
    videoUrl !== (lesson.videoUrl ?? '') ||
    duration !== (lesson.duration?.toString() ?? '') ||
    isPreview !== lesson.isPreview ||
    transcript !== (lesson.transcript ?? '');

  // Notify parent when dirty status changes without causing render loops
  const prevDirtyRef = useRef(false);
  if (prevDirtyRef.current !== isDirty) {
    prevDirtyRef.current = isDirty;
    onDirtyChange?.(isDirty);
  }

  const handleSave = () => {
    startSave(async () => {
      try {
        await updateLessonAction(lesson.id, courseId, {
          title,
          videoUrl: videoUrl.trim() || null,
          duration: duration ? Number(duration) : null,
          isPreview,
          transcript: transcript.trim() || null,
        });
        onUpdate({
          ...lesson,
          title,
          videoUrl: videoUrl.trim() || null,
          duration: duration ? Number(duration) : null,
          isPreview,
          transcript: transcript.trim() || null,
        });
        onDirtyChange?.(false);
        toast.success('Lesson saved.');
      } catch {
        toast.error('Failed to save lesson.');
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stroke flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-navy text-base">Edit Lesson</h2>
          {isDirty && (
            <p className="text-xs text-amber-500 font-medium mt-0.5">Unsaved changes</p>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          rounded="xl"
          leftIcon={<Save size={14} />}
          onClick={handleSave}
          loading={saving}
        >
          Save
        </Button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">Lesson Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder="Lesson title"
        />
      </div>

      {/* Video URL */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">Video URL</label>
        <p className="text-xs text-text-mute -mt-0.5">Paste a YouTube URL. Direct upload coming soon.</p>
        <div className="flex gap-2">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={`${inputCls} flex-1`}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 border border-stroke rounded-xl text-text-mute hover:text-primary transition-colors shrink-0"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Duration + Preview toggle */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-1.5 w-32">
          <label className="text-sm font-semibold text-navy">Duration (mins)</label>
          <input
            type="number" min={0} max={999}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-semibold text-navy">Free Preview</label>
          <button
            type="button"
            onClick={() => setIsPreview((v) => !v)}
            className={`w-fit flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">Transcript</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className={`${inputCls} resize-y`}
          placeholder="Paste or type the lesson transcript here…"
        />
      </div>

      {/* Resources (read-only) */}
      {lesson.resources.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-navy">Resources</label>
          {lesson.resources.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-background rounded-xl border border-stroke">
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
