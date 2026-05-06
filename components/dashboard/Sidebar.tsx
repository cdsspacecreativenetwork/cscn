'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Library, 
  CreditCard, 
  User, 
  Settings,
  LogOut,
  X
} from 'lucide-react';

const mainNavItems = [
  { name: 'Overview', href: '/dashboard', icon: '/assets/dashboard/user/dashboard-square-03.svg' },
  { name: 'My Courses', href: '/dashboard/courses', icon: '/assets/dashboard/user/book-open-text.svg' },
  { name: 'Schedule', href: '/dashboard/schedule', icon: '/assets/dashboard/user/calendar-02.svg' },
  { name: 'My Progress', href: '/dashboard/progress', icon: '/assets/dashboard/user/progress.svg' },
  { name: 'Resources', href: '/dashboard/resources', icon: '/assets/dashboard/user/library.svg' },
];

const accountNavItems = [
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: '/assets/dashboard/user/payment-02.svg' },
  { name: 'Profile', href: '/dashboard/profile', icon: '/assets/dashboard/user/user.svg' },
  { name: 'Settings', href: '/dashboard/settings', icon: '/assets/dashboard/user/setting-07.svg' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-[70] w-[clamp(280px,80vw,300px)] lg:w-[clamp(240px,17.07vw,295px)] 
        bg-white border-r border-[#E3E8F4] flex flex-col h-screen overflow-hidden transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo Area - Fluid Scaling */}
      <div className="h-[96px] lg:h-[clamp(72px,5.56vw,96px)] flex items-center justify-between px-[clamp(24px,1.85vw,32px)] border-b border-[#E3E8F4] shrink-0">
        <div className="bg-[#D7EAFF] p-[clamp(4px,0.5vw,8px)] rounded-sm">
          <Image 
            src="/assets/dashboard/user/Group 162.svg" 
            alt="CSCN Logo" 
            width={32} 
            height={32} 
            className="w-[clamp(24px,1.85vw,32px)] h-[clamp(24px,1.85vw,32px)] object-contain" 
          />
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-[#9CA3AF] hover:text-[#040B37] transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-[clamp(16px,1.85vw,32px)] px-[clamp(16px,1.85vw,32px)] space-y-[clamp(24px,2.5vw,40px)]">
        {/* Main Section */}
        <div className="space-y-[clamp(4px,0.46vw,8px)]">
          <p className="px-[clamp(12px,0.92vw,16px)] py-[clamp(6px,0.46vw,8px)] text-[#9CA3AF] text-[clamp(14px,0.92vw,16px)] font-semibold uppercase tracking-wider">Main</p>
          <nav className="space-y-[clamp(2px,0.23vw,4px)]">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)] rounded-lg transition-all ${
                    isActive 
                      ? 'bg-[#1C4ED1]/5 border-l-2 border-[#1C4ED1] text-[#1C4ED1]' 
                      : 'text-[#4B5563] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <div 
                    className="relative shrink-0" 
                    style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
                  >
                    <Image 
                      src={item.icon} 
                      alt="" 
                      fill 
                      className={`object-contain transition-all ${isActive ? 'brightness-100' : 'brightness-0 opacity-40'}`} 
                    />
                  </div>
                  <span className="text-[clamp(14px,0.92vw,16px)] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Account Section */}
        <div className="space-y-[clamp(4px,0.46vw,8px)]">
          <p className="px-[clamp(12px,0.92vw,16px)] py-[clamp(6px,0.46vw,8px)] text-[#9CA3AF] text-[clamp(14px,0.92vw,16px)] font-semibold uppercase tracking-wider">Account</p>
          <nav className="space-y-[clamp(2px,0.23vw,4px)]">
            {accountNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)] rounded-lg transition-all ${
                    isActive 
                      ? 'bg-[#1C4ED1]/5 border-l-2 border-[#1C4ED1] text-[#1C4ED1]' 
                      : 'text-[#4B5563] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <div 
                    className="relative shrink-0" 
                    style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }}
                  >
                    <Image 
                      src={item.icon} 
                      alt="" 
                      fill 
                      className={`object-contain transition-all ${isActive ? 'brightness-100' : 'brightness-0 opacity-40'}`} 
                    />
                  </div>
                  <span className="text-[clamp(14px,0.92vw,16px)] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Logout */}
      <div className="p-[clamp(16px,1.38vw,24px)] border-t border-[#E3E8F4]">
        <button className="flex items-center gap-[clamp(8px,0.69vw,12px)] px-[clamp(12px,0.92vw,16px)] py-[clamp(8px,0.69vw,12px)] w-full text-[#EF4444] hover:bg-red-50 rounded-lg transition-all">
          <LogOut size={18} style={{ width: 'clamp(16px, 1.15vw, 20px)', height: 'clamp(16px, 1.15vw, 20px)' }} />
          <span className="text-[clamp(14px,0.92vw,16px)] font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
