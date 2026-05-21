'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, X, Play } from 'lucide-react';
import { useUploadContext } from '@/context/UploadContext';
import MuxPlayer from '@mux/mux-player-react';

interface VideoUploaderProps {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  /** muxStatus from DB at page-render time */
  dbStatus: string;
  /** muxPlaybackId from DB — used for inline preview */
  muxPlaybackId: string | null;
  isReadOnly?: boolean;
}

export default function VideoUploader({
  lessonId,
  lessonTitle,
  courseTitle,
  dbStatus,
  muxPlaybackId: initialPlaybackId,
  isReadOnly = false,
}: VideoUploaderProps) {
  const { uploads, queueUpload, cancelUpload } = useUploadContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Live status fetched from DB — overrides the stale server-rendered dbStatus
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [livePlaybackId, setLivePlaybackId] = useState<string | null>(null);

  const contextTask = uploads.get(lessonId);

  // When the component mounts with a non-terminal DB status but no active upload in context
  // (e.g. after page navigation), poll until we discover the real status.
  useEffect(() => {
    if (contextTask) return; // context is managing this — don't interfere
    if (dbStatus !== 'UPLOADING' && dbStatus !== 'PROCESSING') return;

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json() as { muxStatus: string; muxPlaybackId: string | null };
        setLiveStatus(data.muxStatus);
        setLivePlaybackId(data.muxPlaybackId);
        // Keep polling until we reach a terminal state
        if (data.muxStatus === 'UPLOADING' || data.muxStatus === 'PROCESSING') {
          setTimeout(poll, 4000);
        }
      } catch {
        if (!cancelled) setTimeout(poll, 4000);
      }
    }

    poll(); // fetch immediately on mount, don't wait 4s
    return () => { cancelled = true; };
  }, [lessonId, dbStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveDbStatus = liveStatus ?? dbStatus;
  const playbackId = livePlaybackId ?? initialPlaybackId;

  const status = contextTask?.status ?? (
    effectiveDbStatus === 'READY' ? 'ready' :
    effectiveDbStatus === 'PROCESSING' ? 'processing' :
    effectiveDbStatus === 'UPLOADING' ? 'uploading' :
    effectiveDbStatus === 'ERROR' ? 'error' :
    'idle'
  );
  const progress = contextTask?.progress ?? 0;

  const openPreview = async () => {
    setPreviewOpen(true);
    if (previewToken) return; // already fetched
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/mux/token?lessonId=${lessonId}`);
      if (!res.ok) throw new Error('Failed to get token');
      const data = await res.json() as { token: string };
      setPreviewToken(data.token);
    } catch {
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file.');
      return;
    }
    queueUpload(lessonId, lessonTitle, courseTitle, file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

                  console.log("🚀 ~ VideoUploader ~ playbackId:", playbackId)
                  console.log("🚀 ~ VideoUploader ~ previewToken:", previewToken)
  return (
    <>
      {/* Preview modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-navy">
              <p className="text-white text-sm font-semibold truncate">{lessonTitle}</p>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-white/60 hover:text-white transition-colors shrink-0 ml-3"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {previewLoading && (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={32} className="text-white animate-spin" />
                </div>
              )}
              {!previewLoading && playbackId && previewToken && (
                <MuxPlayer
                  playbackId={playbackId}
                  tokens={{ playback: previewToken }}
                  streamType="on-demand"
                  style={{ width: '100%', height: '100%' }}
                  autoPlay
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status UI */}
      {status === 'ready' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Video ready</p>
            <p className="text-xs text-emerald-600 mt-0.5">Processing complete.</p>
          </div>
          <button
            type="button"
            onClick={openPreview}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
          >
            <Play size={12} /> Preview
          </button>
          {!isReadOnly && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-800 shrink-0 transition-colors"
              >
                Replace
              </button>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </>
          )}
        </div>
      )}

      {status === 'uploading' && (
        <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-primary shrink-0 animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy">Uploading… {progress}%</p>
              <p className="text-xs text-text-mute mt-0.5">You can continue editing — upload runs in the background.</p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => cancelUpload(lessonId)}
                title="Cancel upload"
                className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <Loader2 size={18} className="text-amber-600 shrink-0 animate-spin" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Processing video…</p>
            <p className="text-xs text-amber-600 mt-0.5">Mux is encoding your video. Usually 1–3 minutes.</p>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => cancelUpload(lessonId)}
              title="Cancel and delete"
              className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {status === 'error' && (
        <>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">Upload failed</p>
              <p className="text-xs text-red-500 mt-0.5">Please try uploading again.</p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-red-600 hover:text-red-800 shrink-0 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
          {!isReadOnly && <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />}
        </>
      )}

      {status === 'idle' && (
        isReadOnly ? (
          <div className="w-full flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border border-stroke bg-gray-50 text-text-mute">
            <Upload size={20} className="text-gray-400" />
            <p className="text-sm font-medium">No video uploaded</p>
          </div>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed transition-all ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-stroke bg-background hover:border-primary/50'
              }`}
            >
              <div className="p-3 rounded-full bg-primary/10">
                <Upload size={20} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-navy">Upload video</p>
                <p className="text-xs text-text-mute mt-1">Drag & drop or click to browse · MP4, MOV, WebM</p>
              </div>
            </button>
          </>
        )
      )}
    </>
  );
}
