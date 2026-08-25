'use client';

import React from 'react';

import { NativeSelect } from '@/components/ui/NativeSelect';

interface SelectInputProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'default' | 'compact';
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
  const normalizedSize = size === 'sm' || size === 'compact' ? 'compact' : 'default';

  const select = (
    <NativeSelect size={normalizedSize} aria-invalid={Boolean(error)} className={className} {...props}>
        {children}
    </NativeSelect>
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
