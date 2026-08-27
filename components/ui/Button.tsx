import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-jakarta font-semibold tracking-[-0.01em] whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
  {
    variants: {
      variant: {
        default: 'bg-[#1C4ED1] text-white hover:bg-[#163fa3]',
        primary: 'bg-[#1C4ED1] text-white border-t border-[#648EFC]/30 shadow-[0px_4px_12px_rgba(28,78,209,0.15)] hover:bg-[#163fa3] hover:shadow-[0px_6px_16px_rgba(28,78,209,0.25)]',
        secondary: 'bg-[#1C4ED1]/5 text-[#1C4ED1] hover:bg-[#1C4ED1]/10',
        outline: 'bg-transparent border border-[#E3E8F4] text-[#040B37] hover:border-[#1C4ED1] hover:text-[#1C4ED1]',
        ghost: 'bg-transparent text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]',
        navy: 'bg-[#040B37] text-white hover:bg-[#060e44]',
        gradient: 'text-white border-none',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-primary underline-offset-4 hover:underline bg-transparent border-none shadow-none p-0 h-auto',
      },
      size: {
        default: 'px-6 py-3 text-[15px]',
        sm: 'px-4 py-2 text-[13px]',
        md: 'px-6 py-3 text-[15px]',
        lg: 'px-8 py-[14px] text-[16px]',
        xl: 'px-10 py-[18px] text-[18px]',
        icon: 'p-2.5 w-10 h-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const roundnessMap: Record<string, string> = {
  sm: 'rounded-[6px]',
  md: 'rounded-[8px]',
  lg: 'rounded-[12px]',
  full: 'rounded-full',
};

function getRounded(rounded?: string): string {
  if (!rounded) return 'rounded-[8px]';
  if (roundnessMap[rounded]) return roundnessMap[rounded];
  return rounded.startsWith('[') ? `rounded-${rounded}` : rounded;
}

const gradientSizeMap: Record<string, string> = {
  sm: 'px-5 py-[9px] text-[15px]',
  md: 'px-[22px] py-2.5 text-[15px]',
  lg: 'px-6 py-[11px] text-[16px]',
  xl: 'px-[26px] py-3 text-[16px]',
  icon: 'p-2.5 w-10 h-10',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  rounded?: 'sm' | 'md' | 'lg' | 'full' | string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hasBorder?: boolean;
  disableScaleHover?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      rounded = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      hasBorder = true,
      disableScaleHover = false,
      style,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const roundedClass = getRounded(rounded);

    if (variant === 'gradient') {
      const hasWidthClass = /\bw-(full|auto|fit|min|max|\d+|\[[^\]]+\])/.test(className);
      const widthDefaultClass = hasWidthClass ? '' : 'w-max';
      const displayClass = className.includes('w-full') ? 'flex' : 'inline-flex';
      const sizeKey = size && gradientSizeMap[size] ? size : 'md';
      const scaleHoverClass = disableScaleHover ? '' : 'hover:scale-[1.03] active:scale-[0.98]';

      if (hasBorder) {
        return (
          <button
            ref={ref}
            type={type}
            disabled={isDisabled}
            className={`${displayClass} h-max cursor-pointer items-center justify-center rounded-full border border-[var(--special-btn-border)] bg-transparent p-[2px] transition-all duration-200 ease-out hover:border-[#7b9ffd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#648EFC]/40 disabled:cursor-not-allowed disabled:opacity-40 ${scaleHoverClass} ${widthDefaultClass} ${className}`}
            style={style}
            {...props}
          >
            <span
              className={`flex w-full flex-row items-center justify-center gap-2 rounded-full ${gradientSizeMap[sizeKey]} font-inter font-medium tracking-normal text-[#F4F6FB] whitespace-nowrap leading-[1.25] transition-opacity hover:opacity-95`}
              style={{ background: 'var(--cds-w-grad-2)' }}
            >
              {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
              <span>{children}</span>
              {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
            </span>
          </button>
        );
      } else {
        return (
          <button
            ref={ref}
            type={type}
            disabled={isDisabled}
            className={`${displayClass} items-center justify-center ${roundedClass} ${gradientSizeMap[sizeKey]} font-inter font-medium tracking-normal whitespace-nowrap leading-[1.25] text-[#F4F6FB] transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
            style={{ ...style, background: 'var(--cds-w-grad-2)' }}
            {...props}
          >
            {!loading && leftIcon && <span className="mr-2 shrink-0">{leftIcon}</span>}
            {children}
            {!loading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
          </button>
        );
      }
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size, className }), roundedClass)}
        style={style}
        {...props}
      >
        {!loading && leftIcon && <span className="mr-2 shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
