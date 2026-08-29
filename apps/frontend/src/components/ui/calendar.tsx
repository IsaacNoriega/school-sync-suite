'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={`rdp-root ${className ?? ''}`}
        classNames={{
          months: 'rdp-months',
          month: 'rdp-month',
          month_caption: 'rdp-month_caption',
          caption_label: 'rdp-caption_label',
          nav: 'rdp-nav',
          button_previous: 'rdp-button_previous',
          button_next: 'rdp-button_next',
          month_grid: 'rdp-month_grid',
          weekdays: 'rdp-weekdays',
          weekday: 'rdp-weekday',
          week: 'rdp-week',
          day: 'rdp-day',
          day_button: 'rdp-day_button',
          selected: 'rdp-selected',
          today: 'rdp-today',
          outside: 'rdp-outside',
          disabled: 'rdp-disabled',
          range_middle: 'rdp-range_middle',
          range_start: 'rdp-range_start',
          range_end: 'rdp-range_end',
          hidden: 'rdp-hidden',
          ...classNames,
        }}
        components={{
          Chevron: ({ orientation }: { orientation?: string }) =>
            orientation === 'left' ? (
              <ChevronLeft size={16} />
            ) : (
              <ChevronRight size={16} />
            ),
        }}
        {...props}
      />

      {/* Calendar scoped styles */}
      <style>{`
        .rdp-root {
          --rdp-accent: #0284c7;
          --rdp-accent-bg: #e0f2fe;
          --rdp-accent-foreground: #ffffff;
          --rdp-range-middle-bg: #e0f2fe;
          --rdp-muted: #64748b;
          --rdp-border: #e2e8f0;
          --rdp-radius: 8px;
          font-family: var(--font-outfit, 'Outfit', sans-serif);
          font-size: 0.875rem;
          display: inline-block;
        }
        .rdp-months { display: flex; gap: 16px; }
        .rdp-month { width: 100%; }
        .rdp-month_caption {
          display: flex; align-items: center; justify-content: center;
          height: 36px; margin-bottom: 8px; position: relative;
        }
        .rdp-caption_label { font-weight: 700; font-size: 0.9rem; color: #1e293b; }
        .rdp-nav {
          display: flex; align-items: center; justify-content: space-between;
          position: absolute; width: 100%; top: 0; left: 0;
        }
        .rdp-button_previous, .rdp-button_next {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 6px;
          border: 1px solid var(--rdp-border); background: white;
          color: #475569; cursor: pointer; transition: background 0.15s; padding: 0;
        }
        .rdp-button_previous:hover, .rdp-button_next:hover { background: #f1f5f9; color: #0f172a; }
        .rdp-month_grid { width: 100%; border-collapse: collapse; }
        .rdp-weekdays { display: flex; margin-bottom: 4px; }
        .rdp-weekday {
          flex: 1; text-align: center; font-size: 0.75rem;
          font-weight: 600; color: var(--rdp-muted); padding: 4px 0;
        }
        .rdp-week { display: flex; margin-bottom: 2px; }
        .rdp-day { flex: 1; text-align: center; padding: 1px; }
        .rdp-day_button {
          width: 36px; height: 36px; border-radius: var(--rdp-radius);
          border: none; background: transparent; color: #1e293b;
          font-size: 0.85rem; font-weight: 500; cursor: pointer;
          transition: background 0.15s; display: inline-flex;
          align-items: center; justify-content: center; font-family: inherit;
        }
        .rdp-day_button:hover { background: #f1f5f9; }
        .rdp-today .rdp-day_button {
          font-weight: 700; color: var(--rdp-accent);
          border: 1.5px solid var(--rdp-accent-bg);
        }
        .rdp-selected .rdp-day_button {
          background: var(--rdp-accent) !important;
          color: var(--rdp-accent-foreground) !important; font-weight: 700;
        }
        .rdp-outside .rdp-day_button { color: #cbd5e1; }
        .rdp-disabled .rdp-day_button { color: #cbd5e1; cursor: not-allowed; }
        .rdp-range_start .rdp-day_button, .rdp-range_end .rdp-day_button {
          background: var(--rdp-accent) !important;
          color: var(--rdp-accent-foreground) !important;
        }
        .rdp-range_middle .rdp-day_button {
          background: var(--rdp-range-middle-bg) !important;
          color: var(--rdp-accent) !important; border-radius: 0;
        }
        .rdp-hidden { visibility: hidden; }
      `}</style>
    </>
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
