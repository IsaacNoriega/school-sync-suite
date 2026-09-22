'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/config/api';
import { HistoryHeader } from './HistoryHeader';
import { HistoryDateNavigator } from './HistoryDateNavigator';
import { HistoryStatsCards } from './HistoryStatsCards';
import { HistoryFilters } from './HistoryFilters';
import { StudentAttendanceTable } from './StudentAttendanceTable';
import { MonthlyAttendanceTable } from './MonthlyAttendanceTable';
import { exportMonthlyAttendanceToExcel } from './exportAttendanceExcel';
import {
  DailyAttendanceStudent,
  AttendanceDbStatus,
  AttendanceFilterStatus,
  AttendanceSummaryStats,
  HistoryViewProps,
} from './types';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const AttendanceHistoryView: React.FC<HistoryViewProps> = ({
  isModal = false,
  isOpen = true,
  onClose,
  initialDate,
  onAttendanceUpdated,
}) => {
  // Inicialización de fechas
  const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);

  // Modo de vista: Pase Diario vs Sábana Mensual
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // Mes seleccionado para el reporte mensual (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return (initialDate || todayStr).substring(0, 7);
  });

  // Estados de datos para vista diaria
  const [students, setStudents] = useState<DailyAttendanceStudent[]>([]);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  // Estados de filtrado diario
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<AttendanceFilterStatus>('ALL');

  // Estados para reporte mensual y exportación a Excel
  const [monthlyData, setMonthlyData] = useState<{
    month: string;
    daysInMonth: number;
    students: Array<{ _id: string; name: string; enrollmentNumber: string; tutor?: string }>;
    records: Record<string, Record<string, { status: string; scannedAt?: string | Date }>>;
    summaries: Record<
      string,
      { presents: number; lates: number; absents: number; totalRecords: number; attendanceRate: number }
    >;
  }>({
    month: selectedMonth,
    daysInMonth: 30,
    students: [],
    records: {},
    summaries: {},
  });
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Obtener nombre del docente desde localStorage para el encabezado de Excel
  const teacherName = useMemo(() => {
    if (typeof window === 'undefined') return 'Docente Titular';
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        return u.name || u.email || 'Docente Titular';
      }
    } catch {}
    return 'Docente Titular';
  }, []);

  // Carga de datos de asistencia diaria
  const fetchDailyAttendance = useCallback(
    async (date: string, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingDaily(true);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setLoadingDaily(false);
        setRefreshing(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/attendance/daily?date=${date}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: DailyAttendanceStudent[] = data.map((item: any) => {
              const studentIdStr = typeof item.studentId === 'string'
                ? item.studentId
                : (item.studentId?._id ? String(item.studentId._id) : (item.id || item._id ? String(item._id || item.id) : ''));
              const attendanceIdStr = item.attendanceId
                ? (typeof item.attendanceId === 'string' ? item.attendanceId : (item.attendanceId._id ? String(item.attendanceId._id) : null))
                : null;

              return {
                studentId: studentIdStr,
                name: item.name,
                enrollmentNumber: item.enrollmentNumber || '#EQR-0000',
                qrCode: item.qrCode,
                tutor: item.tutor,
                tutorPhone: item.tutorPhone,
                badgeStatus: item.badgeStatus,
                attendanceId: attendanceIdStr,
                status: (item.status as AttendanceDbStatus) || 'ABSENT',
                scannedAt: item.scannedAt,
                attendedDaysCount: item.attendedDaysCount,
                daysInMonth: item.daysInMonth,
                attendanceRatio: item.attendanceRatio,
                homeworkScore: item.homeworkScore,
              };
            });
            setStudents(mapped);
            return;
          }
        }

        // Si no existen registros de asistencia para esta fecha, consultamos la lista de alumnos
        const fallbackRes = await fetch(`${API_BASE_URL}/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (fallbackRes.ok) {
          const allStudents = await fallbackRes.json();
          if (Array.isArray(allStudents)) {
            const defaultRecords: DailyAttendanceStudent[] = allStudents.map((s: any) => ({
              studentId: s._id,
              name: s.name,
              enrollmentNumber: s.enrollmentNumber || '#EQR-0000',
              qrCode: s.qrCode,
              tutor: s.tutor,
              tutorPhone: s.tutorPhone,
              status: 'ABSENT',
              scannedAt: null,
            }));
            setStudents(defaultRecords);
            return;
          }
        }

        setStudents([]);
      } catch (err) {
        console.error('Error al cargar historial diario de asistencias:', err);
      } finally {
        setLoadingDaily(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Carga de reporte mensual para la sábana de asistencias
  const fetchMonthlyReport = useCallback(
    async (monthToFetch: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      try {
        setLoadingMonthly(true);
        const res = await fetch(`${API_BASE_URL}/attendance/monthly-report?month=${monthToFetch}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setMonthlyData({
            month: data.month || monthToFetch,
            daysInMonth: data.daysInMonth || 30,
            students: data.students || [],
            records: data.records || {},
            summaries: data.summaries || {},
          });
          return data;
        }
      } catch (err) {
        console.error('Error al cargar reporte mensual:', err);
      } finally {
        setLoadingMonthly(false);
      }
      return null;
    },
    []
  );

  // Carga inicial y por cambio de fecha
  useEffect(() => {
    if (isOpen) {
      fetchDailyAttendance(selectedDate);
    }
  }, [selectedDate, isOpen, fetchDailyAttendance]);

  // Si cambia el mes seleccionado o se cambia a vista mensual, cargar sábana mensual
  useEffect(() => {
    if (isOpen && viewMode === 'monthly') {
      fetchMonthlyReport(selectedMonth);
    }
  }, [selectedMonth, viewMode, isOpen, fetchMonthlyReport]);

  // Actualizar mes automáticamente si el usuario navega a un día de otro mes en la vista diaria
  useEffect(() => {
    const monthOfDate = selectedDate.substring(0, 7);
    if (monthOfDate !== selectedMonth) {
      setSelectedMonth(monthOfDate);
    }
  }, [selectedDate, selectedMonth]);

  // Exportación a Excel de la sábana de asistencia mensual
  const handleExportMonthToExcel = async () => {
    setIsExportingExcel(true);
    const toastId = toast.loading('Generando sábana de asistencia mensual en Excel...');

    try {
      let dataToExport = monthlyData;

      // Si aún no se han cargado los datos del mes o el mes difiere, consultar
      if (monthlyData.month !== selectedMonth || monthlyData.students.length === 0) {
        const fetched = await fetchMonthlyReport(selectedMonth);
        if (fetched) {
          dataToExport = fetched;
        }
      }

      if (!dataToExport || dataToExport.students.length === 0) {
        toast.error('No hay alumnos registrados para generar el reporte de este mes.', { id: toastId });
        return;
      }

      const [yStr, mStr] = selectedMonth.split('-');
      const yearNum = parseInt(yStr, 10);
      const monthNum = parseInt(mStr, 10);
      const monthName = MONTH_NAMES[monthNum - 1] || 'Mes';

      exportMonthlyAttendanceToExcel({
        month: selectedMonth,
        year: yearNum,
        monthName,
        daysInMonth: dataToExport.daysInMonth,
        students: dataToExport.students,
        records: dataToExport.records,
        summaries: dataToExport.summaries,
        teacherName,
        groupName: 'Primaria',
      });

      toast.success(`Reporte mensual de ${monthName} ${yearNum} descargado con éxito`, { id: toastId });
    } catch (err: any) {
      console.error('Error exportando reporte a Excel:', err);
      toast.error('No se pudo generar el archivo de Excel. Inténtalo de nuevo.', { id: toastId });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Corrección manual rápida con actualización optimista
  const handleStatusChange = async (studentId: string, newStatus: AttendanceDbStatus) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    setUpdatingStudentId(studentId);
    const previousStudents = [...students];

    // Actualización optimista inmediata en UI
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          return {
            ...s,
            status: newStatus,
            scannedAt: newStatus !== 'ABSENT' ? new Date() : null,
          };
        }
        return s;
      })
    );

    try {
      const cleanStudentId = typeof studentId === 'object' && studentId
        ? String((studentId as any)._id || (studentId as any).id || studentId)
        : String(studentId || '').trim();

      const res = await fetch(`${API_BASE_URL}/attendance/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: cleanStudentId,
          date: selectedDate,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al actualizar estado en el servidor');
      }

      onAttendanceUpdated?.();
      // Si la sábana mensual ya estaba cargada, invalidar para sincronizar
      if (viewMode === 'monthly') {
        fetchMonthlyReport(selectedMonth);
      }
    } catch (err) {
      console.error('Error en corrección manual:', err);
      setStudents(previousStudents);
    } finally {
      setUpdatingStudentId(null);
    }
  };

  // Marcar a todos los alumnos como presentes en la fecha actual
  const handleMarkAllPresent = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const confirmed = window.confirm(
      `¿Deseas marcar a todos los alumnos como PRESENTES para el día ${selectedDate}?`
    );
    if (!confirmed) return;

    setIsMarkingAll(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/mark-all-present`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
        }),
      });

      if (res.ok) {
        await fetchDailyAttendance(selectedDate, true);
        onAttendanceUpdated?.();
        if (viewMode === 'monthly') {
          fetchMonthlyReport(selectedMonth);
        }
      }
    } catch (err) {
      console.error('Error al marcar todos presentes:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Cálculo de estadísticas consolidadas diarias
  const stats: AttendanceSummaryStats = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === 'PRESENT').length;
    const late = students.filter((s) => s.status === 'LATE').length;
    const absent = students.filter((s) => s.status === 'ABSENT').length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, late, absent, attendanceRate };
  }, [students]);

  // Filtrado de alumnos diarios por búsqueda y estatus
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (filterStatus !== 'ALL' && student.status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesEnrollment = student.enrollmentNumber.toLowerCase().includes(query);
        return matchesName || matchesEnrollment;
      }
      return true;
    });
  }, [students, filterStatus, searchQuery]);

  if (isModal && !isOpen) {
    return null;
  }

  const content = (
    <div className="flex flex-col flex-1 gap-6">
      {/* 1. Header con acciones principales, cambio de modo y exportación */}
      <HistoryHeader
        isModal={isModal}
        onClose={onClose}
        onMarkAllPresent={handleMarkAllPresent}
        isMarkingAll={isMarkingAll}
        onRefresh={() => {
          if (viewMode === 'daily') {
            fetchDailyAttendance(selectedDate, true);
          } else {
            fetchMonthlyReport(selectedMonth);
          }
        }}
        isRefreshing={refreshing || loadingMonthly}
        totalStudents={students.length || monthlyData.students.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExportExcel={handleExportMonthToExcel}
        isExportingExcel={isExportingExcel}
      />

      {/* 2. Renderizado condicional según modo seleccionado */}
      {viewMode === 'daily' ? (
        <div className="space-y-6">
          {/* Navegador de fechas < Hoy > y selector de fecha */}
          <HistoryDateNavigator
            selectedDate={selectedDate}
            onDateChange={(newDate) => setSelectedDate(newDate)}
            isLoading={loadingDaily || refreshing}
          />

          {/* Tarjetas KPI interactivas */}
          <HistoryStatsCards
            stats={stats}
            activeFilter={filterStatus}
            onFilterChange={setFilterStatus}
          />

          {/* Buscador y píldoras de filtro */}
          <HistoryFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            stats={stats}
          />

          {/* Tabla de asistencia diaria con pase de lista y corrección rápida */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 overflow-hidden">
            <StudentAttendanceTable
              students={filteredStudents}
              isLoading={loadingDaily}
              onStatusChange={handleStatusChange}
              updatingStudentId={updatingStudentId}
            />
          </div>
        </div>
      ) : (
        /* Vista de Sábana Mensual */
        <MonthlyAttendanceTable
          month={selectedMonth}
          daysInMonth={monthlyData.daysInMonth}
          students={monthlyData.students}
          records={monthlyData.records}
          summaries={monthlyData.summaries}
          isLoading={loadingMonthly}
          onMonthChange={(newMonth) => {
            setSelectedMonth(newMonth);
            fetchMonthlyReport(newMonth);
          }}
          onExportExcel={handleExportMonthToExcel}
          isExporting={isExportingExcel}
        />
      )}
    </div>
  );

  // Renderizado como modal de pantalla completa si se solicita explícitamente
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-6xl w-full h-[92vh] shadow-2xl border border-slate-100 flex flex-col overflow-y-auto animate-scale-up">
          {content}
        </div>
      </div>
    );
  }

  // Renderizado regular de página completa
  return <div className="w-full">{content}</div>;
};

export default AttendanceHistoryView;
