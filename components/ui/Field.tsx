import * as React from 'react';

import { cn } from '@/lib/utils';

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="field-group" className={cn('grid gap-5', className)} {...props} />
  )
);
FieldGroup.displayName = 'FieldGroup';

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field"
      className={cn('grid gap-2 data-[invalid=true]:text-red-700', className)}
      {...props}
    />
  )
);
Field.displayName = 'Field';

const FieldLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      data-slot="field-label"
      className={cn('font-inter text-sm font-semibold text-navy', className)}
      {...props}
    />
  )
);
FieldLabel.displayName = 'FieldLabel';

const FieldDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="field-description"
      className={cn('font-inter text-xs font-medium leading-5 text-text-mute', className)}
      {...props}
    />
  )
);
FieldDescription.displayName = 'FieldDescription';

const FieldError = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      role="alert"
      data-slot="field-error"
      className={cn('font-inter text-xs font-semibold text-red-700', className)}
      {...props}
    />
  )
);
FieldError.displayName = 'FieldError';

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel };
