import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-full border border-[#E3E8F4] bg-white px-5 py-3 text-[15px] text-[#040B37] font-medium tracking-tight placeholder:text-[#9CA3AF]/80 placeholder:font-normal shadow-2xs transition-all outline-none focus:outline-none focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
