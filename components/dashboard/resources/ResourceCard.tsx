'use client';

import React from 'react';
import Image from 'next/image';
import {
  Copy,
  Download,
  ExternalLink,
  File as FileIcon,
  GraduationCap,
  MoreVertical,
  Pencil,
  Repeat2,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Resource } from '@/lib/resourceService';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: string) => void;
  onDuplicate?: (resourceId: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isBookmarked = false,
  onToggleBookmark,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (onEdit || onDelete || onDuplicate) {
      event.preventDefault();
      setIsMenuOpen(true);
    }
  };

  const icon = resource.type === 'PDF'
    ? '/assets/dashboard/pdf-01.svg'
    : resource.type === 'LINK'
      ? '/assets/dashboard/user/arrow-up-right-03.svg'
      : resource.type === 'FILE'
        ? '/assets/dashboard/attachment-circle.svg'
        : null;
  const isGeneral = resource.isStandalone || resource.courseTitle === 'General Resource';
  const hasMenu = Boolean(onEdit || onDelete || onDuplicate);

  return (
    <Card
      onContextMenu={handleContextMenu}
      className={cn(
        'relative h-full select-none overflow-visible transition-colors hover:border-primary/30',
        isMenuOpen && 'z-10',
      )}
    >
      {resource.thumbnail ? (
        <div className="relative -mt-(--card-spacing) aspect-[16/9] overflow-hidden rounded-t-[16px] bg-background">
          <Image
            src={resource.thumbnail}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition-transform duration-300 hover:scale-[1.02] motion-reduce:transform-none"
          />
        </div>
      ) : null}

      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
            {icon ? <Image src={icon} alt="" width={24} height={24} /> : <FileIcon size={24} aria-hidden="true" />}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {resource.isFree !== undefined ? (
              <Badge variant={resource.isFree ? 'secondary' : 'outline'}>
                {resource.isFree ? 'Free' : `Paid${resource.price ? ` (₦${resource.price.toLocaleString()})` : ''}`}
              </Badge>
            ) : null}
            {!isGeneral ? <Badge variant="outline"><GraduationCap data-icon="inline-start" /> Course linked</Badge> : null}
            {onToggleBookmark ? (
              <button
                type="button"
                onClick={() => onToggleBookmark(resource.id)}
                className="flex size-10 items-center justify-center rounded-full text-text-mute transition-colors hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={isBookmarked ? `Remove ${resource.title} from saved resources` : `Save ${resource.title}`}
                aria-pressed={isBookmarked}
              >
                <Star size={18} className={isBookmarked ? 'fill-current text-primary' : ''} aria-hidden="true" />
              </button>
            ) : null}
            {hasMenu ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="flex size-10 items-center justify-center rounded-full text-text-mute transition-colors hover:bg-background hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`Resource actions for ${resource.title}`}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                >
                  <MoreVertical size={18} aria-hidden="true" />
                </button>
                {isMenuOpen ? (
                  <div role="menu" className="absolute right-0 top-11 w-60 rounded-[14px] border border-stroke bg-card-bg py-2 shadow-xl">
                    {onEdit ? <MenuButton icon={<Pencil size={15} />} onClick={() => { setIsMenuOpen(false); onEdit(resource); }}>Edit resource</MenuButton> : null}
                    {onDuplicate ? <MenuButton icon={<Copy size={15} />} onClick={() => { setIsMenuOpen(false); onDuplicate(resource.id); }}>Duplicate resource</MenuButton> : null}
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setIsMenuOpen(false)} className="flex min-h-10 w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-navy transition-colors hover:bg-background focus-visible:outline-none focus-visible:bg-background">
                      {resource.type === 'LINK' ? <ExternalLink size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
                      {resource.type === 'LINK' ? 'Open link' : 'Download file'}
                    </a>
                    <MenuButton icon={<Share2 size={15} />} onClick={() => {
                      setIsMenuOpen(false);
                      navigator.clipboard.writeText(`${window.location.origin}/resources/${resource.slug}`);
                      toast.success('Public resource link copied to clipboard!');
                    }}>Copy share link</MenuButton>
                    {onDelete ? <MenuButton destructive icon={<Trash2 size={15} />} onClick={() => { setIsMenuOpen(false); onDelete(resource.id); }}>Delete</MenuButton> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <CardTitle className="mt-3 line-clamp-2">{resource.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm font-medium text-text-mute">{resource.courseTitle}</p>
        {resource.description ? <p className="line-clamp-2 text-sm font-normal leading-6 text-text-body">{resource.description}</p> : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <Badge variant="secondary">{resource.type === 'LINK' ? 'Link' : resource.type}</Badge>
          {resource.scope === 'instructor' && typeof resource.usageCount === 'number' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Repeat2 size={14} aria-hidden="true" />{resource.usageCount} {resource.usageCount === 1 ? 'lesson' : 'lessons'}</span>
          ) : resource.size ? <span className="text-xs font-medium text-text-mute">{resource.size}</span> : null}
        </div>
      </CardContent>

      <CardFooter className="border-t">
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          {resource.type === 'LINK' ? <ExternalLink size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
          {resource.type === 'LINK' ? 'Open link' : 'Download file'}
        </a>
      </CardFooter>
    </Card>
  );
};

function MenuButton({ children, icon, onClick, destructive = false }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={destructive
        ? 'flex min-h-10 w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:bg-destructive/10'
        : 'flex min-h-10 w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-navy transition-colors hover:bg-background focus-visible:outline-none focus-visible:bg-background'}
    >
      {icon}{children}
    </button>
  );
}

export const ResourceCardSkeleton = () => (
  <Card className="h-full" aria-hidden="true">
    <CardHeader><Skeleton className="size-12" /><Skeleton className="mt-3 h-4 w-3/4" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /></CardContent>
    <CardFooter className="border-t"><Skeleton className="h-4 w-24" /></CardFooter>
  </Card>
);
