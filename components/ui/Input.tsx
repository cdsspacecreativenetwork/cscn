import * as React from 'react';

import { cn } from '@/lib/utils';

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: 'default' | 'compact';
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = 'default', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'cscn-form-control w-full',
        size === 'compact' && 'cscn-form-control-compact',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
export type { InputProps };
