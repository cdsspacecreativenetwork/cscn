"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "role";
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option",
  disabled = false,
  className = "",
  variant = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] mt-2 w-full bg-white border border-[#E3E8F4] rounded-[12px] shadow-[0px_10px_40px_-10px_rgba(4,11,55,0.1)] overflow-hidden py-1.5"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors
                  ${value === option.value 
                    ? "bg-[#1C4ED1]/5 text-[#1C4ED1]" 
                    : "text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]"}
                `}
              >
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="text-[14px] font-medium leading-none">
                  {option.label}
                </span>
                {value === option.value && (
                  <motion.div 
                    layoutId="active-tick"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1C4ED1]"
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
