import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'icon' 
  | 'sky' 
  | 'dark' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'outline' 
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      type = 'button',
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Clases base obligatorias del diseño Playful Utility
    const baseClasses =
      'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 active:scale-95 select-none outline-none disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

    // Variantes según requerimiento
    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-200 focus-visible:ring-4 focus-visible:ring-sky-100',
      secondary:
        'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 focus-visible:ring-4 focus-visible:ring-slate-100',
      sky:
        'bg-sky-100 text-sky-700 hover:bg-sky-200 focus-visible:ring-4 focus-visible:ring-sky-100',
      icon:
        'rounded-full p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 aspect-square focus-visible:ring-4 focus-visible:ring-slate-100',
      dark:
        'bg-slate-900 text-white hover:bg-slate-800 shadow-sm shadow-slate-900/20 focus-visible:ring-4 focus-visible:ring-slate-700',
      success:
        'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200 focus-visible:ring-4 focus-visible:ring-emerald-100',
      warning:
        'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200 focus-visible:ring-4 focus-visible:ring-amber-100',
      danger:
        'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-200 focus-visible:ring-4 focus-visible:ring-rose-100',
      outline:
        'border-2 border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-100',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    };

    // Tamaños
    const sizeClasses: Record<ButtonSize, string> = {
      sm: variant === 'icon' ? 'p-2 text-xs' : 'px-3.5 py-1.5 text-xs gap-1.5',
      md: variant === 'icon' ? 'p-2.5 text-sm' : 'px-5 py-2.5 text-sm gap-2',
      lg: variant === 'icon' ? 'p-3.5 text-base' : 'px-7 py-3.5 text-base gap-2.5',
      icon: 'p-2 aspect-square',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
