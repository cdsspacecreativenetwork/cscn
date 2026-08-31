import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type LearnerPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
  compact?: boolean;
  className?: string;
};

export function LearnerPageHeader({
  title,
  description,
  action,
  eyebrow,
  compact = false,
  className,
}: LearnerPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-wide text-primary">{eyebrow}</p>
        ) : null}
        <h1
          className={cn(
            'text-balance font-semibold leading-tight tracking-[-0.03em] text-navy',
            compact ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm font-normal leading-6 text-text-body">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type LearnerSectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  headingId?: string;
};

export function LearnerSectionHeader({
  title,
  description,
  action,
  className,
  headingId,
}: LearnerSectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h2 id={headingId} className="text-balance text-lg font-semibold leading-snug text-navy sm:text-xl">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm font-normal leading-6 text-text-body">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
