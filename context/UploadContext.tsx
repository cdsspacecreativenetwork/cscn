'use client';

import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { createUpload } from '@mux/upchunk';

export type UploadStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface UploadTask {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  status: UploadStatus;
  progress: number;
}

interface UploadContextValue {
  uploads: Map<string, UploadTask>;
  queueUpload: (lessonId: string, lessonTitle: string, courseTitle: string, file: File) => void;
  cancelUpload: (lessonId: string) => Promise<void>;
  dismiss: (lessonId: string) => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<Map<string, UploadTask>>(new Map());
  const pollRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  // Keeps the upchunk instance alive so we can abort mid-upload
  const uploadInstances = useRef<Map<string, ReturnType<typeof createUpload>>>(new Map());

  const update = useCallback((lessonId: string, patch: Partial<UploadTask>) => {
    setUploads((prev) => {
      const next = new Map(prev);
      const existing = next.get(lessonId);
      if (existing) next.set(lessonId, { ...existing, ...patch });
      return next;
    });
  }, []);

  const stopPolling = useCallback((lessonId: string) => {
    const id = pollRefs.current.get(lessonId);
    if (id) { clearInterval(id); pollRefs.current.delete(lessonId); }
  }, []);

  const remove = useCallback((lessonId: string) => {
    stopPolling(lessonId);
    uploadInstances.current.delete(lessonId);
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(lessonId);
      return next;
    });
  }, [stopPolling]);

  const startPolling = useCallback((lessonId: string) => {
    stopPolling(lessonId);
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        if (!res.ok) return;
        const data = await res.json() as { muxStatus: string };

        if (data.muxStatus === 'READY') {
          update(lessonId, { status: 'ready', progress: 100 });
          stopPolling(lessonId);
        } else if (data.muxStatus === 'ERROR') {
          update(lessonId, { status: 'error' });
          stopPolling(lessonId);
        } else if (data.muxStatus === 'PROCESSING') {
          update(lessonId, { status: 'processing', progress: 100 });
        }
      } catch { /* keep polling on transient errors */ }
    }, 5000);
    pollRefs.current.set(lessonId, id);
  }, [stopPolling, update]);

  const queueUpload = useCallback(async (
    lessonId: string,
    lessonTitle: string,
    courseTitle: string,
    file: File
  ) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(lessonId, { lessonId, lessonTitle, courseTitle, status: 'uploading', progress: 0 });
      return next;
    });

    try {
      const res = await fetch(`/api/mux/upload?lessonId=${lessonId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create upload');
      const { uploadUrl } = await res.json() as { uploadUrl: string };

      const upload = createUpload({
        endpoint: uploadUrl,
        file,
        chunkSize: 5120,
      });

      uploadInstances.current.set(lessonId, upload);

      upload.on('progress', (e) => update(lessonId, { progress: Math.round(e.detail) }));

      upload.on('success', () => {
        uploadInstances.current.delete(lessonId);
        update(lessonId, { status: 'processing', progress: 100 });
        startPolling(lessonId);
      });

      upload.on('error', (e) => {
        console.error('Mux upload error', e.detail);
        uploadInstances.current.delete(lessonId);
        update(lessonId, { status: 'error' });
      });
    } catch (err) {
      console.error('Upload setup error', err);
      uploadInstances.current.delete(lessonId);
      update(lessonId, { status: 'error' });
    }
  }, [startPolling, update]);

  const cancelUpload = useCallback(async (lessonId: string) => {
    // 1. Abort the in-progress upchunk transfer immediately
    const instance = uploadInstances.current.get(lessonId);
    if (instance) {
      instance.abort();
      uploadInstances.current.delete(lessonId);
    }

    // 2. Stop any active status polling
    stopPolling(lessonId);

    // 3. Remove from UI immediately so it feels instant
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(lessonId);
      return next;
    });

    // 4. Tell the server to delete the Mux asset and reset the lesson (fire-and-forget)
    fetch(`/api/mux/upload?lessonId=${lessonId}`, { method: 'DELETE' }).catch(console.error);
  }, [stopPolling]);

  const dismiss = useCallback((lessonId: string) => remove(lessonId), [remove]);

  return (
    <UploadContext.Provider value={{ uploads, queueUpload, cancelUpload, dismiss }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploadContext must be used inside UploadProvider');
  return ctx;
}
