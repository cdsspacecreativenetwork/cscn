'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  attachExistingLessonResourceAction,
  addLessonResourceLinkAction,
  deleteLessonResourceAction,
  listReusableLessonResourcesAction,
  uploadLessonResourceAction,
} from '@/actions/instructor';
import { Download, ExternalLink, FileArchive, FileText, Link as LinkIcon, Loader2, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface LessonResourceManagerProps {
  courseId: string;
  lessonId: string;
  resources: Resource[];
  disabled?: boolean;
  onChange: (resources: Resource[]) => void;
}

const inputCls =
  'w-full px-3 py-2.5 border border-stroke rounded-[8px] text-sm font-medium text-navy placeholder:text-text-mute bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

function ResourceIcon({ type }: { type: string }) {
  if (type === 'PDF') return <FileText size={16} className="text-primary" />;
  if (type === 'LINK') return <LinkIcon size={16} className="text-primary" />;
  return <FileArchive size={16} className="text-primary" />;
}

export default function LessonResourceManager({
  courseId,
  lessonId,
  resources,
  disabled = false,
  onChange,
}: LessonResourceManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'link' | 'upload' | 'library'>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [library, setLibrary] = useState<Resource[]>([]);
  const [loadingLibrary, startLoadLibrary] = useTransition();
  const [pending, startAction] = useTransition();

  const attachedUrls = useMemo(() => new Set(resources.map((resource) => resource.url)), [resources]);
  const availableLibrary = library.filter((resource) => !attachedUrls.has(resource.url));

  const refreshLibrary = () => {
    startLoadLibrary(async () => {
      try {
        const rows = await listReusableLessonResourcesAction(courseId, lessonId);
        setLibrary(rows);
      } catch {
        toast.error('Failed to load reusable resources.');
      }
    });
  };

  useEffect(() => {
    if (mode === 'library') refreshLibrary();
  }, [mode]);

  const addLink = () => {
    if (disabled) return;
    startAction(async () => {
      const result = await addLessonResourceLinkAction(courseId, lessonId, { title, url });
      if (result.error || !result.resource) {
        toast.error(result.error ?? 'Failed to add resource.');
        return;
      }
      onChange([...resources, result.resource]);
      setTitle('');
      setUrl('');
      toast.success('Resource added.');
    });
  };

  const uploadFile = () => {
    if (disabled || !selectedFile) return;
    startAction(async () => {
      const formData = new FormData();
      formData.set('file', selectedFile);
      formData.set('title', fileTitle);

      const result = await uploadLessonResourceAction(courseId, lessonId, formData);
      if (result.error || !result.resource) {
        toast.error(result.error ?? 'Failed to upload resource.');
        return;
      }

      onChange([...resources, result.resource]);
      setSelectedFile(null);
      setFileTitle('');
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Resource uploaded.');
    });
  };

  const attachExisting = (resourceId: string) => {
    if (disabled) return;
    startAction(async () => {
      const result = await attachExistingLessonResourceAction(courseId, lessonId, resourceId);
      if (result.error || !result.resource) {
        toast.error(result.error ?? 'Failed to attach resource.');
        return;
      }
      if (!resources.some((resource) => resource.id === result.resource?.id)) {
        onChange([...resources, result.resource]);
      }
      toast.success('Resource attached.');
      refreshLibrary();
    });
  };

  const deleteResource = (resourceId: string) => {
    if (disabled) return;
    startAction(async () => {
      const result = await deleteLessonResourceAction(courseId, lessonId, resourceId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onChange(resources.filter((resource) => resource.id !== resourceId));
      toast.success('Resource removed from this lesson.');
    });
  };

  return (
    <div className="rounded-[8px] border border-stroke bg-white overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-stroke bg-[#F8FAFF] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-navy">Lesson Resources</h3>
            <p className="text-xs font-medium text-text-mute">
              Attach PDFs, downloads, external links, or reusable materials for learners.
            </p>
          </div>
          <span className="rounded-[8px] bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
            {resources.length} attached
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-stroke p-3">
        {([
          { id: 'link', label: 'Add link', icon: LinkIcon },
          { id: 'upload', label: 'Upload file', icon: Upload },
          { id: 'library', label: 'Reuse', icon: Download },
        ] as const).map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => setMode(item.id)}
              className={`inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${
                active ? 'bg-primary text-white' : 'bg-[#F4F6FB] text-text-body hover:text-primary'
              }`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {mode === 'link' && (
          <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">Title</label>
              <input value={title} onChange={(event) => setTitle(event.target.value)} disabled={disabled} className={inputCls} placeholder="Workbook, GitHub repo, reading..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">URL</label>
              <input value={url} onChange={(event) => setUrl(event.target.value)} disabled={disabled} className={inputCls} placeholder="https://..." />
            </div>
            <button type="button" onClick={addLink} disabled={disabled || pending} className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-bold text-white disabled:opacity-60">
              {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Add
            </button>
          </div>
        )}

        {mode === 'upload' && (
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">Display title</label>
              <input value={fileTitle} onChange={(event) => setFileTitle(event.target.value)} disabled={disabled} className={inputCls} placeholder="Optional. Defaults to filename." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">File</label>
              <input ref={fileRef} type="file" disabled={disabled} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className={`${inputCls} file:mr-3 file:rounded-[8px] file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary`} />
            </div>
            <button type="button" onClick={uploadFile} disabled={disabled || pending || !selectedFile} className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-bold text-white disabled:opacity-60">
              {pending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Upload
            </button>
          </div>
        )}

        {mode === 'library' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-text-mute">Reuse resources already attached to lessons in this course.</p>
              <button type="button" onClick={refreshLibrary} disabled={loadingLibrary} className="inline-flex items-center gap-2 rounded-[8px] border border-stroke px-3 py-2 text-xs font-bold text-navy hover:bg-background disabled:opacity-60">
                <RefreshCw size={13} className={loadingLibrary ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            {availableLibrary.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-stroke bg-[#F8FAFF] p-5 text-center text-sm font-medium text-text-mute">
                No reusable resources yet.
              </div>
            ) : (
              <div className="grid gap-2">
                {availableLibrary.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-stroke px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ResourceIcon type={resource.type} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy">{resource.title}</p>
                        <p className="truncate text-xs font-medium text-text-mute">{resource.type}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => attachExisting(resource.id)} disabled={disabled || pending} className="rounded-[8px] bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15 disabled:opacity-60">
                      Attach
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {resources.length > 0 && (
        <div className="border-t border-stroke p-4">
          <div className="grid gap-2">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-stroke bg-[#F8FAFF] px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <ResourceIcon type={resource.type} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy">{resource.title}</p>
                    <p className="text-xs font-medium text-text-mute">{resource.type}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="rounded-[8px] p-2 text-text-mute hover:bg-white hover:text-primary">
                    <ExternalLink size={15} />
                  </a>
                  {!disabled && (
                    <button type="button" onClick={() => deleteResource(resource.id)} disabled={pending} className="rounded-[8px] p-2 text-text-mute hover:bg-white hover:text-red-500 disabled:opacity-60">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
