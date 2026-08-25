import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type NativeSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  size?: 'default' | 'compact';
};

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, size = 'default', ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        data-slot="native-select"
        className={cn(
          'cscn-form-control w-full appearance-none pr-11',
          size === 'compact' && 'cscn-form-control-compact',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-mute" />
    </div>
  )
);
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
export type { NativeSelectProps };
