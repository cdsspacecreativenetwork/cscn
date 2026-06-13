"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  variant?: "default" | "role";
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option",
  disabled = false,
  className = "",
  triggerClassName = "",
  variant = "default",
  searchable = false,
  searchPlaceholder = "Search options",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={`relative min-w-[140px] ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-[40px] px-4 flex items-center justify-between gap-2 
          rounded-[10px] border-[1.5px] transition-all duration-200 outline-none
          ${isOpen ? "border-[#1C4ED1] ring-2 ring-[#1C4ED1]/10 bg-white" : "border-[#E3E8F4] bg-white hover:border-[#1C4ED1]"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${triggerClassName}
        `}
      >
        <span className="text-[14px] font-semibold text-[#040B37] truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`text-[#9CA3AF] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#1C4ED1]" : ""}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {mounted && createPortal(
        <AnimatePresence>
        {isOpen && menuRect && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width + 10 }}
            className="fixed z-[9999] bg-white border border-[#E3E8F4] rounded-[12px] shadow-[0px_18px_48px_-12px_rgba(4,11,55,0.22)] overflow-hidden py-1.5"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-[#E3E8F4] px-3 py-2">
                <Search size={16} className="text-[#9CA3AF]" strokeWidth={1.9} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#040B37] outline-none placeholder:text-[#9CA3AF]"
                />
              </div>
            )}

            <div className="max-h-[320px] overflow-y-auto p-1.5 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors rounded-[10px]
                      ${option.disabled ? "cursor-not-allowed opacity-40" : ""}
                      ${value === option.value 
                        ? "bg-[#1C4ED1]/5 text-[#1C4ED1]" 
                        : "text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]"}
                    `}
                  >
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="text-[14px] font-medium leading-snug">
                      {option.label}
                    </span>
                    {value === option.value && (
                      <motion.div 
                        layoutId="active-tick"
                        className="ml-auto w-1.5 h-1.5 shrink-0 rounded-full bg-[#1C4ED1]"
                      />
                    )}
                  </button>
                ))
              ) : (
                <p className="px-4 py-5 text-center text-[13px] font-semibold text-[#9CA3AF]">
                  No options found.
                </p>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
