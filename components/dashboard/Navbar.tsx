'use client';

import React from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import Image from 'next/image';
import { NotificationDropdown, NotificationItem } from './NotificationDropdown';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: '1',
      title: 'New AI Tools module added to the Web Dev course',
      time: 'Today, 10:00 AM',
      emoji: '📢',
      isRead: false,
    },
    {
      id: '2',
      title: 'Pro members get 30% off on certification exams this week',
      time: 'Yesterday',
      emoji: '🎁',
      isRead: false,
    },
    {
      id: '3',
      title: 'Live Q&A with Product team April 20 at 3PM GMT',
      time: '2 days ago',
      emoji: '📅',
      isRead: true,
    },
    {
      id: '4',
      title: 'Assignment deadline: Research Methods for beginners',
      time: '3 days ago',
      emoji: '📅',
      isRead: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <header className="h-[clamp(72px,5.56vw,96px)] bg-white border-b border-[#E3E8F4] flex items-center justify-between px-[clamp(16px,1.85vw,32px)] sticky top-0 z-40 shrink-0">
      {/* Click-outside backdrop for notifications */}
      {isNotificationsOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsNotificationsOpen(false)}
        />
      )}

      {/* Left Area: Menu Toggle (Mobile) + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#4B5563] hover:bg-[#F4F6FB] rounded-lg transition-all shrink-0"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar - Fluid Width */}
        <div className="relative w-[clamp(200px,26.68vw,461px)] group">
          <div className="absolute left-[clamp(12px,0.92vw,16px)] top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#1C4ED1] transition-colors">
            <Search size={20} style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }} />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-[clamp(44px,3.24vw,56px)] pl-[clamp(40px,2.78vw,48px)] pr-[clamp(12px,0.92vw,16px)] bg-[#F4F6FB] border border-[#E3E8F4] rounded-full text-[clamp(14px,0.92vw,16px)] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] transition-all"
          />
        </div>
      </div>

      {/* User Actions - Fluid Spacing */}
      <div className="flex items-center gap-[clamp(16px,1.39vw,24px)] relative z-40">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`w-[clamp(44px,3.24vw,56px)] h-[clamp(44px,3.24vw,56px)] flex items-center justify-center border border-[#E3E8F4] rounded-[12px] text-[#4B5563] transition-all relative ${isNotificationsOpen ? 'bg-[#F4F6FB]' : 'hover:bg-[#F4F6FB]'}`}
          >
            <Bell size={24} style={{ width: 'clamp(20px, 1.39vw, 24px)', height: 'clamp(20px, 1.39vw, 24px)' }} />
            {unreadCount > 0 && (
              <span className="absolute top-[30%] right-[30%] w-[clamp(6px,0.46vw,8px)] h-[clamp(6px,0.46vw,8px)] bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <NotificationDropdown 
            notifications={notifications} 
            isOpen={isNotificationsOpen} 
            onMarkAllAsRead={markAllAsRead} 
          />
        </div>

        {/* Divider */}
        <div className="w-[1px] h-[clamp(32px,2.78vw,48px)] bg-[#E3E8F4]"></div>

        {/* Profile */}
        <div className="flex items-center gap-[clamp(8px,0.69vw,12px)] pl-[clamp(8px,0.46vw,12px)] cursor-pointer group">
          <div className="w-[clamp(36px,2.55vw,44px)] h-[clamp(36px,2.55vw,44px)] rounded-full overflow-hidden border-2 border-[#1C4ED1] shrink-0">
            <Image 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Chris" 
              alt="User" 
              width={44} 
              height={44} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[clamp(14px,1.04vw,18px)] font-semibold text-[#040B37] whitespace-nowrap">Chris John</span>
            <span className="text-[clamp(11px,0.81vw,14px)] text-[#4B5563]">Admin</span>
          </div>
          <ChevronDown size={20} className="text-[#9CA3AF] group-hover:text-[#040B37] transition-all" style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }} />
        </div>
      </div>
    </header>
  );
};
