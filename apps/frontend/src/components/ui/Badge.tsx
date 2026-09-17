import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type BadgeStatus =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'present'
  | 'process'
  | 'attention'
  | 'completed'
  | 'pending'
  | 'points'
  | 'punctual'
  | 'late'
  | 'justified';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  variant?: BadgeStatus;
  color?: string; // Clases Tailwind personalizadas de color
  size?: BadgeSize;
  isCircle?: boolean; // Variante circular para contadores numéricos (ej. 3, 45, etc.)
}

const statusMap: Record<BadgeStatus, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  present: 'bg-emerald-500 text-white',
  punctual: 'bg-[#7ac725] text-white',
  points: 'bg-[#7ac725] text-white font-black',
  warning: 'bg-amber-100 text-amber-900',
  process: 'bg-amber-400 text-white',
  danger: 'bg-rose-100 text-rose-800',
  attention: 'bg-rose-500 text-white',
  pending: 'bg-rose-100 text-rose-800',
  info: 'bg-sky-100 text-sky-800',
  neutral: 'bg-slate-100 text-slate-800',
  late: 'bg-amber-100 text-amber-900',
  justified: 'bg-amber-100 text-amber-900',
};

const sizeMap: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      status,
      variant,
      color,
      size = 'md',
      isCircle = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const effectiveStatus = variant || status || 'neutral';
    // Si se pasa `color` explícito tiene prioridad, si no mapeamos según `effectiveStatus`
    const colorClasses = color || statusMap[effectiveStatus] || statusMap.neutral;

    const baseClasses = isCircle
      ? 'inline-flex items-center justify-center rounded-full text-sm font-bold aspect-square min-w-[2rem] min-h-[2rem] p-1 leading-none select-none'
      : cn(
          'inline-flex items-center justify-center rounded-full font-bold select-none transition-all duration-200',
          sizeMap[size]
        );

    return (
      <span ref={ref} className={cn(baseClasses, colorClasses, className)} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
