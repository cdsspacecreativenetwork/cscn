'use client';

import React from 'react';

interface SettingsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({ checked, onChange }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-[48px] h-[27px] rounded-[13.5px] p-[2.25px] transition-all duration-200 ease-in-out focus:outline-none cursor-pointer ${
        checked ? 'bg-[#1C4ED1]' : 'bg-[#DFE1E7]'
      }`}
    >
      <div
        className={`w-[22.5px] h-[22.5px] bg-[#F8FAFB] rounded-full shadow-[0px_1.125px_2.25px_0px_rgba(16,24,40,0.06),0px_1.125px_3.375px_0px_rgba(16,24,40,0.1)] transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-[21px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
