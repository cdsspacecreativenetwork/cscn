import React from 'react';

/**
 * Premium Button Component
 * Inspired by shadcn/ui but tailored to the CSCN Design System.
 *
 * Variants:
 * - gradient : Bordered gradient pill — the primary CTA (from/to blue, glowing ring).
 *              Renders a wrapper <div> + inner <button>. `className` targets the wrapper
 *              (use for width control: "w-full", "w-auto", etc.).
 * - primary  : Solid brand blue (#1C4ED1) with depth shadow.
 * - secondary: Light blue tint — less emphasis.
 * - outline  : Transparent with stroke border.
 * - ghost    : Plain text, highlights on hover.
 * - navy     : Dark navy (#040B37) — footer/header.
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gradient' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'navy';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  rounded?: 'sm' | 'md' | 'lg' | 'full' | string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hasBorder?: boolean; // Controls whether gradient or other variants render with the outer decorative border
}

const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-current shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const roundnessMap: Record<string, string> = {
  sm:   'rounded-[6px]',
  md:   'rounded-[8px]',
  lg:   'rounded-[12px]',
  full: 'rounded-full',
};

function getRounded(rounded: string): string {
  if (roundnessMap[rounded]) return roundnessMap[rounded];
  // Arbitrary value like "[10px]" → "rounded-[10px]"
  return rounded.startsWith('[') ? `rounded-${rounded}` : rounded;
}

const sizeMap: Record<string, string> = {
  sm:   'px-4   py-2      text-[13px]',
  md:   'px-6   py-3      text-[15px]',
  lg:   'px-8   py-[14px] text-[16px]',
  xl:   'px-10  py-[18px] text-[18px]',
  icon: 'p-2.5  w-10 h-10',
};

const gradientSizeMap: Record<string, string> = {
  sm:   'px-5 py-[9px] text-[15px]',
  md:   'px-[22px] py-2.5 text-[15px]',
  lg:   'px-6 py-[11px] text-[16px]',
  xl:   'px-[26px] py-3 text-[16px]',
  icon: 'p-2.5 w-10 h-10',
};

export default function Button({
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
  style,
  ...props
}: ButtonProps) {

  const roundedClass = getRounded(rounded);
  const isDisabled   = disabled || loading;

  /* ── Gradient variant ─────────────────────────────────────────────────── */
  if (variant === 'gradient') {
    const hasWidthClass = /\bw-(full|auto|fit|min|max|\d+|\[[^\]]+\])/.test(className);
    const widthDefaultClass = hasWidthClass ? '' : 'w-max';
    const displayClass = className.includes('w-full') ? 'flex' : 'inline-flex';

    if (hasBorder) {
      return (
        <button
          disabled={isDisabled}
          className={`${displayClass} h-max cursor-pointer flex-col items-center justify-center rounded-full border border-[var(--special-btn-border)] bg-transparent p-[2px] transition-transform duration-200 ease-out hover:scale-[1.03] hover:border-[#7b9ffd] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#648EFC]/40 disabled:cursor-not-allowed disabled:opacity-40 ${widthDefaultClass} ${className}`}
          style={style}
          {...props}
        >
          <span
            className={`flex w-full flex-row items-center justify-center gap-2 rounded-full ${gradientSizeMap[size]} font-inter font-medium tracking-normal text-[#F4F6FB] whitespace-nowrap leading-[1.25] transition-opacity hover:opacity-95`}
            style={{ background: 'var(--cds-w-grad-2)' }}
          >
            {loading && <Spinner />}
            {!loading && leftIcon  && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </span>
        </button>
      );
    } else {
      return (
        <button
          disabled={isDisabled}
          className={`${displayClass} items-center justify-center ${roundedClass} ${gradientSizeMap[size]} font-inter font-medium tracking-normal whitespace-nowrap leading-[1.25] text-[#F4F6FB] transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
          style={{ ...style, background: 'var(--cds-w-grad-2)' }}
          {...props}
        >
          {loading && <Spinner />}
          {!loading && leftIcon  && <span className="mr-2 shrink-0">{leftIcon}</span>}
          {children}
          {!loading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
        </button>
      );
    }
  }

  /* ── All other variants ───────────────────────────────────────────────── */
  const variantClasses: Record<string, string> = {
    primary:   'bg-[#1C4ED1] text-white border-t border-[#648EFC]/30 shadow-[0px_4px_12px_rgba(28,78,209,0.15)] hover:bg-[#163fa3] hover:shadow-[0px_6px_16px_rgba(28,78,209,0.25)]',
    secondary: 'bg-[#1C4ED1]/5 text-[#1C4ED1] hover:bg-[#1C4ED1]/10',
    outline:   'bg-transparent border border-[#E3E8F4] text-[#040B37] hover:border-[#1C4ED1] hover:text-[#1C4ED1]',
    ghost:     'bg-transparent text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]',
    navy:      'bg-[#040B37] text-white hover:bg-[#060e44]',
  };

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-jakarta font-semibold tracking-[-0.01em] whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeMap[size]} ${roundedClass} ${className}`}
      style={style}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && leftIcon  && <span className="mr-2 shrink-0">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
    </button>
  );
}
