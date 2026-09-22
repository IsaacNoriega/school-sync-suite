'use client';

import React from 'react';
import { Clock, QrCode, AlertCircle, Check, Loader2, Phone, UserCheck, UserX } from 'lucide-react';
import { DailyAttendanceStudent, AttendanceDbStatus } from './types';

interface StudentAttendanceTableProps {
  students: DailyAttendanceStudent[];
  isLoading?: boolean;
  onStatusChange?: (studentId: string, newStatus: AttendanceDbStatus) => Promise<void> | void;
  updatingStudentId?: string | null;
}

export const StudentAttendanceTable: React.FC<StudentAttendanceTableProps> = ({
  students,
  isLoading = false,
  onStatusChange,
  updatingStudentId,
}) => {
  // Función para obtener iniciales
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Paleta de colores para avatares
  const getAvatarStyle = (index: number) => {
    const styles = [
      { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      { bg: 'bg-sky-100 text-sky-800 border-sky-200' },
      { bg: 'bg-amber-100 text-amber-800 border-amber-200' },
      { bg: 'bg-rose-100 text-rose-800 border-rose-200' },
      { bg: 'bg-purple-100 text-purple-800 border-purple-200' },
      { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ];
    return styles[index % styles.length];
  };

  // Formatear hora de escaneo
  const formatScannedTime = (scannedAt?: string | Date | null) => {
    if (!scannedAt) return null;
    try {
      const date = new Date(scannedAt);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 size={26} className="animate-spin text-sky-500" />
          <span className="text-sm font-bold">Cargando lista de asistencia...</span>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-2xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <AlertCircle size={26} />
        </div>
        <h3 className="text-base font-black text-slate-800">No se encontraron alumnos</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 font-medium">
          No hay registros que coincidan con la fecha o los filtros de búsqueda aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider select-none">
              <th className="py-3.5 px-4 sm:px-6">Estudiante</th>
              <th className="py-3.5 px-3">Hora de Entrada</th>
              <th className="py-3.5 px-3">Estatus</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Corrección Rápida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {students.map((student, idx) => {
              const avatar = getAvatarStyle(idx);
              const timeStr = formatScannedTime(student.scannedAt);
              const isUpdating = updatingStudentId === student.studentId;

              // Renderizado de badge de estado
              let badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
              let badgeText = 'Ausente';
              let badgeDot = 'bg-rose-500';

              if (student.status === 'PRESENT') {
                badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                badgeText = 'Presente';
                badgeDot = 'bg-emerald-500';
              } else if (student.status === 'LATE') {
                badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                badgeText = 'Retardo';
                badgeDot = 'bg-amber-500';
              }

              return (
                <tr
                  key={student.studentId}
                  className="hover:bg-slate-50/60 transition-colors duration-150 group"
                >
                  {/* Alumno (Avatar + Nombre + Matrícula) */}
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 ${avatar.bg}`}
                      >
                        {getInitials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate leading-tight group-hover:text-sky-600 transition-colors">
                          {student.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] font-bold text-slate-500 flex items-center gap-0.5">
                            <QrCode size={11} className="text-slate-400" />
                            {student.enrollmentNumber}
                          </span>
                          {student.tutorPhone && (
                            <span
                              className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400"
                              title={`Tutor: ${student.tutor || 'No asignado'} (${student.tutorPhone})`}
                            >
                              <Phone size={9} />
                              {student.tutorPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Hora de Registro */}
                  <td className="py-3 px-3">
                    {timeStr ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                        <Clock size={12} className="text-slate-400" />
                        <span>{timeStr}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        Sin registro
                      </span>
                    )}
                  </td>

                  {/* Estatus Badge */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
                      {badgeText}
                    </span>
                  </td>

                  {/* Acciones de Corrección Rápida */}
                  <td className="py-3 px-4 sm:px-6 text-right">
                    {isUpdating ? (
                      <div className="flex justify-end items-center pr-3">
                        <Loader2 size={16} className="animate-spin text-sky-500" />
                      </div>
                    ) : onStatusChange ? (
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => onStatusChange(student.studentId, 'PRESENT')}
                          title="Marcar como Presente"
                          className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(student.studentId, 'LATE')}
                          title="Marcar como Retardo"
                          className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            student.status === 'LATE'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          R
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(student.studentId, 'ABSENT')}
                          title="Marcar como Ausente (Falta)"
                          className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            student.status === 'ABSENT'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          F
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
