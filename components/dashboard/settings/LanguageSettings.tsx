'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const DropdownSetting = ({ 
  label, 
  value,
  options,
  onSelect
}: { 
  label: string; 
  value: string;
  options: string[];
  onSelect: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`flex flex-col gap-4 py-6 px-6 md:px-8 relative group ${isOpen ? 'z-[60]' : 'z-10'}`}>
      <label className="text-[14px] md:text-[16px] font-semibold text-[#4B5563] tracking-tight">
        {label}
      </label>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white border border-[#E3E8F4] rounded-[16px] px-6 h-[56px] text-[15px] md:text-[18px] text-[#040B37] font-medium outline-none hover:border-[#1C4ED1] transition-all cursor-pointer ${isOpen ? 'border-[#1C4ED1] ring-4 ring-[#1C4ED1]/5' : ''}`}
        >
          <span>{value}</span>
          <div className={`relative w-6 h-6 flex items-center justify-center transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
             <Image 
               src="/assets/dashboard/user/Vector-1.svg"
               alt="dropdown" 
               width={12} 
               height={6} 
               className="opacity-60 group-hover:opacity-100 transition-opacity"
             />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-[#E3E8F4] rounded-[16px] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-6 py-4 text-[15px] md:text-[16px] font-medium transition-colors hover:bg-[#F4F6FB] ${option === value ? 'text-[#1C4ED1] bg-[#1C4ED1]/5' : 'text-[#4B5563]'}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Backdrop for closing dropdown */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export const LanguageSettings = () => {
  const [language, setLanguage] = useState("English (UK)");
  const [timezone, setTimezone] = useState("GMT +00:00 London");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  return (
    <div className="flex-1 bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm">
      {/* Section Header */}
      <div className="bg-white border-b border-[#E3E8F4] px-6 py-5 md:px-8 rounded-t-[16px]">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight font-jakarta">
          Language & Region
        </h3>
      </div>

      {/* Language Options */}
      <div className="flex flex-col">
        <DropdownSetting 
          label="Interface Language" 
          value={language} 
          options={["English (UK)", "English (US)", "French", "German", "Spanish"]}
          onSelect={setLanguage}
        />
        <DropdownSetting 
          label="Timezone" 
          value={timezone} 
          options={["GMT +00:00 London", "GMT +01:00 Paris", "GMT -05:00 New York", "GMT +08:00 Singapore"]}
          onSelect={setTimezone}
        />
        <DropdownSetting 
          label="Date Format" 
          value={dateFormat} 
          options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]}
          onSelect={setDateFormat}
        />
      </div>
    </div>
  );
};
