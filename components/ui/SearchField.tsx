import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
  compact?: boolean;
  size?: 'default' | 'compact';
};

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, containerClassName, compact = false, size = 'default', ...props }, ref) => {
    const isCompact = compact || size === 'compact';
    return (
    <div
      data-slot="input-group"
      className={cn(
        'relative flex w-full items-center rounded-[14px] border border-stroke-ii bg-white transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/5',
        isCompact ? 'min-h-10' : 'min-h-12',
        containerClassName
      )}
    >
      <input
        ref={ref}
        type="search"
        data-slot="input-group-control"
        className={cn(
          'peer min-w-0 flex-1 bg-transparent pl-11 pr-4 font-inter font-medium text-navy outline-none placeholder:text-text-mute disabled:cursor-not-allowed disabled:opacity-50',
          isCompact ? 'h-10 text-[13px]' : 'h-12 text-sm',
          className
        )}
        {...props}
      />
      <span
        data-slot="input-group-addon"
        className="pointer-events-none absolute left-4 flex text-text-mute transition-colors peer-focus:text-primary"
      >
        <Search aria-hidden="true" className={isCompact ? 'size-4' : 'size-5'} />
      </span>
    </div>
    );
  }
);
SearchField.displayName = 'SearchField';

export { SearchField };
export default SearchField;
