'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectInputProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md';
}

export default function SelectInput({
  label,
  hint,
  error,
  size = 'md',
  className = '',
  children,
  ...props
}: SelectInputProps) {
  const base =
    size === 'sm'
      ? 'w-full appearance-none px-3 py-1.5 pr-8 border rounded-lg text-xs font-medium text-navy bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      : 'w-full appearance-none px-4 py-2.5 pr-10 border rounded-xl text-sm font-medium text-navy bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const iconSize = size === 'sm' ? 14 : 16;
  const iconRight = size === 'sm' ? 'right-2.5' : 'right-3';
  const borderCls = error ? 'border-red-400' : 'border-stroke';

  const select = (
    <div className="relative">
      <select className={`${base} ${borderCls} ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown
        size={iconSize}
        className={`absolute ${iconRight} top-1/2 -translate-y-1/2 pointer-events-none text-text-mute`}
      />
    </div>
  );

  if (!label && !hint && !error) return select;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-navy">{label}</label>}
      {hint && <p className="text-xs text-text-mute -mt-0.5">{hint}</p>}
      {select}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
