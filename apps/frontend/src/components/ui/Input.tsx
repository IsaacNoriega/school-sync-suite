import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightIcon, containerClassName, className, disabled, ...props }, ref) => {
    // Si no tiene iconos laterales, aplicamos las clases base directas
    if (!leftIcon && !rightIcon) {
      return (
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full bg-slate-50 rounded-2xl p-4 outline-none text-slate-800 placeholder:text-slate-400 font-medium transition-all duration-200 focus:ring-4 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
      );
    }

    // Si tiene iconos laterales, envolvemos en un contenedor relativo manteniendo el diseño sin bordes
    return (
      <div
        className={cn(
          'relative flex items-center w-full bg-slate-50 rounded-2xl transition-all duration-200 focus-within:ring-4 focus-within:ring-sky-100',
          disabled && 'opacity-50 cursor-not-allowed',
          containerClassName
        )}
      >
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 select-none z-10">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent p-3.5 outline-none text-slate-800 placeholder:text-slate-400 font-medium border-none',
            className,
            leftIcon && '!pl-10',
            rightIcon && '!pr-10'
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-slate-400 select-none z-10">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
