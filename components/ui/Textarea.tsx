import * as React from 'react';

import { cn } from '@/lib/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: 'default' | 'compact';
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = 'default', ...props }, ref) => (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'cscn-form-control min-h-24 w-full resize-y py-3 leading-6',
        size === 'compact' && 'cscn-form-control-compact min-h-20 py-2.5',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };
