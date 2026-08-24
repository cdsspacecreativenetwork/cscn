'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Search,
  X,
  LayoutDashboard,
  User,
  Settings,
  FolderOpen,
  BookOpen,
  BookPlus,
  CalendarDays,
  ClipboardList,
  Library,
  BarChart2,
  CreditCard,
  Video,
  Handshake,
  ShieldCheck,
  FileClock,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Pages' | 'Student' | 'Instructor' | 'Admin' | 'Quick Actions';
  href?: string;
  action?: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: string[];
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRole = (session?.user?.role as string) || 'STUDENT';

  // All Command Items using exact 1-to-1 matching sidebar icons
  const allItems: CommandItem[] = [
    // General Pages
    { id: 'nav-dashboard', title: 'Dashboard Home', subtitle: 'Overview & recent updates', category: 'Pages', href: '/dashboard', icon: LayoutDashboard },
    { id: 'nav-profile', title: 'User Profile', subtitle: 'View and edit profile details', category: 'Pages', href: '/dashboard/profile', icon: User },
    { id: 'nav-settings', title: 'Account Settings', subtitle: 'Security, payouts, notifications', category: 'Pages', href: '/dashboard/settings', icon: Settings },
    { id: 'nav-[#resources]', title: 'Public Resources Marketplace', subtitle: 'Browse free & paid resources', category: 'Pages', href: '/resources', icon: FolderOpen },

    // Student Tools
    { id: 'student-courses', title: 'My Enrolled Courses', subtitle: 'Continue learning', category: 'Student', href: '/dashboard/courses', icon: BookOpen },
    { id: 'student-progress', title: 'Learning Progress', subtitle: 'View completion statistics', category: 'Student', href: '/dashboard/progress', icon: ClipboardList },
    { id: 'student-resources', title: 'Course Resources', subtitle: 'Saved files & links', category: 'Student', href: '/dashboard/resources', icon: Library },
    { id: 'student-schedule', title: 'Schedule & Reminders', subtitle: 'Upcoming live sessions & deadlines', category: 'Student', href: '/dashboard/schedule', icon: CalendarDays },

    // Instructor Tools
    { id: 'inst-courses', title: 'My Created Courses', subtitle: 'Manage curriculum & lessons', category: 'Instructor', href: '/dashboard/instructor/courses', icon: BookPlus, roles: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'inst-analytics', title: 'Course Analytics', subtitle: 'Student engagement & metrics', category: 'Instructor', href: '/dashboard/instructor/analytics', icon: BarChart2, roles: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'inst-earnings', title: 'Earnings & Payouts', subtitle: 'Revenue, sales & bank setup', category: 'Instructor', href: '/dashboard/instructor/earnings', icon: CreditCard, roles: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'inst-live', title: 'Live Sessions', subtitle: 'Schedule & host live streams', category: 'Instructor', href: '/dashboard/instructor/live-sessions', icon: Video, roles: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'inst-mentorship', title: 'Mentorship Bookings', subtitle: '1-on-1 sessions & slots', category: 'Instructor', href: '/dashboard/instructor/mentorship', icon: Handshake, roles: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] },

    // Admin Tools
    { id: 'admin-users', title: 'User Management', subtitle: 'Manage accounts & permissions', category: 'Admin', href: '/admin/users', icon: ShieldCheck, roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'admin-audit', title: 'Audit Logs', subtitle: 'Track platform activities & changes', category: 'Admin', href: '/dashboard/admin/audit-logs', icon: FileClock, roles: ['ADMIN', 'SUPER_ADMIN'] },

    // Quick Actions
    { id: 'act-new-course', title: 'Create New Course', subtitle: 'Draft a new learning module', category: 'Quick Actions', href: '/dashboard/instructor/courses', icon: PlusCircle, roles: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'act-upload-resource', title: 'Upload Marketplace Resource', subtitle: 'Share a PDF, link or asset', category: 'Quick Actions', href: '/dashboard/resources', icon: PlusCircle, roles: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] },
  ];

  // Filter items based on user role and search query
  const filteredItems = allItems.filter((item) => {
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-scroll highlighted item into view during keyboard navigation
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeItem = (item: CommandItem) => {
    onClose();
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalNode = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 md:pt-24 px-4 bg-[#040B37]/50 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Command Box */}
      <div className="relative w-full max-w-3xl bg-white rounded-[20px] border border-[#E3E8F4] shadow-[0_25px_60px_rgba(4,11,55,0.22)] overflow-hidden font-jakarta flex flex-col max-h-[80vh]">
        {/* Header Search Input */}
        <div className="relative flex items-center border-b border-[#E3E8F4] px-5 py-4 bg-white shrink-0">
          <Search size={22} className="text-[#1C4ED1] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search dashboard features..."
            className="w-full pl-3 pr-10 text-[16px] font-semibold text-[#040B37] placeholder:text-[#9CA3AF] bg-transparent outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#040B37] hover:bg-[#F4F6FB] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List - Custom Dashboard Scrollbar */}
        <div className="overflow-y-auto custom-scrollbar p-3 space-y-1 divide-y divide-[#E3E8F4]/40">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-4 py-3 rounded-[12px] cursor-pointer transition-all ${
                    isSelected ? 'bg-[#EEF3FF] text-[#1C4ED1]' : 'hover:bg-[#F8FAFC] text-[#040B37]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold tracking-tight truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-[5px] ${
                            isSelected
                              ? 'bg-[#1C4ED1]/15 text-[#1C4ED1]'
                              : 'bg-[#F4F6FB] text-[#9CA3AF]'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p
                          className={`text-[12px] truncate font-medium ${
                            isSelected ? 'text-[#1C4ED1]/80' : 'text-[#6B7280]'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    size={16}
                    className={`shrink-0 transition-transform ${
                      isSelected ? 'translate-x-0.5 text-[#1C4ED1]' : 'opacity-0'
                    }`}
                  />
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F4F6FB] flex items-center justify-center mx-auto mb-3 text-[#9CA3AF]">
                <Search size={22} />
              </div>
              <p className="text-[15px] font-bold text-[#040B37]">No matching features found</p>
              <p className="text-[13px] text-[#9CA3AF] mt-0.5">{'Try searching for "courses", "earnings", or "settings"'}</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="border-t border-[#E3E8F4] bg-[#F8FAFC] px-5 py-3 flex items-center justify-between text-[12px] font-semibold text-[#9CA3AF] shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E3E8F4] rounded-[4px] shadow-2xs font-mono text-[10px] text-[#040B37]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E3E8F4] rounded-[4px] shadow-2xs font-mono text-[10px] text-[#040B37]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E3E8F4] rounded-[4px] shadow-2xs font-mono text-[10px] text-[#040B37]">esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
