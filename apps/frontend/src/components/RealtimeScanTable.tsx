'use client';

import React from 'react';
import { ArrowUp, BookOpen, Info, Loader2, Mail, MessageCircle, QrCode, UserCheck } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';

export interface GradeRecord {
  id: string;
  name: string;
  enrollment: string;
  scanTime: string;
  timeStatus: string;
  score: number;
  points: number;
  rowBg: string;
  avatarBg: string;
  avatarIcon: string;
}

export interface AttendanceRecord {
  id: string;
  name: string;
  enrollment: string;
  entryTime: string;
  entryPoint: string;
  status: 'punctual' | 'late' | 'justified';
  statusText: string;
  notificationType: 'whatsapp' | 'sms';
  notificationText: string;
  rowBg: string;
  avatarBg: string;
  avatarIcon: string;
}

export interface RealtimeScanTableProps {
  scanMode: 'attendance' | 'grades';
  gradeRecords: GradeRecord[];
  attendanceRecords: AttendanceRecord[];
  loadingGrades: boolean;
  loadingAttendance: boolean;
  onOpenCriteria?: () => void;
  onOpenHistory?: () => void;
}

export const RealtimeScanTable = React.memo<RealtimeScanTableProps>(function RealtimeScanTable({
  scanMode,
  gradeRecords,
  attendanceRecords,
  loadingGrades,
  loadingAttendance,
  onOpenCriteria,
  onOpenHistory,
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {scanMode === 'grades' ? 'Registro de Calificaciones en Tiempo Real' : 'Registro de Asistencias en Tiempo Real'}
        </h2>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            leftIcon={<Info size={16} className="text-slate-400" />}
            onClick={onOpenCriteria}
            className="text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            Criterios de Asistencia
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenHistory}
            className="text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            Historial Completo
          </Button>
        </div>
      </div>

      {/* Gran Card contenedor de la tabla */}
      <Card className="bg-white p-6 sm:p-8 shadow-sm border border-slate-100 space-y-3">
        {scanMode === 'grades' ? (
          /* TABLA REAL: REGISTRO DE CALIFICACIONES DE DB */
          <>
            {/* Encabezados de Columna */}
            <div className="grid grid-cols-12 gap-4 px-5 text-[11px] font-black uppercase text-slate-400 tracking-wider items-center pb-2 select-none">
              <div className="col-span-12 md:col-span-4 flex items-center gap-1">
                <span>NOMBRE DEL ALUMNO</span>
                <ArrowUp size={13} className="text-slate-400" />
              </div>
              <div className="hidden md:block col-span-2 text-center">
                HORA DE REGISTRO
              </div>
              <div className="hidden md:block col-span-3 text-center">
                CALIFICACIÓN ASIGNADA ↕
              </div>
              <div className="hidden md:block col-span-2 text-center">
                PUNTOS / GAMIFICACIÓN
              </div>
              <div className="hidden md:block col-span-1 text-center">
                CREDENCIAL QR
              </div>
            </div>

            {loadingGrades ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={28} className="animate-spin text-sky-500" />
                <span className="text-xs font-bold">Cargando calificaciones desde la base de datos...</span>
              </div>
            ) : gradeRecords.length > 0 ? (
              <div className="space-y-3">
                {gradeRecords.map((record, idx) => {
                  const avatarStyle = [
                    { bg: 'bg-[#bbf7d0]', text: 'text-[#15803d]' },
                    { bg: 'bg-[#fef08a]', text: 'text-[#a16207]' },
                    { bg: 'bg-[#fecdd3]', text: 'text-[#e11d48]' },
                    { bg: 'bg-[#bae6fd]', text: 'text-[#0284c7]' },
                    { bg: 'bg-[#e9d5ff]', text: 'text-[#7e22ce]' },
                  ][idx % 5];

                  const getInitials = (name: string) => {
                    if (!name) return 'AL';
                    const parts = name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[1][0]).toUpperCase();
                    }
                    return parts[0].slice(0, 2).toUpperCase();
                  };

                  return (
                    <div
                      key={record.id}
                      className="bg-white rounded-2xl p-4 grid grid-cols-12 gap-4 items-center border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all duration-200"
                    >
                      {/* Columna 1: Avatar + Nombre + Matrícula */}
                      <div className="col-span-12 md:col-span-4 flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                          {getInitials(record.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 truncate">
                              {record.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              #{record.enrollment.replace('#', '')}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">
                            Matrícula: {record.enrollment}
                          </div>
                        </div>
                      </div>

                      {/* Columna 2: Hora de Registro */}
                      <div className="col-span-6 md:col-span-2 text-center">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {record.scanTime}
                        </div>
                        <div className={`text-[11px] font-bold ${record.timeStatus.includes('Tolerancia') ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {record.timeStatus}
                        </div>
                      </div>

                      {/* Columna 3: Calificación Asignada */}
                      <div className="col-span-6 md:col-span-3 flex items-center justify-center">
                        <Badge
                          className={`text-xs font-black px-3.5 py-1.5 rounded-xl border border-sky-200/70 ${
                            record.score >= 90
                              ? 'bg-[#e0f2fe] text-[#0369a1]'
                              : record.score >= 70
                              ? 'bg-[#dcfce7] text-[#15803d]'
                              : 'bg-[#fef3c7] text-[#b45309]'
                          }`}
                        >
                          {record.score} pts
                        </Badge>
                      </div>

                      {/* Columna 4: Puntos / Gamificación */}
                      <div className="col-span-6 md:col-span-2 flex items-center justify-center">
                        <Badge
                          className={`text-xs font-black px-3.5 py-1 rounded-full text-white ${
                            record.points >= 10 ? 'bg-[#84cc16]' : 'bg-[#f59e0b]'
                          }`}
                        >
                          +{record.points}
                        </Badge>
                      </div>

                      {/* Columna 5: Credencial QR */}
                      <div className="col-span-6 md:col-span-1 flex items-center justify-center">
                        <Button
                          variant="icon"
                          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-sky-600 hover:bg-slate-100 shadow-2xs"
                          title="Ver credencial QR"
                        >
                          <QrCode size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <BookOpen size={22} />
                </div>
                <p className="font-extrabold text-sm text-slate-700">Aún no hay calificaciones registradas para esta tarea</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Utiliza la cámara o el lector físico para escanear las hojas de examen o códigos QR de los alumnos.
                </p>
              </div>
            )}
          </>
        ) : (
          /* TABLA REAL: REGISTRO DE ASISTENCIAS DE DB */
          <>
            {/* Encabezados de Columna */}
            <div className="grid grid-cols-12 gap-4 px-5 text-[11px] font-black uppercase text-slate-400 tracking-wider items-center pb-2 select-none">
              <div className="col-span-12 md:col-span-4 flex items-center gap-1">
                <span>NOMBRE DEL ALUMNO</span>
                <ArrowUp size={13} className="text-slate-400" />
              </div>
              <div className="hidden md:block col-span-2 text-center">
                HORA DE ENTRADA
              </div>
              <div className="hidden md:block col-span-3 text-center">
                ESTADO DE ASISTENCIA
              </div>
              <div className="hidden md:block col-span-2 text-center">
                NOTIFICACIÓN A PADRES
              </div>
              <div className="hidden md:block col-span-1 text-center">
                CREDENCIAL QR
              </div>
            </div>

            {loadingAttendance ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={28} className="animate-spin text-sky-500" />
                <span className="text-xs font-bold">Cargando asistencias desde la base de datos...</span>
              </div>
            ) : attendanceRecords.length > 0 ? (
              <div className="space-y-3">
                {attendanceRecords.map((record, idx) => {
                  const avatarStyle = [
                    { bg: 'bg-[#bae6fd]', text: 'text-[#0284c7]' },
                    { bg: 'bg-[#bbf7d0]', text: 'text-[#15803d]' },
                    { bg: 'bg-[#fef08a]', text: 'text-[#a16207]' },
                    { bg: 'bg-[#fecdd3]', text: 'text-[#e11d48]' },
                    { bg: 'bg-[#e9d5ff]', text: 'text-[#7e22ce]' },
                  ][idx % 5];

                  const getInitials = (name: string) => {
                    if (!name) return 'AL';
                    const parts = name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[1][0]).toUpperCase();
                    }
                    return parts[0].slice(0, 2).toUpperCase();
                  };

                  return (
                    <div
                      key={record.id}
                      className="bg-white rounded-2xl p-4 grid grid-cols-12 gap-4 items-center border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all duration-200"
                    >
                      {/* Columna 1: Avatar + Nombre + Matrícula */}
                      <div className="col-span-12 md:col-span-4 flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                          {getInitials(record.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 truncate">
                              {record.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              #{record.enrollment.replace('#', '')}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">
                            Matrícula: {record.enrollment}
                          </div>
                        </div>
                      </div>

                      {/* Columna 2: Hora de Entrada */}
                      <div className="col-span-6 md:col-span-2 text-center">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {record.entryTime}
                        </div>
                        <div className={`text-[11px] font-bold ${record.entryPoint.includes('Tolerancia') ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {record.entryPoint}
                        </div>
                      </div>

                      {/* Columna 3: Estado de Asistencia */}
                      <div className="col-span-6 md:col-span-3 flex items-center justify-center">
                        <Badge
                          className={`text-xs font-black px-3.5 py-1.5 rounded-full border-none flex items-center gap-1.5 ${
                            record.status === 'punctual'
                              ? 'bg-[#dcfce7] text-[#15803d]'
                              : record.status === 'late'
                              ? 'bg-[#fef3c7] text-[#b45309]'
                              : 'bg-[#ffe4e6] text-[#be123c]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            record.status === 'punctual'
                              ? 'bg-[#16a34a]'
                              : record.status === 'late'
                              ? 'bg-[#d97706]'
                              : 'bg-[#e11d48]'
                          }`} />
                          {record.statusText}
                        </Badge>
                      </div>

                      {/* Columna 4: Notificación a Padres */}
                      <div className="col-span-6 md:col-span-2 flex items-center justify-center">
                        {record.notificationType === 'whatsapp' ? (
                          <div className="text-[#15803d] font-bold text-xs flex items-center gap-1.5">
                            <MessageCircle size={15} className="text-[#25D366] fill-[#25D366]" />
                            <span>WhatsApp Enviado</span>
                          </div>
                        ) : (
                          <div className="text-[#b45309] font-bold text-xs flex items-center gap-1.5">
                            <Mail size={15} className="text-[#f59e0b]" />
                            <span>SMS Confirmado</span>
                          </div>
                        )}
                      </div>

                      {/* Columna 5: Credencial QR */}
                      <div className="col-span-6 md:col-span-1 flex items-center justify-center">
                        <Button
                          variant="icon"
                          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-sky-600 hover:bg-slate-100 shadow-2xs"
                          title="Ver credencial QR"
                        >
                          <QrCode size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <UserCheck size={22} />
                </div>
                <p className="font-extrabold text-sm text-slate-700">No se han registrado asistencias el día de hoy</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Escanea la credencial de un alumno frente a la cámara o con el lector físico para registrar su acceso.
                </p>
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
});

export default RealtimeScanTable;
