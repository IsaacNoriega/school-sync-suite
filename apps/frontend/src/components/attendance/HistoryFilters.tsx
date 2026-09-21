'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { AttendanceFilterStatus, AttendanceSummaryStats } from './types';

interface HistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: AttendanceFilterStatus;
  onFilterChange: (status: AttendanceFilterStatus) => void;
  stats: AttendanceSummaryStats;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  stats,
}) => {
  const filterOptions: Array<{ id: AttendanceFilterStatus; label: string; count: number }> = [
    { id: 'ALL', label: 'Todos', count: stats.total },
    { id: 'PRESENT', label: 'Presentes', count: stats.present },
    { id: 'LATE', label: 'Retardos', count: stats.late },
    { id: 'ABSENT', label: 'Ausentes', count: stats.absent },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
      {/* Barra de búsqueda */}
      <div className="relative flex-1 max-w-md">
        <label htmlFor="history-student-search" className="sr-only">
          Buscar alumno por nombre o matrícula
        </label>
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id="history-student-search"
          type="text"
          placeholder="Buscar alumno por nombre o matrícula..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-semibold rounded-2xl pl-10 pr-9 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
            title="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Píldoras de filtrado por estatus */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {filterOptions.map((opt) => {
          const isSelected = filterStatus === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onFilterChange(opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-500'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
