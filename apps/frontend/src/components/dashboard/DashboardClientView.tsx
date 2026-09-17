'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  QrCode,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/config/api';
import { connectSocket } from '@/lib/socket';

const StudentQrModal = dynamic(() => import('@/components/StudentQrModal'), { ssr: false });

/* ===== AVATARES SVG ILUSTRADOS (Fieles al diseño de la imagen) ===== */
function StudentAvatar({ type }: { type: string }) {
  if (type === 'sabine' || type === 'rose') {
    return (
      <svg viewBox="0 0 44 44" className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-xs">
        <circle cx="22" cy="22" r="22" fill="#fcd5ce" />
        <ellipse cx="22" cy="38" rx="14" ry="9" fill="#e76f51" />
        <circle cx="22" cy="20" r="8" fill="#b06c49" />
        <path d="M14 19C14 14 17 11 22 11C27 11 30 14 30 19C28 17 26 17 22 17C18 17 16 17 14 19Z" fill="#592d1d" />
        <circle cx="19.5" cy="20.5" r="1" fill="#2b1408" />
        <circle cx="24.5" cy="20.5" r="1" fill="#2b1408" />
        <path d="M20.5 24C21 24.5 23 24.5 23.5 24" stroke="#2b1408" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'diego' || type === 'dante' || type === 'amber') {
    return (
      <svg viewBox="0 0 44 44" className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-xs">
        <circle cx="22" cy="22" r="22" fill="#fef08a" />
        <ellipse cx="22" cy="38" rx="14" ry="9" fill="#2563eb" />
        <circle cx="22" cy="20" r="8" fill="#f5c298" />
        <path d="M14 18C15 13 18 11 22 11C26 11 29 13 30 18C28 16 26 15 22 15C18 15 16 16 14 18Z" fill="#1e293b" />
        <circle cx="19.5" cy="20.5" r="1" fill="#0f172a" />
        <circle cx="24.5" cy="20.5" r="1" fill="#0f172a" />
        <path d="M20.5 24C21 24.8 23 24.8 23.5 24" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'isaac' || type === 'emerald') {
    return (
      <svg viewBox="0 0 44 44" className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-xs">
        <circle cx="22" cy="22" r="22" fill="#d1fae5" />
        <ellipse cx="22" cy="38" rx="14" ry="9" fill="#059669" />
        <circle cx="22" cy="20" r="8" fill="#e0a899" />
        <path d="M14 17C14 13 18 11 22 11C26 11 30 13 30 17C30 20 28 22 26 22L18 22C16 22 14 20 14 17Z" fill="#dc2626" />
        <circle cx="19" cy="20.5" r="1" fill="#1f2937" />
        <circle cx="25" cy="20.5" r="1" fill="#1f2937" />
        <path d="M20.5 24C21 24.5 23 24.5 23.5 24" stroke="#1f2937" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'mateo' || type === 'indigo') {
    return (
      <svg viewBox="0 0 44 44" className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-xs">
        <circle cx="22" cy="22" r="22" fill="#bae6fd" />
        <ellipse cx="22" cy="38" rx="14" ry="9" fill="#0284c7" />
        <circle cx="22" cy="20" r="8" fill="#fed7aa" />
        <path d="M14 18C15 13 18 11 22 11C26 11 29 13 30 18C28 16 26 15 22 15C18 15 16 16 14 18Z" fill="#0369a1" />
        <circle cx="19.5" cy="20.5" r="1" fill="#082f49" />
        <circle cx="24.5" cy="20.5" r="1" fill="#082f49" />
        <path d="M20.5 24C21 24.8 23 24.8 23.5 24" stroke="#082f49" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }
  // sofia / violet / default
  return (
    <svg viewBox="0 0 44 44" className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-xs">
      <circle cx="22" cy="22" r="22" fill="#ede9fe" />
      <ellipse cx="22" cy="38" rx="14" ry="9" fill="#7c3aed" />
      <circle cx="22" cy="20" r="8" fill="#fde047" />
      <path d="M14 18C14 13 17 11 22 11C27 11 30 13 30 18C28 16 26 15 22 15C18 15 16 16 14 18Z" fill="#6d28d9" />
      <circle cx="19.5" cy="20" r="1.2" fill="#1e1b4b" />
      <circle cx="24.5" cy="20" r="1.2" fill="#1e1b4b" />
      <path d="M20 23.5C21 24.5 23 24.5 24 23.5" stroke="#1e1b4b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export interface StudentDisplayItem {
  id: string;
  name: string;
  enrollment: string;
  qrCode: string;
  tutor?: string;
  tutorPhone?: string;
  group?: string;
  shift?: string;
  badgeStatus?: string;
  attendedDaysCount?: number;
  daysInMonth?: number;
  attendanceRatio: string;
  attendancePercent: number;
  homeworkScore: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  avatarType: string;
}

const INITIAL_MOCK_STUDENTS: StudentDisplayItem[] = [];

export default function DashboardClientView() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState('Grupo 3° B');
  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    schoolName?: string;
    schoolCycle?: string;
    shift?: string;
    entryTime?: string;
  } | null>(null);
  const [selectedQrStudent, setSelectedQrStudent] = useState<{ name: string; qrCode: string } | null>(null);

  // Fecha seleccionada (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [students, setStudents] = useState<StudentDisplayItem[]>(INITIAL_MOCK_STUDENTS);
  const [kpiStats, setKpiStats] = useState({
    generalAttendance: '0.0%',
    totalRegistered: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    presentPercent: 0,
    latePercent: 0,
    absentPercent: 0,
    monthlyAverage: '0.0%',
    activeBadgesCount: 0,
  });

  // Carga del perfil institucional actualizado del docente
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
      } catch (e) {}
    }

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        })
        .catch((err) => console.warn('Error al cargar perfil docente:', err));
    }
  }, []);

  // Funciones para cambiar y formatear la fecha
  const changeDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day + days);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    const today = new Date();
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month - 1 &&
      today.getDate() === day;

    const months = [
      'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.',
      'Jul.', 'Ago.', 'Sept.', 'Oct.', 'Nov.', 'Dic.'
    ];
    const monthName = months[dateObj.getMonth()] || '';
    const formatted = `${day} de ${monthName} ${year}`;

    return isToday ? `Hoy, ${formatted}` : formatted;
  };

  const processDbRecords = (dailyRecords: any[]) => {
    let present = 0;
    let late = 0;
    let absent = 0;

    const sortedRecords = [...dailyRecords].sort((a, b) => {
      const aName = (a.name || '').toLowerCase().trim();
      const bName = (b.name || '').toLowerCase().trim();
      return aName.localeCompare(bName);
    });

    const fallbacks = ['sabine', 'diego', 'isaac', 'mateo', 'sofia'];

    const mappedList: StudentDisplayItem[] = sortedRecords.map((item: any, idx: number) => {
      const status: 'PRESENT' | 'LATE' | 'ABSENT' = item.status || 'ABSENT';
      if (status === 'PRESENT') present++;
      else if (status === 'LATE') late++;
      else absent++;

      const avatarType = fallbacks[idx % fallbacks.length];
      const hwScore = typeof item.homeworkScore === 'number' ? Math.min(100, Math.max(0, item.homeworkScore)) : 0;
      
      const attendedDays = item.attendedDaysCount ?? 0;
      const totalDays = item.daysInMonth || 1;
      const attPercent = totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 0;
      const attRatio = `${attendedDays} / ${totalDays} Asistencias`;

      const rawEnrollment = item.enrollmentNumber
        ? (item.enrollmentNumber.startsWith('#') ? item.enrollmentNumber : `#${item.enrollmentNumber}`)
        : 'Sin matrícula';

      return {
        id: item.studentId || item.id || item._id,
        name: item.name,
        enrollment: rawEnrollment,
        qrCode: item.qrCode || '',
        tutor: item.tutor || '',
        tutorPhone: item.tutorPhone || '',
        group: item.group || '',
        shift: item.shift || '',
        badgeStatus: item.badgeStatus || 'EMITTED',
        attendanceRatio: attRatio,
        attendancePercent: attPercent,
        attendedDaysCount: attendedDays,
        daysInMonth: totalDays,
        homeworkScore: hwScore,
        status,
        avatarType,
      };
    });

    if (sortedRecords.length > 0 && sortedRecords[0].group) {
      setSelectedGroup(`Grupo ${sortedRecords[0].group}`);
    }

    const total = mappedList.length;
    const pPercent = total > 0 ? Math.round((present / total) * 100) : 0;
    const lPercent = total > 0 ? Math.round((late / total) * 100) : 0;
    const aPercent = total > 0 ? Math.max(0, 100 - pPercent - lPercent) : 0;

    const generalAtt = total > 0 ? (((present + (late * 0.8)) / total) * 100).toFixed(1) : '0.0';

    const totalAttendedMonth = mappedList.reduce((acc, s) => acc + (s.attendedDaysCount || 0), 0);
    const maxDays = mappedList[0]?.daysInMonth || 1;
    const monthlyAvg = total > 0 && maxDays > 0
      ? Math.min(100, Math.round((totalAttendedMonth / (total * maxDays)) * 100))
      : 0;

    const activeBadges = mappedList.filter((s) => s.qrCode && s.badgeStatus !== 'PENDING').length;

    setStudents(mappedList);
    setKpiStats({
      generalAttendance: `${generalAtt}%`,
      totalRegistered: total,
      presentCount: present,
      lateCount: late,
      absentCount: absent,
      presentPercent: pPercent,
      latePercent: lPercent,
      absentPercent: aPercent,
      monthlyAverage: `${monthlyAvg}%`,
      activeBadgesCount: activeBadges,
    });
  };

  // Carga de datos reales desde MongoDB según la fecha seleccionada
  const fetchDashboardData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/attendance/daily?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const dailyData = await res.json();
        if (Array.isArray(dailyData) && dailyData.length > 0) {
          processDbRecords(dailyData);
          return;
        }
      }

      // Si no hay asistencias registradas para esta fecha, consultamos la lista de alumnos
      const studentsRes = await fetch(`${API_BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();
        if (Array.isArray(allStudents) && allStudents.length > 0) {
          const defaultDaily = allStudents.map((s: any) => ({
            studentId: s._id,
            name: s.name,
            enrollmentNumber: s.enrollmentNumber,
            qrCode: s.qrCode,
            status: 'ABSENT',
          }));
          processDbRecords(defaultDaily);
          return;
        }
      }

      processDbRecords([]);
    } catch (err) {
      console.warn('Error al cargar datos reales de asistencia:', err);
    }
  }, [selectedDate]);

  // Exportar lista actual a archivo Excel (.xlsx)
  const exportToExcel = () => {
    if (students.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      const data: any[][] = [
        ['REPORTE DE ASISTENCIA DIARIA - EDUCAQR'],
        [`Fecha: ${selectedDate} (${formatDisplayDate(selectedDate)})`],
        [`Grupo: ${selectedGroup}`],
        [`Total Alumnos: ${kpiStats.totalRegistered}`],
        [`Presentes: ${kpiStats.presentCount} (${kpiStats.presentPercent}%)`],
        [`Retardos: ${kpiStats.lateCount} (${kpiStats.latePercent}%)`],
        [`Ausentes: ${kpiStats.absentCount} (${kpiStats.absentPercent}%)`],
        [],
        [
          'N°',
          'Nombre del Alumno',
          'Matrícula',
          'Estado',
          'Ratio Asistencia',
          '% Asistencia',
          'Código QR',
        ],
      ];

      students.forEach((st, idx) => {
        const statusLabel =
          st.status === 'PRESENT'
            ? 'Presente'
            : st.status === 'LATE'
            ? 'Retardo'
            : 'Ausente';

        data.push([
          idx + 1,
          st.name,
          st.enrollment.replace(/^#/, ''),
          statusLabel,
          st.attendanceRatio,
          `${st.attendancePercent}%`,
          st.qrCode,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(data);

      ws['!cols'] = [
        { wch: 6 },
        { wch: 34 },
        { wch: 18 },
        { wch: 16 },
        { wch: 26 },
        { wch: 22 },
        { wch: 24 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Pase de Lista');

      const fileName = `Pase_de_Lista_${selectedDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Excel descargado: ${fileName}`);
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      toast.error('Ocurrió un error al generar el archivo Excel');
    }
  };

  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const handleUpdateAttendanceStatus = async (studentId: string, newStatus: 'PRESENT' | 'LATE' | 'ABSENT') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Sesión no válida');
      return;
    }

    try {
      setUpdatingStudentId(studentId);

      // Actualización optimista de la lista local
      setStudents((prevList) =>
        prevList.map((st) =>
          st.id === studentId ? { ...st, status: newStatus } : st
        )
      );

      // Actualización optimista de contadores KPI
      setKpiStats((prev) => {
        const currentStudent = students.find((s) => s.id === studentId);
        if (!currentStudent || currentStudent.status === newStatus) return prev;

        let present = prev.presentCount;
        let late = prev.lateCount;
        let absent = prev.absentCount;

        if (currentStudent.status === 'PRESENT') present--;
        else if (currentStudent.status === 'LATE') late--;
        else if (currentStudent.status === 'ABSENT') absent--;

        if (newStatus === 'PRESENT') present++;
        else if (newStatus === 'LATE') late++;
        else if (newStatus === 'ABSENT') absent++;

        const total = prev.totalRegistered;
        const pPercent = total > 0 ? Math.round((present / total) * 100) : 0;
        const lPercent = total > 0 ? Math.round((late / total) * 100) : 0;
        const aPercent = total > 0 ? Math.max(0, 100 - pPercent - lPercent) : 0;
        const generalAtt = total > 0 ? (((present + (late * 0.8)) / total) * 100).toFixed(1) : '0.0';

        return {
          ...prev,
          presentCount: present,
          lateCount: late,
          absentCount: absent,
          presentPercent: pPercent,
          latePercent: lPercent,
          absentPercent: aPercent,
          generalAttendance: `${generalAtt}%`,
        };
      });

      const res = await fetch(`${API_BASE_URL}/attendance/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al actualizar estado en el servidor');
      }

      toast.success(
        newStatus === 'PRESENT'
          ? 'Asistencia marcada como Presente'
          : newStatus === 'LATE'
          ? 'Asistencia marcada como Retardo'
          : 'Asistencia marcada como Ausente'
      );

      // Re-fetch para sincronizar métricas y ratios acumulados con MongoDB
      fetchDashboardData();
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      toast.error('No se pudo actualizar el estado de asistencia');
      fetchDashboardData();
    } finally {
      setUpdatingStudentId(null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Suscripción WebSocket en tiempo real para sincronizar asistencia
  useEffect(() => {
    const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!savedToken || !savedUserStr) return;

    try {
      const parsedUser = JSON.parse(savedUserStr);
      const teacherId = parsedUser.teacherId || parsedUser.id || parsedUser._id;
      if (teacherId) {
        const socket = connectSocket(teacherId, savedToken);
        const handleScan = () => {
          fetchDashboardData();
        };

        socket.on('newScanRecord', handleScan);
        socket.on('student_scanned_attendance', handleScan);

        return () => {
          socket.off('newScanRecord', handleScan);
          socket.off('student_scanned_attendance', handleScan);
        };
      }
    } catch (err) {
      console.error('Error al inicializar WebSockets en el Dashboard:', err);
    }
  }, [fetchDashboardData]);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-7 space-y-7">
        {/* ===== BARRA DE TÍTULO & SELECTORES ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Pase de Lista Diario
            </h1>
          </div>

          {/* Selector y Navegador de Fecha */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs self-start md:self-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => changeDate(-1)}
              className="h-8 w-8 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft size={18} />
            </Button>

            <div className="flex items-center gap-2 px-3 py-1 font-extrabold text-xs text-slate-800">
              <Calendar size={15} className="text-slate-500" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => changeDate(1)}
              className="h-8 w-8 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* ===== COMPONENTE RESUMEN KPI & PASE DE LISTA QR ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card Principal de Resumen General */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              {/* Header Superior del Card */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <Badge variant="neutral" className="gap-1.5 bg-[#e0f2fe] text-sky-800 font-extrabold text-xs px-3 py-1.5 rounded-full border-none">
                  <Calendar size={14} />
                  <span>{formatDisplayDate(selectedDate)}</span>
                </Badge>
                <span className="text-xs font-semibold text-slate-600">
                  Turno {currentUser?.shift || 'Matutino'} • Ciclo {currentUser?.schoolCycle || '2025-2026'}
                </span>
              </div>

              {/* Contenido Central: 2 Columnas con Divisor Vertical */}
              <div className="grid grid-cols-2 gap-4 mt-6 items-center">
                {/* Columna Izquierda: Asistencia General Hoy */}
                <div className="pr-4">
                  <div className="text-xs font-bold text-slate-600 leading-snug">
                    Asistencia General
                    <br />
                    Hoy
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight my-2">
                    {kpiStats.generalAttendance}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#16a34a]">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
                    <span>Promedio mensual {kpiStats.monthlyAverage}</span>
                  </div>
                </div>

                {/* Divisor & Columna Derecha: Alumnos Registrados */}
                <div className="border-l border-slate-100 pl-6">
                  <div className="text-xs font-bold text-slate-600 leading-snug">
                    Alumnos
                    <br />
                    Registrados
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight my-2">
                    {kpiStats.totalRegistered}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    {kpiStats.activeBadgesCount} / {kpiStats.totalRegistered} credenciales QR activas
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Inferior: Pase de Lista QR */}
            <div className="mt-6 pt-2">
              <Button
                type="button"
                onClick={() => router.push('/scanner')}
                className="w-full bg-[#009ee3] hover:bg-[#0284c7] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-full shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm h-auto"
              >
                <QrCode size={18} />
                <span>Pase de Lista QR</span>
              </Button>
            </div>
          </div>

          {/* 3 Tarjetas de Estado: PRESENTES, RETARDOS, AUSENTES */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: PRESENTES */}
            <div className="bg-[#78c728] rounded-[2.2rem] p-5 sm:p-6 text-slate-950 flex flex-col justify-between min-h-[220px] shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900/90">
                  PRESENTES
                </span>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 shadow-xs">
                  <svg viewBox="0 0 44 44" className="w-7 h-7 rounded-full">
                    <circle cx="22" cy="22" r="22" fill="#fef08a" />
                    <ellipse cx="22" cy="38" rx="14" ry="9" fill="#059669" />
                    <circle cx="22" cy="20" r="8" fill="#e0a899" />
                    <path d="M14 17C14 13 18 11 22 11C26 11 30 13 30 17C30 20 28 22 26 22L18 22C16 22 14 20 14 17Z" fill="#78350f" />
                    <circle cx="19.5" cy="20.5" r="1" fill="#1f2937" />
                    <circle cx="24.5" cy="20.5" r="1" fill="#1f2937" />
                    <path d="M20.5 24.5C21 25 23 25 23.5 24.5" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="text-5xl sm:text-6xl font-black text-slate-950 tracking-tight leading-none">
                  {kpiStats.presentCount}
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-black text-slate-950">
                  {kpiStats.presentPercent}% de la clase
                </div>
                <div className="text-[11px] font-bold text-slate-900/80 mt-0.5">
                  {kpiStats.presentCount} alumnos escaneados
                </div>
              </div>
            </div>

            {/* Card 2: RETARDOS */}
            <div className="bg-[#fbb01b] rounded-[2.2rem] p-5 sm:p-6 text-slate-950 flex flex-col justify-between min-h-[220px] shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900/90">
                  RETARDOS
                </span>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 shadow-xs">
                  <svg viewBox="0 0 44 44" className="w-7 h-7 rounded-full">
                    <circle cx="22" cy="22" r="22" fill="#fed7aa" />
                    <ellipse cx="22" cy="38" rx="14" ry="9" fill="#2563eb" />
                    <circle cx="22" cy="20" r="8" fill="#f5c298" />
                    <path d="M14 18C15 13 18 11 22 11C26 11 29 13 30 18C28 16 26 15 22 15C18 15 16 16 14 18Z" fill="#1e293b" />
                    <circle cx="19.5" cy="20.5" r="1" fill="#0f172a" />
                    <circle cx="24.5" cy="20.5" r="1" fill="#0f172a" />
                    <path d="M20.5 24C21 24.8 23 24.8 23.5 24" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="text-5xl sm:text-6xl font-black text-slate-950 tracking-tight leading-none">
                  {kpiStats.lateCount}
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-black text-slate-950">
                  {kpiStats.latePercent}% de la clase
                </div>
                <div className="text-[11px] font-bold text-slate-900/80 mt-0.5">
                  {kpiStats.lateCount} alumnos con retardo
                </div>
              </div>
            </div>

            {/* Card 3: AUSENTES */}
            <div className="bg-[#ff6f43] rounded-[2.2rem] p-5 sm:p-6 text-white flex flex-col justify-between min-h-[220px] shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white/95">
                  AUSENTES
                </span>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 shadow-xs">
                  <svg viewBox="0 0 44 44" className="w-7 h-7 rounded-full">
                    <circle cx="22" cy="22" r="22" fill="#fcd5ce" />
                    <ellipse cx="22" cy="38" rx="14" ry="9" fill="#dc2626" />
                    <circle cx="22" cy="20" r="8" fill="#fed7aa" />
                    <path d="M14 19C14 14 17 11 22 11C27 11 30 14 30 19C28 17 26 17 22 17C18 17 16 17 14 19Z" fill="#592d1d" />
                    <circle cx="19.5" cy="20.5" r="1" fill="#2b1408" />
                    <circle cx="24.5" cy="20.5" r="1" fill="#2b1408" />
                    <path d="M20.5 24C21 24.5 23 24.5 23.5 24" stroke="#2b1408" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none">
                  {kpiStats.absentCount}
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-black text-white">
                  {kpiStats.absentPercent}% de la clase
                </div>
                <div className="text-[11px] font-medium text-white/90 mt-0.5">
                  {kpiStats.absentCount} alumnos sin registrar
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABLA DE ALUMNOS Y ESTADO DE ASISTENCIA ===== */}
        <section className="space-y-3.5">
          {/* Encabezado de Sección con Botón de Exportación Excel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Asistencia y Alumnos
            </h2>

            {/* Botón Descargar Pase de Lista en Excel */}
            <Button
              type="button"
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-black py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer border border-emerald-500/80 shrink-0 self-start sm:self-auto h-auto"
              title={`Descargar pase de lista del ${selectedDate} en Excel`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Descargar Pase de Lista (Excel)</span>
              <Download className="w-3.5 h-3.5 text-emerald-200" />
            </Button>
          </div>

          {/* Contenedor Principal de la Lista */}
          <div className="space-y-3">
            {/* Cabecera de Columnas */}
            <div className="grid grid-cols-12 gap-4 px-6 text-[11px] font-black uppercase text-slate-400 tracking-wider items-center pb-1">
              <div className="col-span-12 md:col-span-4 flex items-center gap-1">
                <span>ALUMNO</span>
                <ChevronUp size={14} className="text-slate-500" />
              </div>

              <div className="hidden md:block col-span-3">
                ASISTENCIA & REGISTRO
              </div>

              <div className="hidden md:block col-span-5 text-center">
                ESTADO DE ASISTENCIA
              </div>
            </div>

            {/* Filas de Alumnos */}
            {students.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6 shadow-xs">
                <p className="font-extrabold text-sm text-slate-700">No hay alumnos registrados</p>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Registra alumnos en la sección &quot;Registrar Alumnos&quot; para visualizar sus métricas en tiempo real.
                </p>
              </div>
            ) : (
              students.map((student) => {
                const percent = student.attendancePercent;
                const barColor =
                  percent >= 90
                    ? 'bg-[#84cc16]'
                    : percent >= 80
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#ef4444]';

                const textColor =
                  percent >= 90
                    ? 'text-[#84cc16]'
                    : percent >= 80
                    ? 'text-[#f59e0b]'
                    : 'text-[#ef4444]';

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 grid grid-cols-12 gap-4 items-center border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all"
                  >
                    {/* Columna 1: ALUMNO */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3.5">
                      <StudentAvatar type={student.avatarType} />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {student.name}
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Matrícula: {student.enrollment}</span>
                          {student.tutor ? (
                            <span className="text-slate-500 font-semibold truncate">
                              • Tutor: <strong className="text-slate-700">{student.tutor}</strong>
                              {student.tutorPhone ? ` (${student.tutorPhone})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">• Sin tutor</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Columna 2: ASISTENCIA & REGISTRO */}
                    <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 text-[11px]">
                          {student.attendanceRatio}
                        </span>
                        <span className={`font-extrabold text-[11px] ${textColor}`}>
                          {student.attendancePercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${student.attendancePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Columna 3: ESTADO DE ASISTENCIA */}
                    <div className="col-span-12 sm:col-span-6 md:col-span-5 flex items-center justify-start md:justify-center">
                      <div className="bg-[#f1f5f9]/70 p-1 rounded-full inline-flex items-center gap-1 border border-slate-200/50">
                        {/* Opción Presente */}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleUpdateAttendanceStatus(student.id, 'PRESENT')}
                          disabled={updatingStudentId === student.id}
                          className={cn(
                            'transition-all rounded-full text-xs h-auto cursor-pointer',
                            student.status === 'PRESENT'
                              ? 'bg-[#84cc16] hover:bg-[#84cc16] text-slate-950 font-black px-3.5 py-1.5 shadow-xs flex items-center gap-1.5'
                              : 'text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5'
                          )}
                        >
                          {student.status === 'PRESENT' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                          )}
                          <span>Presente</span>
                        </Button>

                        {/* Opción Retardo */}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleUpdateAttendanceStatus(student.id, 'LATE')}
                          disabled={updatingStudentId === student.id}
                          className={cn(
                            'transition-all rounded-full text-xs h-auto cursor-pointer',
                            student.status === 'LATE'
                              ? 'bg-[#f59e0b] hover:bg-[#f59e0b] text-slate-950 font-black px-3.5 py-1.5 shadow-xs flex items-center gap-1.5'
                              : 'text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5'
                          )}
                        >
                          {student.status === 'LATE' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                          )}
                          <span>Retardo</span>
                        </Button>

                        {/* Opción Ausente */}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleUpdateAttendanceStatus(student.id, 'ABSENT')}
                          disabled={updatingStudentId === student.id}
                          className={cn(
                            'transition-all rounded-full text-xs h-auto cursor-pointer',
                            student.status === 'ABSENT'
                              ? 'bg-[#ef4444] hover:bg-[#ef4444] text-white font-bold px-3.5 py-1.5 shadow-xs flex items-center gap-1.5'
                              : 'text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5'
                          )}
                        >
                          {student.status === 'ABSENT' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                          <span>Ausente</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>


    </>
  );
}
