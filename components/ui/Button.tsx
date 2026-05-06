import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-full font-semibold cursor-pointer transition-all duration-200 border-none font-inter active:scale-95";
  
  const variants = {
    primary: "bg-primary text-white border border-[#648EFC] shadow-sm hover:brightness-110",
    secondary: "bg-primary/5 text-primary hover:bg-primary/10",
    outline: "bg-transparent border border-stroke text-text-title hover:border-primary/50",
    ghost: "bg-transparent text-text-body hover:bg-black/5"
  };

  const sizes = {
    sm: "px-4 py-2 text-[0.875rem]",
    md: "px-6 py-3 text-[1rem]",
    lg: "px-10 py-4 text-[1.125rem]"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}
