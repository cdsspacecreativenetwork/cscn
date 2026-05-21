'use client';

import { useState } from 'react';
import { useUploadContext, type UploadTask } from '@/context/UploadContext';
import { CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, X, Upload } from 'lucide-react';

function UploadCard({ task, onDismiss, onCancel }: {
  task: UploadTask;
  onDismiss: () => void;
  onCancel: () => void;
}) {
  const isActive = task.status === 'uploading' || task.status === 'processing';
  const isTerminal = task.status === 'ready' || task.status === 'error';

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-white border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        {task.status === 'uploading' && <Upload size={15} className="text-primary shrink-0" />}
        {task.status === 'processing' && <Loader2 size={15} className="text-amber-500 shrink-0 animate-spin" />}
        {task.status === 'ready' && <CheckCircle size={15} className="text-emerald-500 shrink-0" />}
        {task.status === 'error' && <AlertCircle size={15} className="text-red-500 shrink-0" />}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-navy truncate">{task.lessonTitle}</p>
          <p className="text-[11px] text-text-mute truncate">{task.courseTitle}</p>
        </div>

        {isActive && (
          <button
            onClick={onCancel}
            title="Cancel upload"
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-0.5 rounded"
          >
            <X size={13} />
          </button>
        )}
        {isTerminal && (
          <button
            onClick={onDismiss}
            title="Dismiss"
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-0.5 rounded"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {task.status === 'uploading' && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[10px] text-text-mute font-medium shrink-0 w-7 text-right">
            {task.progress}%
          </span>
        </div>
      )}

      {task.status === 'processing' && (
        <p className="text-[10px] text-amber-600 font-medium">Encoding video…</p>
      )}
      {task.status === 'ready' && (
        <p className="text-[10px] text-emerald-600 font-medium">Ready to watch</p>
      )}
      {task.status === 'error' && (
        <p className="text-[10px] text-red-500 font-medium">Upload failed — try again</p>
      )}
    </div>
  );
}

export default function UploadQueuePanel() {
  const { uploads, dismiss, cancelUpload } = useUploadContext();
  const [minimized, setMinimized] = useState(false);

  if (uploads.size === 0) return null;

  const tasks = Array.from(uploads.values());
  const activeCount = tasks.filter((t) => t.status === 'uploading' || t.status === 'processing').length;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[300px] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden font-jakarta">
      <div
        className="flex items-center justify-between px-4 py-3 bg-navy cursor-pointer select-none"
        onClick={() => setMinimized((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {activeCount > 0
            ? <Loader2 size={14} className="text-white animate-spin" />
            : <CheckCircle size={14} className="text-emerald-400" />
          }
          <span className="text-white text-xs font-semibold">
            {activeCount > 0
              ? `Uploading ${activeCount} video${activeCount > 1 ? 's' : ''}…`
              : 'Uploads complete'}
          </span>
        </div>
        {minimized
          ? <ChevronUp size={14} className="text-white/70" />
          : <ChevronDown size={14} className="text-white/70" />
        }
      </div>

      {!minimized && (
        <>
          <div className="max-h-[320px] overflow-y-auto bg-white">
            {tasks.map((task) => (
              <UploadCard
                key={task.lessonId}
                task={task}
                onDismiss={() => dismiss(task.lessonId)}
                onCancel={() => cancelUpload(task.lessonId)}
              />
            ))}
          </div>

          {activeCount > 0 && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
              <p className="text-[10px] text-amber-700 font-medium text-center">
                Keep this tab open until uploads complete
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
