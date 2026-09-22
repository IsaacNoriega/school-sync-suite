'use client';

import * as React from 'react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

export interface DatePickerProps {
  /**
   * Fecha seleccionada. Puede ser un objeto Date o un string ISO (ej. 'YYYY-MM-DD').
   */
  selectedDate?: Date | string | null;
  /**
   * Callback invocado al seleccionar una fecha. Entrega el objeto Date y el string formateado 'YYYY-MM-DD'.
   */
  onSelect?: (date: Date | undefined, dateString: string) => void;
  /**
   * Texto de marcador cuando no hay fecha elegida.
   */
  placeholder?: string;
  /**
   * Deshabilitar la interacción con el selector.
   */
  disabled?: boolean;
  /**
   * Clases CSS personalizadas de Tailwind para el botón disparador.
   */
  className?: string;
  /**
   * Formato legible para mostrar en el botón (por defecto: 'd de MMMM, yyyy').
   */
  displayFormat?: string;
  /**
   * Permitir limpiar la fecha seleccionada.
   */
  clearable?: boolean;
  /**
   * Identificador para formularios.
   */
  id?: string;
  /**
   * Nombre del campo para formularios.
   */
  name?: string;
}

/**
 * Parsea de forma segura una fecha ya sea Date o string 'YYYY-MM-DD'
 * evitando desfases de zona horaria.
 */
function parseDateInput(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return isValid(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    // Si viene en formato 'YYYY-MM-DD', crear fecha local pura
    const parts = value.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const localDate = new Date(year, month, day);
      return isValid(localDate) ? localDate : undefined;
    }
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  }
  return undefined;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onSelect,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  className,
  displayFormat = "d 'de' MMMM, yyyy",
  clearable = false,
  id,
  name,
}) => {
  const [open, setOpen] = React.useState(false);

  const dateValue = React.useMemo(() => parseDateInput(selectedDate), [selectedDate]);

  const handleSelectDate = (newDate: Date | undefined) => {
    if (onSelect) {
      const dateString = newDate && isValid(newDate) ? format(newDate, 'yyyy-MM-dd') : '';
      onSelect(newDate, dateString);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(undefined, '');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          disabled={disabled}
          variant="outline"
          className={cn(
            'flex h-10 w-full items-center justify-start rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm transition-all',
            'hover:bg-slate-50 hover:text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !dateValue && 'text-slate-400',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate flex-1 text-left">
            {dateValue && isValid(dateValue)
              ? format(dateValue, displayFormat, { locale: es })
              : placeholder}
          </span>
          {clearable && dateValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="ml-auto rounded-full p-0.5 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors"
              title="Limpiar fecha"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelectDate}
        />
      </PopoverContent>
      {name && (
        <input
          type="hidden"
          name={name}
          value={dateValue && isValid(dateValue) ? format(dateValue, 'yyyy-MM-dd') : ''}
        />
      )}
    </Popover>
  );
};

export default DatePicker;
