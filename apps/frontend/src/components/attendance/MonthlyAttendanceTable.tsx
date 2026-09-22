'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Search,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface MonthlyReportStudent {
  _id: string;
  name: string;
  enrollmentNumber: string;
  tutor?: string;
}

interface MonthlyAttendanceTableProps {
  month: string; // YYYY-MM
  daysInMonth: number;
  students: MonthlyReportStudent[];
  records: Record<string, Record<string, { status: string; scannedAt?: string | Date }>>;
  summaries: Record<
    string,
    { presents: number; lates: number; absents: number; totalRecords: number; attendanceRate: number }
  >;
  isLoading: boolean;
  onMonthChange: (month: string) => void;
  onExportExcel: () => void;
  isExporting?: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const MonthlyAttendanceTable: React.FC<MonthlyAttendanceTableProps> = ({
  month,
  daysInMonth,
  students,
  records,
  summaries,
  isLoading,
  onMonthChange,
  onExportExcel,
  isExporting = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Cálculo de mes y año
  const [yearNum, monthNum] = useMemo(() => {
    const [y, m] = month.split('-').map((v) => parseInt(v, 10));
    return [y || new Date().getFullYear(), m || new Date().getMonth() + 1];
  }, [month]);

  const monthLabel = `${MONTH_NAMES[monthNum - 1]} ${yearNum}`;

  // Navegación de meses
  const handlePrevMonth = () => {
    const prevDate = new Date(yearNum, monthNum - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = String(prevDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(yearNum, monthNum, 1);
    const newY = nextDate.getFullYear();
    const newM = String(nextDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${newY}-${newM}`);
  };

  // Metadatos de cada día del mes
  const daysMeta = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(yearNum, monthNum - 1, dayNum);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateKey = `${month}-${String(dayNum).padStart(2, '0')}`;
      return {
        dayNum,
        dayNumberStr: String(dayNum).padStart(2, '0'),
        dayLetter: DAY_INITIALS[dayOfWeek],
        isWeekend,
        dateKey,
      };
    });
  }, [daysInMonth, yearNum, monthNum, month]);

  // Filtrado de estudiantes por búsqueda
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.enrollmentNumber && s.enrollmentNumber.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // Totales de alumnos presentes por cada día
  const dailyPresentTotals = useMemo(() => {
    const totals: number[] = new Array(daysInMonth).fill(0);
    students.forEach((s) => {
      const studentRecs = records[s._id] || {};
      daysMeta.forEach((d, idx) => {
        const rec = studentRecs[d.dateKey];
        if (rec && (rec.status === 'PRESENT' || rec.status === 'LATE')) {
          totals[idx]++;
        }
      });
    });
    return totals;
  }, [students, records, daysMeta, daysInMonth]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-5">
      {/* Barra de Controles: Selector de Mes, Botón Exportar y Buscador */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Selector de Mes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isLoading}
              title="Mes anterior"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 font-extrabold text-slate-800 text-sm sm:text-base min-w-[170px] justify-center">
              <Calendar size={16} className="text-sky-500" />
              <span>{monthLabel}</span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isLoading}
              title="Mes siguiente"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
            <Users size={13} />
            {students.length} Alumnos
          </span>
        </div>

        {/* Acciones: Buscador y Botón de Excel */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Buscador de alumnos */}
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-2xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Botón Destacado de Exportación a Excel */}
          <Button
            variant="primary"
            size="md"
            onClick={onExportExcel}
            disabled={isExporting || isLoading || students.length === 0}
            leftIcon={<FileSpreadsheet size={18} className="text-emerald-300" />}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 rounded-2xl transition-all"
          >
            {isExporting ? 'Generando Excel...' : 'Exportar Mes a Excel (.xlsx)'}
          </Button>
        </div>
      </div>

      {/* Leyenda de estatus */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/80 text-[11px] font-semibold text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Leyenda:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center">
              P
            </span>
            <span>Presente</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-black text-[11px] flex items-center justify-center">
              R
            </span>
            <span>Retardo</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-black text-[11px] flex items-center justify-center">
              F
            </span>
            <span>Falta</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 font-bold text-[11px] flex items-center justify-center">
              —
            </span>
            <span>Sin pase</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          * Las columnas sombreadas representan fines de semana (Sábado y Domingo).
        </div>
      </div>

      {/* Tabla Sábana Mensual Horizontally Scrollable */}
      <div className="relative rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Encabezado fijo */}
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md text-slate-700 font-extrabold border-b border-slate-200 shadow-xs">
              <tr>
                {/* # Columna fija */}
                <th className="sticky left-0 z-30 bg-slate-100/95 px-3 py-3 w-10 text-center border-r border-slate-200">
                  #
                </th>
                {/* Alumno Columna fija */}
                <th className="sticky left-10 z-30 bg-slate-100/95 px-3 py-3 min-w-[220px] sm:min-w-[240px] border-r border-slate-200">
                  Alumno / Matrícula
                </th>

                {/* Días del mes */}
                {daysMeta.map((d) => (
                  <th
                    key={d.dayNum}
                    className={`px-1 py-2 text-center min-w-[34px] max-w-[38px] border-r border-slate-200/70 select-none ${
                      d.isWeekend ? 'bg-slate-200/50 text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    <div className="text-[9px] uppercase font-bold leading-tight text-slate-400">
                      {d.dayLetter}
                    </div>
                    <div className="text-xs font-black leading-tight">
                      {d.dayNumberStr}
                    </div>
                  </th>
                ))}

                {/* Resumen Totales */}
                <th className="px-2 py-3 text-center min-w-[50px] bg-emerald-50 text-emerald-800 border-r border-emerald-100">
                  P
                </th>
                <th className="px-2 py-3 text-center min-w-[50px] bg-amber-50 text-amber-800 border-r border-amber-100">
                  R
                </th>
                <th className="px-2 py-3 text-center min-w-[50px] bg-rose-50 text-rose-800 border-r border-rose-100">
                  F
                </th>
                <th className="px-3 py-3 text-center min-w-[70px] bg-sky-50 text-sky-800">
                  % Asist.
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={daysInMonth + 6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                      <span className="text-xs font-bold text-slate-500">
                        Cargando sábana de asistencia de {monthLabel}...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Users size={28} className="text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">No se encontraron alumnos</p>
                      <p className="text-[11px] text-slate-400">
                        {searchQuery ? 'Prueba con otro término de búsqueda' : 'No hay alumnos registrados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentRecs = records[student._id] || {};
                  const summary = summaries[student._id] || {
                    presents: 0,
                    lates: 0,
                    absents: 0,
                    totalRecords: 0,
                    attendanceRate: 0,
                  };

                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-sky-50/30 transition-colors group"
                    >
                      {/* # Número */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-sky-50/50 px-2 py-2.5 text-center font-bold text-slate-400 border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* Alumno */}
                      <td className="sticky left-10 z-10 bg-white group-hover:bg-sky-50/50 px-3 py-2.5 border-r border-slate-100 font-medium">
                        <div className="font-extrabold text-slate-800 text-xs truncate max-w-[210px]" title={student.name}>
                          {student.name}
                        </div>
                        <div className="text-[10px] text-slate-600 font-semibold truncate">
                          {student.enrollmentNumber || '#EQR-0000'}
                        </div>
                      </td>

                      {/* Celdas de cada día */}
                      {daysMeta.map((d) => {
                        const rec = studentRecs[d.dateKey];
                        const status = rec?.status;

                        return (
                          <td
                            key={d.dayNum}
                            className={`px-0.5 py-1 text-center border-r border-slate-100 select-none ${
                              d.isWeekend ? 'bg-slate-50/70' : ''
                            }`}
                          >
                            {status === 'PRESENT' ? (
                              <span className="inline-flex w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] items-center justify-center shadow-2xs" title={`Presente - ${d.dateKey}`}>
                                P
                              </span>
                            ) : status === 'LATE' ? (
                              <span className="inline-flex w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-[10px] items-center justify-center shadow-2xs" title={`Retardo - ${d.dateKey}`}>
                                R
                              </span>
                            ) : status === 'ABSENT' ? (
                              <span className="inline-flex w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-black text-[10px] items-center justify-center shadow-2xs" title={`Falta - ${d.dateKey}`}>
                                F
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs font-light select-none">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Totales Resumen */}
                      <td className="px-2 py-2 text-center font-black text-emerald-700 bg-emerald-50/40 border-r border-emerald-100/60">
                        {summary.presents}
                      </td>
                      <td className="px-2 py-2 text-center font-black text-amber-700 bg-amber-50/40 border-r border-amber-100/60">
                        {summary.lates}
                      </td>
                      <td className="px-2 py-2 text-center font-black text-rose-700 bg-rose-50/40 border-r border-rose-100/60">
                        {summary.absents}
                      </td>
                      <td className="px-2 py-2 text-center bg-sky-50/30 font-black">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                            summary.attendanceRate >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : summary.attendanceRate >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {summary.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Pie de tabla con totales por día */}
            {!isLoading && filteredStudents.length > 0 && (
              <tfoot className="sticky bottom-0 z-20 bg-slate-100 font-extrabold text-slate-800 border-t-2 border-slate-200 shadow-sm">
                <tr>
                  <td
                    colSpan={2}
                    className="sticky left-0 z-30 bg-slate-100 px-3 py-2.5 text-right font-black text-xs text-slate-700 border-r border-slate-200"
                  >
                    Alumnos presentes por día:
                  </td>
                  {daysMeta.map((d, idx) => (
                    <td
                      key={d.dayNum}
                      className={`px-0.5 py-2 text-center text-xs font-black border-r border-slate-200 ${
                        d.isWeekend ? 'bg-slate-200/50 text-slate-400' : 'text-sky-700'
                      }`}
                    >
                      {dailyPresentTotals[idx]}
                    </td>
                  ))}
                  <td colSpan={4} className="bg-slate-100 px-2 py-2 text-center text-[11px] text-slate-500 font-bold">
                    Resumen mensual
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendanceTable;
