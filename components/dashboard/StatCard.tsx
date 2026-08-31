'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  iconSrc?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, iconSrc, icon }) => {
  return (
    <Card
      className="flex-1 items-start gap-[clamp(16px,1.62vw,28px)] px-[clamp(12px,1.39vw,24px)] [--card-spacing:clamp(12px,1.39vw,24px)]"
    >
      <div className="flex items-start justify-between w-full gap-2">
        <p className="flex-1 text-sm font-medium leading-tight text-text-body">{title}</p>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-background">
          {icon ? (
            icon
          ) : iconSrc ? (
            <div
              className="relative"
              style={{ width: 'clamp(18px, 1.38vw, 24px)', height: 'clamp(18px, 1.38vw, 24px)' }}
            >
              <Image
                src={iconSrc}
                alt={title}
                fill
                className="object-contain"
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col items-start mt-auto">
        <p className="max-w-full text-2xl font-bold leading-tight break-words text-navy sm:text-[28px]">{value}</p>
      </div>
    </Card>
  );
};
