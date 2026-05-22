'use client';

import { CircleHelp, FileText, Video } from 'lucide-react';

export function getLessonTypeMeta(contentType?: string | null) {
  switch (contentType) {
    case 'ARTICLE':
      return {
        label: 'Article',
        Icon: FileText,
        classes: 'text-[#1C4ED1] bg-[#EEF3FF] border-[#BFDBFE]',
      };
    case 'QUIZ':
      return {
        label: 'Quiz',
        Icon: CircleHelp,
        classes: 'text-[#1C4ED1] bg-[#EEF3FF] border-[#BFDBFE]',
      };
    default:
      return {
        label: 'Video',
        Icon: Video,
        classes: 'text-[#1C4ED1] bg-[#EEF3FF] border-[#BFDBFE]',
      };
  }
}

export function LessonTypeIcon({
  contentType,
  showLabel = false,
  size = 'sm',
}: {
  contentType?: string | null;
  showLabel?: boolean;
  size?: 'xs' | 'sm';
}) {
  const meta = getLessonTypeMeta(contentType);
  const Icon = meta.Icon;
  const iconSize = size === 'xs' ? 12 : 14;

  return (
    <span
      title={meta.label}
      className={`inline-flex items-center justify-center gap-1 border rounded-[8px] ${meta.classes} ${
        showLabel ? 'px-2 py-1 text-[11px] font-bold' : size === 'xs' ? 'w-5 h-5' : 'w-6 h-6'
      }`}
    >
      <Icon size={iconSize} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
