import * as React from 'react';

import { cn } from '@/lib/utils';

const EmptyState = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty"
      className={cn(
        'flex flex-col items-center justify-center rounded-[18px] border border-dashed border-stroke-ii bg-white px-6 py-14 text-center',
        className
      )}
      {...props}
    />
  )
);
EmptyState.displayName = 'EmptyState';

const EmptyStateIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-media"
      className={cn('flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary', className)}
      {...props}
    />
  )
);
EmptyStateIcon.displayName = 'EmptyStateIcon';

const EmptyStateTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="empty-title"
      className={cn('mt-5 text-base font-semibold leading-snug text-navy', className)}
      {...props}
    />
  )
);
EmptyStateTitle.displayName = 'EmptyStateTitle';

const EmptyStateDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="empty-description"
      className={cn('mt-2 max-w-md text-sm font-normal leading-6 text-text-body', className)}
      {...props}
    />
  )
);
EmptyStateDescription.displayName = 'EmptyStateDescription';

const EmptyStateContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="empty-content" className={cn('mt-5 flex items-center justify-center', className)} {...props} />
  )
);
EmptyStateContent.displayName = 'EmptyStateContent';

export { EmptyState, EmptyStateContent, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle };
