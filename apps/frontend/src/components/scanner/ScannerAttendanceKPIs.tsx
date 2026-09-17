import React from 'react';
import { Calendar, SlidersHorizontal, Users } from 'lucide-react';

interface ScannerAttendanceKPIsProps {
  formattedDate: string;
  attendancePresentCount: number;
  totalStudents: number;
  attendancePercent: number;
  onNavigateToDashboard?: () => void;
}

export const ScannerAttendanceKPIs: React.FC<ScannerAttendanceKPIsProps> = ({
  formattedDate,
  attendancePresentCount,
  totalStudents,
  attendancePercent,
  onNavigateToDashboard,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {/* Card 1: FECHA DE ASISTENCIA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100/80 text-sky-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
              Fecha de Asistencia
            </span>
            <span className="text-base font-black text-slate-800 tracking-tight">
              {formattedDate}
            </span>
          </div>
        </div>
        {onNavigateToDashboard && (
          <button
            type="button"
            onClick={onNavigateToDashboard}
            title="Filtrar por fecha en Dashboard"
            className="text-slate-300 hover:text-slate-600 transition-colors p-1 cursor-pointer"
          >
            <SlidersHorizontal size={17} />
          </button>
        )}
      </div>

      {/* Card 2: ALUMNOS PRESENTES */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Users size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
              Alumnos Presentes
            </span>
            <span className="text-base font-black text-slate-900 tracking-tight">
              {attendancePresentCount}{' '}
              <span className="text-slate-400 text-xs font-semibold">
                / {totalStudents || 36} registrados
              </span>
            </span>
          </div>
        </div>
        <div className="bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 font-black text-xs px-3 py-1 rounded-full">
          {attendancePercent}%
        </div>
      </div>
    </div>
  );
};

export default ScannerAttendanceKPIs;
