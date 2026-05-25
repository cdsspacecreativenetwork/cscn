'use client';

import { useMemo, useState, useTransition } from 'react';
import { Clock, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type { PlayerNote } from '@/types/player';

function formatTime(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return 'Lesson';
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function LessonNotesPanel({
  lessonId,
  initialNotes,
  currentTime,
  canWrite,
  onSeek,
}: {
  lessonId: string;
  initialNotes: PlayerNote[];
  currentTime: number;
  canWrite: boolean;
  onSeek: (seconds: number) => void;
}) {
  const [notes, setNotes] = useState<PlayerNote[]>(initialNotes);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [isPending, startTransition] = useTransition();

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        const aTime = a.timestamp ?? Number.MAX_SAFE_INTEGER;
        const bTime = b.timestamp ?? Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) return aTime - bTime;
        return a.createdAt.localeCompare(b.createdAt);
      }),
    [notes]
  );

  const addNote = () => {
    const body = draft.trim();
    if (!body || !canWrite || isPending) return;

    startTransition(async () => {
      const response = await fetch(`/api/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, timestamp: Number.isFinite(currentTime) ? currentTime : null }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { note?: PlayerNote };
      if (data.note) {
        setNotes((current) => [...current, data.note!]);
        setDraft('');
      }
    });
  };

  const saveEdit = (noteId: string) => {
    const body = editingBody.trim();
    if (!body || isPending) return;

    startTransition(async () => {
      const response = await fetch(`/api/lesson-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { note?: PlayerNote };
      if (data.note) {
        setNotes((current) => current.map((note) => (note.id === noteId ? data.note! : note)));
        setEditingId(null);
        setEditingBody('');
      }
    });
  };

  const deleteNote = (noteId: string) => {
    if (isPending) return;

    startTransition(async () => {
      const response = await fetch(`/api/lesson-notes/${noteId}`, { method: 'DELETE' });
      if (response.ok) {
        setNotes((current) => current.filter((note) => note.id !== noteId));
      }
    });
  };

  return (
    <aside className="rounded-[8px] border border-[#E3E8F4] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E3E8F4] px-4 py-3">
        <div>
          <p className="text-sm font-black text-[#040B37]">Private notes</p>
          <p className="text-xs font-medium text-text-mute">Saved only for you</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
          <Pencil size={16} />
        </div>
      </div>

      {canWrite && (
        <div className="border-b border-[#E3E8F4] p-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a note at the current point..."
            className="min-h-24 w-full resize-none rounded-[8px] border border-[#D8E0F0] bg-white px-3 py-2 text-sm font-medium text-[#040B37] outline-none transition focus:border-primary"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <Clock size={13} />
              {formatTime(currentTime)}
            </span>
            <button
              type="button"
              onClick={addNote}
              disabled={!draft.trim() || isPending}
              className="inline-flex items-center gap-2 rounded-[8px] bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              Add note
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto p-3">
        {sortedNotes.length === 0 ? (
          <div className="rounded-[8px] bg-[#F4F6FB] px-4 py-8 text-center">
            <p className="text-sm font-semibold text-[#040B37]">No notes yet</p>
            <p className="mt-1 text-xs font-medium text-text-mute">Add one while watching to jump back later.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedNotes.map((note) => {
              const isEditing = editingId === note.id;
              return (
                <div key={note.id} className="rounded-[8px] border border-[#E3E8F4] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => note.timestamp !== null && onSeek(note.timestamp)}
                      className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary/10 px-2 py-1 text-xs font-black text-primary transition hover:bg-primary/15"
                    >
                      <Clock size={12} />
                      {formatTime(note.timestamp)}
                    </button>
                    {canWrite && (
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(note.id)}
                              className="rounded-[8px] p-1.5 text-primary hover:bg-primary/10"
                              aria-label="Save note"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingBody('');
                              }}
                              className="rounded-[8px] p-1.5 text-text-mute hover:bg-[#F4F6FB]"
                              aria-label="Cancel editing"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(note.id);
                                setEditingBody(note.body);
                              }}
                              className="rounded-[8px] p-1.5 text-text-mute hover:bg-[#F4F6FB] hover:text-primary"
                              aria-label="Edit note"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteNote(note.id)}
                              className="rounded-[8px] p-1.5 text-text-mute hover:bg-red-50 hover:text-red-500"
                              aria-label="Delete note"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                      className="min-h-20 w-full resize-none rounded-[8px] border border-[#D8E0F0] px-3 py-2 text-sm font-medium text-[#040B37] outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#27324A]">{note.body}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
