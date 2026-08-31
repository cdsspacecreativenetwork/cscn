import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangle' | 'circle' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rounded' }) => {
  const baseClasses = 'relative overflow-hidden bg-[#E3E8F4] animate-pulse motion-reduce:animate-none';
  
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
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent motion-reduce:hidden" />
    </div>
  );
};
