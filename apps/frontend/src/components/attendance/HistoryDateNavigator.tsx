'use client';

import React, { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

interface HistoryDateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  isLoading?: boolean;
}

export const HistoryDateNavigator: React.FC<HistoryDateNavigatorProps> = ({
  selectedDate,
  onDateChange,
  isLoading = false,
}) => {
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-CA');
  }, []);

  const isToday = selectedDate === todayStr;

  // Formato legible en español
  const formattedDateLabel = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() - 1);
    onDateChange(dateObj.toLocaleDateString('en-CA'));
  };

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + 1);
    onDateChange(dateObj.toLocaleDateString('en-CA'));
  };

  const handleGoToday = () => {
    onDateChange(todayStr);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
      {/* Controles de navegación < Hoy > */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevDay}
          disabled={isLoading}
          className="h-9 w-9 p-0 rounded-full bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs"
          title="Día anterior"
          aria-label="Día anterior"
        >
          <ChevronLeft size={18} />
        </Button>

        <Button
          variant={isToday ? 'primary' : 'outline'}
          size="sm"
          onClick={handleGoToday}
          disabled={isLoading}
          leftIcon={isToday ? <Sparkles size={14} /> : undefined}
          className={`text-xs font-black px-4 h-9 ${
            isToday
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200'
          }`}
        >
          Hoy
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextDay}
          disabled={isLoading}
          className="h-9 w-9 p-0 rounded-full bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs"
          title="Día siguiente"
          aria-label="Día siguiente"
        >
          <ChevronRight size={18} />
        </Button>

        {/* Fecha formateada en texto */}
        <div className="hidden sm:block ml-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fecha de Asistencia</p>
          <p className="text-sm font-black text-slate-800 capitalize leading-none mt-0.5">
            {formattedDateLabel}
          </p>
        </div>
      </div>

      {/* Selector de fecha nativo accesible y visual */}
      <div className="flex items-center gap-2.5">
        <div className="sm:hidden">
          <p className="text-xs font-black text-slate-800 capitalize">
            {formattedDateLabel}
          </p>
        </div>

        <div className="relative flex items-center ml-auto">
          <label htmlFor="history-date-picker" className="sr-only">
            Seleccionar fecha específica
          </label>
          <div className="relative">
            <input
              id="history-date-picker"
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              disabled={isLoading}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-black rounded-xl px-3 py-2 pl-9 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all cursor-pointer shadow-2xs hover:border-slate-300"
            />
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
