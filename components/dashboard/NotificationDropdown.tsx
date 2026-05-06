'use client';

import React from 'react';

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  emoji: string;
  isRead: boolean;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  isOpen: boolean;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  notifications, 
  onMarkAllAsRead,
  isOpen 
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-[calc(100%+12px)] right-0 w-[clamp(300px,19.33vw,334px)] bg-white border border-[#E3E8F4] rounded-[12px] shadow-[6px_4px_4px_2px_rgba(195,196,246,0.15)] overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="h-[clamp(56px,3.7vw,64px)] px-[clamp(18px,1.33vw,24px)] flex items-center justify-between border-b border-[#E3E8F4]">
        <h3 className="text-[clamp(14px,0.92vw,16px)] font-semibold text-[#040B37]">Notifications</h3>
        <button 
          onClick={onMarkAllAsRead}
          className="text-[clamp(11px,0.69vw,12px)] font-medium text-[#1C4ED1] hover:underline transition-all"
        >
          Mark all as read
        </button>
      </div>

      {/* List */}
      <div className="max-h-[clamp(320px,23vw,400px)] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-[clamp(12px,0.92vw,16px)] pr-[clamp(18px,1.33vw,24px)] flex items-start gap-[clamp(12px,0.92vw,16px)] transition-colors hover:bg-[#F4F6FB]/50 cursor-pointer relative group ${!notif.isRead ? 'bg-[#1C4ED1]/[0.02]' : ''}`}
            >
              {/* Unread Indicator Dot */}
              {!notif.isRead && (
                <div className="absolute left-[clamp(6px,0.46vw,8px)] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C4ED1] rounded-full shrink-0" />
              )}
              
              {/* Icon */}
              <div className="w-[clamp(32px,2.31vw,40px)] h-[clamp(32px,2.31vw,40px)] bg-[#F4F6FB] rounded-[12px] flex items-center justify-center text-[clamp(14px,0.92vw,16px)] shrink-0">
                {notif.emoji}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <p className={`text-[clamp(12px,0.81vw,14px)] leading-tight ${!notif.isRead ? 'text-[#040B37] font-semibold' : 'text-[#4B5563] font-medium'}`}>
                  {notif.title}
                </p>
                <p className="text-[clamp(8px,0.46vw,10px)] text-[#9CA3AF]">
                  {notif.time}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-[#9CA3AF] text-[14px]">
            No new notifications
          </div>
        )}
      </div>
    </div>
  );
};
