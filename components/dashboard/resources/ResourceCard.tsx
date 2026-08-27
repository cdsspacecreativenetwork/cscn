'use client';

import React from 'react';
import Image from 'next/image';
import { File as FileIcon, Repeat2, Star, Globe, GraduationCap, MoreVertical, Pencil, Trash2, Copy, Download, ExternalLink, Share2 } from 'lucide-react';
import { Resource } from '@/lib/resourceService';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onEdit || onDelete || onDuplicate) {
      e.preventDefault();
      setIsMenuOpen(true);
    }
  };

  const getTheme = () => {
    switch (resource.type) {
      case 'PDF':
        return {
          badgeBg: 'bg-[#EEF3FF]',
          badgeText: 'text-[#1C4ED1]',
          icon: '/assets/dashboard/pdf-01.svg',
        };
      case 'LINK':
        return {
          badgeBg: 'bg-[#EEF3FF]',
          badgeText: 'text-[#1C4ED1]',
          icon: '/assets/dashboard/user/arrow-up-right-03.svg',
        };
      case 'FILE':
        return {
          badgeBg: 'bg-[#EFF6FF]',
          badgeText: 'text-[#1C4ED1]',
          icon: '/assets/dashboard/attachment-circle.svg',
        };
      default:
        return {
          badgeBg: 'bg-[#F4F6FB]',
          badgeText: 'text-[#4B5563]',
          icon: null,
        };
    }
  };

  const theme = getTheme();
  const isGeneral = resource.isStandalone || resource.courseTitle === 'General Resource';

  return (
    <Card
      onContextMenu={handleContextMenu}
      className="gap-5 px-6 md:px-8 [--card-spacing:24px] md:[--card-spacing:32px] transition-all hover:border-[#1C4ED1]/30 group h-full relative select-none"
    >
      {/* Optional Thumbnail Image Header */}
      {resource.thumbnail && (
        <div className="relative w-full h-48 rounded-[10px] overflow-hidden bg-[#F4F6FB] -mt-2 mb-2">
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Top Header Row: Icon/Thumbnail avatar + Bookmark / Actions */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="w-12 h-12 rounded-[8px] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative"
          style={{ backgroundColor: 'rgba(28, 78, 209, 0.04)' }}
        >
          {theme.icon ? (
            <div className="relative w-6 h-6">
              <Image
                src={theme.icon}
                alt=""
                fill
                className="object-contain"
                style={{
                  filter:
                    'invert(24%) sepia(91%) saturate(2333%) hue-rotate(218deg) brightness(91%) contrast(92%)',
                }}
              />
            </div>
          ) : (
            <div className="text-[#1C4ED1]">
              <FileIcon size={24} />
            </div>
          )}
        </div>

        {/* Bookmark Action & Scope Pills */}
        <div className="flex items-center gap-2">
          {resource.isFree !== undefined && (
            <span
              className={`px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold tracking-tight ${
                resource.isFree
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/60'
              }`}
            >
              {resource.isFree ? 'Free' : `Paid ${resource.price ? `(₦${resource.price.toLocaleString()})` : ''}`}
            </span>
          )}

          {!isGeneral && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#EEF3FF] text-[#1C4ED1] text-[11px] font-bold tracking-tight">
              <GraduationCap size={12} /> Course Linked
            </span>
          )}

          {onToggleBookmark && (
            <button
              type="button"
              onClick={() => onToggleBookmark(resource.id)}
              className="p-1.5 rounded-full hover:bg-[#F4F6FB] text-[#9CA3AF] hover:text-amber-500 transition-colors"
              title={isBookmarked ? 'Remove bookmark' : 'Save resource'}
            >
              <Star
                size={18}
                className={isBookmarked ? 'fill-amber-400 text-amber-400' : ''}
              />
            </button>
          )}

          {/* 3-Dot Options Context Menu for Instructors */}
          {(onEdit || onDelete || onDuplicate) && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-full hover:bg-[#F4F6FB] text-[#9CA3AF] hover:text-[#040B37] transition-colors"
                title="Options"
              >
                <MoreVertical size={18} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-20 w-60 bg-white border border-[#E3E8F4] rounded-[14px] shadow-[0_12px_38px_rgba(4,11,55,0.09)] py-2 font-jakarta animate-fadeIn">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onEdit(resource);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#040B37] hover:bg-[#F4F6FB] flex items-center gap-2.5 transition-colors"
                    >
                      <Pencil size={14} className="text-[#1C4ED1]" />
                      Edit Resource
                    </button>
                  )}
                  {onDuplicate && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDuplicate(resource.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#040B37] hover:bg-[#F4F6FB] flex items-center gap-2.5 transition-colors border-t border-[#E3E8F4]/40"
                    >
                      <Copy size={14} className="text-[#1C4ED1]" />
                      Duplicate Resource
                    </button>
                  )}
                  
                  {/* Download / Open Action */}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#040B37] hover:bg-[#F4F6FB] flex items-center gap-2.5 transition-colors border-t border-[#E3E8F4]/40"
                  >
                    {resource.type === 'LINK' ? (
                      <>
                        <ExternalLink size={14} className="text-[#1C4ED1]" />
                        <span>Open Link</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} className="text-[#1C4ED1]" />
                        <span>Download File</span>
                      </>
                    )}
                  </a>

                  {/* Copy Link Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      const link = window.location.origin + '/resources/' + resource.slug;
                      navigator.clipboard.writeText(link);
                      toast.success("Public resource link copied to clipboard!");
                    }}
                    className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#040B37] hover:bg-[#F4F6FB] flex items-center gap-2.5 transition-colors border-t border-[#E3E8F4]/40"
                  >
                    <Share2 size={14} className="text-[#1C4ED1]" />
                    Copy Share Link
                  </button>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(resource.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors border-t border-[#E3E8F4]/40"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Title, Course & Description */}
      <div className="flex flex-col gap-1.5 flex-1">
        <h4 className="text-[18px] font-bold text-[#040B37] leading-tight group-hover:text-[#1C4ED1] transition-colors tracking-tight font-jakarta line-clamp-2">
          {resource.title}
        </h4>
        <span className="text-[14px] font-medium text-[#9CA3AF] tracking-tight">
          {resource.courseTitle}
        </span>
        {resource.description && (
          <p className="text-[13px] text-[#6B7280] line-clamp-2 mt-1">
            {resource.description}
          </p>
        )}
      </div>

      {/* Metadata Row: Badge & Size / Usage */}
      <div className="flex items-center justify-between pt-2">
        <span
          className={`px-3 py-1 rounded-[8px] text-[12px] font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}
        >
          {resource.type === 'LINK' ? 'Link' : resource.type}
        </span>

        {resource.scope === 'instructor' && typeof resource.usageCount === 'number' ? (
          <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#F4F6FB] px-2.5 py-1 text-[12px] font-bold text-[#1C4ED1]">
            <Repeat2 size={13} />
            {resource.usageCount} {resource.usageCount === 1 ? 'lesson' : 'lessons'}
          </span>
        ) : (
          resource.size && (
            <span className="text-[13px] font-medium text-[#9CA3AF] tracking-tight">
              {resource.size}
            </span>
          )
        )}
      </div>

      {/* Bottom: Action Area */}
      <div className="pt-2 border-t border-[#E3E8F4]">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-[#1C4ED1] hover:text-[#040B37] transition-all group/btn outline-none font-semibold text-[16px]"
        >
          {resource.type === 'LINK' ? (
            <>
              <div className="relative w-5 h-5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
                <Image
                  src="/assets/dashboard/user/arrow-up-right-03.svg"
                  alt=""
                  fill
                  className="brightness-0"
                  style={{
                    filter:
                      'invert(24%) sepia(91%) saturate(2333%) hue-rotate(218deg) brightness(91%) contrast(92%)',
                  }}
                />
              </div>
              <span>Open Link</span>
            </>
          ) : (
            <>
              <div className="relative w-5 h-5 transition-transform group-hover/btn:translate-y-0.5">
                <Image
                  src="/assets/dashboard/download-circle-01.svg"
                  alt=""
                  fill
                  className="brightness-0"
                  style={{
                    filter:
                      'invert(24%) sepia(91%) saturate(2333%) hue-rotate(218deg) brightness(91%) contrast(92%)',
                  }}
                />
              </div>
              <span>Download File</span>
            </>
          )}
        </a>
      </div>
    </Card>
  );
};

export const ResourceCardSkeleton = () => (
  <Card className="gap-6 px-6 md:px-8 [--card-spacing:24px] md:[--card-spacing:32px] animate-pulse h-full">
    <div className="w-12 h-12 rounded-[8px] bg-[#F4F6FB]" />
    <div className="flex-1 space-y-3">
      <div className="h-5 bg-[#F4F6FB] rounded-md w-3/4" />
      <div className="h-4 bg-[#F4F6FB] rounded-md w-1/2" />
    </div>
    <div className="flex items-center justify-between">
      <div className="w-16 h-7 bg-[#F4F6FB] rounded-[8px]" />
      <div className="w-12 h-4 bg-[#F4F6FB] rounded-md" />
    </div>
    <div className="h-6 bg-[#F4F6FB] rounded-md w-24 mt-2" />
  </Card>
);
