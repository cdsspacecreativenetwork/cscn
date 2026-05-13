import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangle' | 'circle' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rounded' }) => {
  const baseClasses = 'animate-pulse bg-[#E3E8F4] relative overflow-hidden';
  
  const variantClasses = {
    rectangle: '',
    circle: 'rounded-full',
    rounded: 'rounded-[8px]',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {/* Shimmer Effect Overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};
