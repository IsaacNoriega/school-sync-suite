'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn('p-3 select-none', className)}
      classNames={{
        root: 'p-1',
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center mb-2',
        caption_label: 'text-sm font-semibold text-slate-800 capitalize',
        nav: 'space-x-1 flex items-center',
        button_previous:
          'absolute left-1 h-7 w-7 bg-transparent p-0 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors',
        button_next:
          'absolute right-1 h-7 w-7 bg-transparent p-0 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex justify-between',
        weekday: 'text-slate-400 rounded-md w-8 font-medium text-[0.8rem] capitalize text-center',
        weeks: 'flex flex-col gap-1',
        week: 'flex w-full mt-1 justify-between',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button: cn(
          'h-8 w-8 p-0 font-normal rounded-md transition-colors flex items-center justify-center hover:bg-slate-100 text-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-slate-400'
        ),
        selected: 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white focus:bg-slate-900 focus:text-white font-semibold rounded-md',
        today: 'bg-slate-100 font-bold text-slate-900 rounded-md',
        outside: 'text-slate-300 opacity-50',
        disabled: 'text-slate-300 opacity-40 hover:bg-transparent cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';
