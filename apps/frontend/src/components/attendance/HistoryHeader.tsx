'use client';

import React from 'react';
import {
  CalendarCheck2,
  CheckCheck,
  RefreshCw,
  X,
  Users,
  FileSpreadsheet,
  Calendar,
  TableProperties,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface HistoryHeaderProps {
  isModal?: boolean;
  onClose?: () => void;
  onMarkAllPresent?: () => void;
  isMarkingAll?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalStudents?: number;
  viewMode?: 'daily' | 'monthly';
  onViewModeChange?: (mode: 'daily' | 'monthly') => void;
  onExportExcel?: () => void;
  isExportingExcel?: boolean;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({
  isModal = false,
  onClose,
  onMarkAllPresent,
  isMarkingAll = false,
  onRefresh,
  isRefreshing = false,
  totalStudents = 0,
  viewMode = 'daily',
  onViewModeChange,
  onExportExcel,
  isExportingExcel = false,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
      {/* 1. Título y descripción */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 shadow-xs">
          <CalendarCheck2 size={24} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Historial de Asistencias
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <Users size={12} />
              {totalStudents} Alumnos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Auditoría de pase de lista diario y sábana mensual con exportación a Excel
          </p>
        </div>
      </div>

      {/* 2. Selector de modo (Pase Diario vs Sábana Mensual) y Botones de acción */}
      <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
        {/* Toggle de modo */}
        {onViewModeChange && (
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-slate-800 shadow-xs scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar size={14} className={viewMode === 'daily' ? 'text-sky-500' : 'text-slate-400'} />
              <span>Pase Diario</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-800 shadow-xs scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableProperties size={14} className={viewMode === 'monthly' ? 'text-emerald-500' : 'text-slate-400'} />
              <span>Sábana Mensual</span>
            </button>
          </div>
        )}

        {/* Botón Exportar a Excel directo */}
        {onExportExcel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={isExportingExcel}
            leftIcon={<FileSpreadsheet size={16} className="text-emerald-600" />}
            className="text-xs font-bold border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 hover:border-emerald-300 transition-colors"
          >
            {isExportingExcel ? 'Exportando...' : 'Exportar Mes a Excel'}
          </Button>
        )}

        {/* Marcar Todos Presentes (Solo en vista diaria) */}
        {viewMode === 'daily' && onMarkAllPresent && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllPresent}
            disabled={isMarkingAll}
            leftIcon={<CheckCheck size={16} className="text-emerald-600" />}
            className="text-xs font-bold border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 transition-colors"
          >
            {isMarkingAll ? 'Registrando...' : 'Marcar Todos Presentes'}
          </Button>
        )}

        {/* Botón Refrescar */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-slate-500 hover:text-slate-800 p-2 h-9 w-9 rounded-full"
            title="Actualizar datos"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-sky-500' : ''} />
          </Button>
        )}

        {/* Botón Cerrar (Solo si es modal) */}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar historial"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer ml-1"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

export default HistoryHeader;
