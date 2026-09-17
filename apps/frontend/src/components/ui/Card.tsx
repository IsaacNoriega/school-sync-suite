import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type CardColorPreset = 
  | 'white' 
  | 'sky' 
  | 'emerald' 
  | 'amber' 
  | 'rose' 
  | 'slate' 
  | 'dark' 
  | 'dashed';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Color de fondo personalizado mediante clases Tailwind (ej. 'bg-sky-50', 'bg-[#e6f4fe]', 'bg-[#0c1222]')
   */
  bgColor?: string;
  /**
   * Presets temáticos listos para usar según las tarjetas del diseño Playful Utility
   */
  colorPreset?: CardColorPreset;
}

const colorPresetMap: Record<CardColorPreset, string> = {
  white: 'bg-white text-slate-800',
  sky: 'bg-sky-50 text-sky-950 border border-sky-100/80',
  emerald: 'bg-emerald-50 text-emerald-950 border border-emerald-100/80',
  amber: 'bg-amber-50 text-amber-950 border border-amber-100/80',
  rose: 'bg-rose-50 text-rose-950 border border-rose-100/80',
  slate: 'bg-slate-50 text-slate-800 border border-slate-100',
  dark: 'bg-[#0c1222] text-white border border-slate-800/80 shadow-md',
  dashed: 'bg-slate-50/60 border-2 border-dashed border-slate-200 text-slate-800 hover:border-slate-300',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ bgColor, colorPreset, className, children, ...props }, ref) => {
    // Si se pasa bgColor explícito tiene prioridad, si no el preset, si no el default 'bg-white text-slate-800'
    const backgroundClass = bgColor || (colorPreset ? colorPresetMap[colorPreset] : 'bg-white text-slate-800');

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[2rem] shadow-sm p-6 transition-all duration-200',
          backgroundClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
