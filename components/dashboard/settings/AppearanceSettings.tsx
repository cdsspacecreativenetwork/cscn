'use client';

import React, { useState } from 'react';

const AppearanceRow = ({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) => (
  <div className="h-[80px] flex items-center justify-between px-6 md:px-8 border-b border-[#E3E8F4] last:border-0 relative overflow-hidden group hover:bg-[#F4F6FB]/30 transition-colors">
    <div className="flex flex-col gap-1 z-10">
      <h4 className="text-[16px] font-medium text-[#4B5563] tracking-tight leading-tight">
        {title}
      </h4>
      <p className="text-[12px] font-medium text-[#9CA3AF] tracking-tight leading-tight">
        {description}
      </p>
    </div>
    <div className="flex items-center gap-4 z-10">
      {children}
    </div>
  </div>
);

const SegmentedControl = ({ 
  options, 
  selected, 
  onChange 
}: { 
  options: string[]; 
  selected: string; 
  onChange: (val: string) => void;
}) => (
  <div className="flex bg-[#F4F6FB] p-1 rounded-[12px] border border-[#E3E8F4]">
    {options.map((option) => (
      <button
        key={option}
        onClick={() => onChange(option)}
        className={`px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer ${
          selected === option 
            ? 'bg-white text-[#1C4ED1] shadow-sm' 
            : 'text-[#9CA3AF] hover:text-[#4B5563]'
        }`}
      >
        {option}
      </button>
    ))}
  </div>
);

export const AppearanceSettings = () => {
  const [accentColor, setAccentColor] = useState('#1C4ED1');
  const [themeMode, setThemeMode] = useState('Light');
  const [borderRadius, setBorderRadius] = useState('Rounded');
  const [fontFamily, setFontFamily] = useState('Modern');
  const [density, setDensity] = useState('Standard');

  const accentColors = [
    { name: 'Blue', value: '#1C4ED1' },
    { name: 'Purple', value: '#9747FF' },
    { name: 'Green', value: '#1CB247' },
    { name: 'Orange', value: '#FF5C10' },
    { name: 'Pink', value: '#F10E93' },
  ];

  return (
    <div className="flex-1 bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm font-jakarta">
      {/* Section Header - Exactly 64px high */}
      <div className="h-[64px] flex items-center px-6 md:px-8 border-b border-[#E3E8F4] rounded-t-[16px]">
        <h3 className="text-[16px] font-semibold text-[#040B37] tracking-tight">
          Appearance
        </h3>
      </div>

      <div className="flex flex-col">
        {/* 1. Accent Color - Row exactly 80px high */}
        <AppearanceRow 
          title="Accent Color" 
          description="Choose your preferred color theme"
        >
          <div className="flex items-center gap-4">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={`w-6 h-6 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center border ${
                  accentColor === color.value 
                    ? 'border-[#000000] ring-2 ring-[#000000]/10' 
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </AppearanceRow>
      </div>
    </div>
  );
};
