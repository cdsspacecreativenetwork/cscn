'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Button from './Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${destructive ? 'bg-red-50' : 'bg-amber-50'}`}>
            {destructive ? (
              <Trash2 size={20} className="text-red-500" />
            ) : (
              <AlertTriangle size={20} className="text-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-navy text-base leading-tight">{title}</h3>
            <p className="text-sm text-text-mute mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            rounded="xl"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-9 px-4 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 ${
              destructive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
