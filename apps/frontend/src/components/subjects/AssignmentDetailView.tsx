'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  QrCode,
  Download,
  CheckCircle2,
  Clock,
  Star,
  Search,
  Pencil,
  FileSpreadsheet,
  AlertCircle,
  DraftingCompass,
  BookOpen,
  FlaskConical,
  Palette,
  Music,
  Trophy,
  ClipboardList,
  LucideIcon,
  X,
  Check,
  Sliders,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Button, Badge, Input, Card } from '@/components/ui';
import { API_BASE_URL } from '@/config/api';
import dynamic from 'next/dynamic';

const StudentQrModal = dynamic(() => import('@/components/StudentQrModal'), { ssr: false });

export interface AssignmentDetailProps {
  assignment: {
    _id: string;
    title: string;
    code?: string;
    description?: string;
    dueDate?: string;
    maxScore: number;
    color?: string;
    iconKey?: string;
    subject?: {
      _id: string;
      name: string;
      code?: string;
      color?: string;
      iconKey?: string;
    };
  };
  onBack: () => void;
}

export interface StudentGradeRecord {
  studentId: string;
  name: string;
  enrollmentNumber: string;
  qrCode: string;
  gradeId: string | null;
  score: number | null;
  gradedAt: string | null;
  manualCorrection: boolean;
  sheetCode?: string;
}

const AVATAR_BG_COLORS = [
  { bg: 'bg-[#bae6fd]', text: 'text-[#0284c7]' }, // DC - sky blue
  { bg: 'bg-[#bbf7d0]', text: 'text-[#15803d]' }, // IN - emerald green
  { bg: 'bg-[#fef08a]', text: 'text-[#a16207]' }, // SM - amber/tan
  { bg: 'bg-[#fecdd3]', text: 'text-[#e11d48]' }, // MS - pink/red
  { bg: 'bg-[#e9d5ff]', text: 'text-[#7e22ce]' }, // VR - purple
  { bg: 'bg-[#fed7aa]', text: 'text-[#c2410c]' }, // orange
];

function getInitials(name: string) {
  if (!name) return 'AL';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function AssignmentDetailView({ assignment, onBack }: AssignmentDetailProps) {
  const router = useRouter();

  const [studentGrades, setStudentGrades] = useState<StudentGradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'delivered' | 'pending' | 'excellent'>('all');
  const [selectedQrStudent, setSelectedQrStudent] = useState<{ name: string; qrCode: string } | null>(null);

  // Modal para editar nota manualmente
  const [editScoreModal, setEditScoreModal] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    currentScore: number;
    loading: boolean;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    currentScore: 10,
    loading: false,
  });

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  };

  const fetchGrades = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/grades/assignment?assignmentId=${assignment._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: any[] = await res.json();
        
        // Mapear registros asignando número de hoja simulado para diseño fiel
        const mapped: StudentGradeRecord[] = data.map((item, idx) => ({
          studentId: item.studentId,
          name: item.name,
          enrollmentNumber: item.enrollmentNumber || `#K-${String(idx + 1).padStart(3, '0')}`,
          qrCode: item.qrCode || `QR-${item.studentId}`,
          gradeId: item.gradeId,
          score: item.score,
          gradedAt: item.gradedAt,
          manualCorrection: item.manualCorrection,
          sheetCode: `Hoja A-${idx + 1}`,
        }));

        setStudentGrades(mapped);
      }
    } catch (err) {
      console.error('Error al cargar calificaciones de la tarea:', err);
      toast.error('No se pudieron obtener las calificaciones');
    } finally {
      setLoading(false);
    }
  }, [assignment._id]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Manejador de Guardar Calificación Manual
  const handleSaveScore = async () => {
    const { studentId, currentScore } = editScoreModal;
    if (!studentId) return;

    const token = getAuthToken();
    setEditScoreModal((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/grades/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          assignmentId: assignment._id,
          score: currentScore,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al guardar calificación');
      }

      toast.success('Calificación actualizada con éxito');
      setEditScoreModal({ isOpen: false, studentId: '', studentName: '', currentScore: 10, loading: false });
      fetchGrades();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar la nota');
      setEditScoreModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Exportar Excel de esta tarea específica
  const handleExportTaskExcel = () => {
    if (studentGrades.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      const maxScore = assignment.maxScore || 10;
      const data: any[][] = [
        [`REPORTE DE TAREA: ${assignment.title.toUpperCase()}`],
        [`Materia: ${assignment.subject?.name || 'Materia'}`],
        [`Ponderación Máxima: ${maxScore} pts`],
        [`Fecha de Exportación: ${new Date().toLocaleDateString('es-MX')}`],
        [],
        ['N°', 'Matrícula', 'Nombre del Alumno', 'Estado', 'Hora de Escaneo', 'Calificación', 'Porcentaje'],
      ];

      studentGrades.forEach((st, idx) => {
        const isDelivered = st.score !== null && st.score !== undefined;
        const status = isDelivered ? 'Entregado' : 'Pendiente';
        const formattedTime = st.gradedAt
          ? new Date(st.gradedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          : '-';
        const scoreStr = isDelivered ? `${st.score} / ${maxScore}` : 'Sin calificar';
        const percentStr = isDelivered ? `${Math.round((st.score! / maxScore) * 100)}%` : '0%';

        data.push([
          idx + 1,
          st.enrollmentNumber.replace(/^#/, ''),
          st.name,
          status,
          formattedTime,
          scoreStr,
          percentStr,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 16 },
        { wch: 34 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
      const fileName = `Reporte_${assignment.title.replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Archivo generado: ${fileName}`);
    } catch (e) {
      console.error('Error al exportar Excel:', e);
      toast.error('Ocurrió un error al generar el Excel');
    }
  };

  // Cálculos estadísticos KPI
  const totalCount = studentGrades.length;
  const deliveredList = studentGrades.filter((g) => g.score !== null && g.score !== undefined);
  const deliveredCount = deliveredList.length;
  const pendingCount = Math.max(0, totalCount - deliveredCount);

  const deliveredPercent = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;
  const pendingPercent = totalCount > 0 ? Math.max(0, 100 - deliveredPercent) : 0;

  const maxScore = assignment.maxScore || 10;
  let totalScoreSum = 0;
  let excellentCount = 0;

  deliveredList.forEach((g) => {
    const sc = g.score || 0;
    totalScoreSum += sc;
    if (sc >= maxScore * 0.9) {
      excellentCount++;
    }
  });

  const averageScore = deliveredCount > 0 ? (totalScoreSum / deliveredCount).toFixed(1) : '0.0';
  const averagePercent = deliveredCount > 0 ? Math.round(((totalScoreSum / deliveredCount) / maxScore) * 100) : 0;

  // Filtrado de alumnos por búsqueda y por pestañas de filtro
  const filteredStudents = studentGrades.filter((st) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      st.name.toLowerCase().includes(query) ||
      st.enrollmentNumber.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    const isDelivered = st.score !== null && st.score !== undefined;
    const isExcellent = isDelivered && (st.score! >= maxScore * 0.9);

    if (filterTab === 'delivered') return isDelivered;
    if (filterTab === 'pending') return !isDelivered;
    if (filterTab === 'excellent') return isExcellent;

    return true;
  });

  const formatScanTime = (isoDate?: string | null) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const subjectName = assignment.subject?.name || 'Matemáticas III';

  const formattedDueDate = (() => {
    if (!assignment.dueDate) return 'Sin fecha límite';
    try {
      const d = new Date(assignment.dueDate);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
          return `Hoy, ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return assignment.dueDate;
  })();

  return (
    <>
      <main className="max-w-[1400px] mx-auto px-6 sm:px-10 mt-6 space-y-7 animate-in fade-in duration-300">
        
        {/* ===== BREADCRUMB & BOTÓN VOLVER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-extrabold text-xs bg-white px-4 py-2.5 rounded-full shadow-2xs border border-slate-200/80 transition-all cursor-pointer self-start"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Volver a Materias y Tareas</span>
          </Button>

          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 flex-wrap">
            <span className="cursor-pointer hover:text-slate-900" onClick={onBack}>Materias y Tareas</span>
            <span>›</span>
            <span className="font-bold text-slate-700">{subjectName}</span>
            <span>›</span>
            <span className="font-bold text-sky-800">{assignment.title}</span>
          </div>
        </div>

        {/* ===== CARD HERO DE LA TAREA ===== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0 shadow-2xs border border-amber-200/60 mt-0.5">
              <DraftingCompass size={28} strokeWidth={2.2} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge className="bg-[#e0f2fe] text-sky-800 font-black text-xs px-3 py-1 rounded-full border-none">
                  {assignment.code || 'QR-MAT-01'}
                </Badge>
                <Badge className="bg-[#dcfce7] text-[#15803d] font-extrabold text-xs px-3 py-1 rounded-full border-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                  <span>En Curso / Recepción Activa</span>
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {assignment.title}
              </h1>

              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} className="text-slate-500" />
                  {subjectName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500" />
                  {formattedDueDate}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Sliders size={14} className="text-slate-500" />
                  Ponderación: {maxScore} Puntos
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportTaskExcel}
              leftIcon={<Download size={16} />}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-black px-4 py-3 rounded-2xl shadow-2xs cursor-pointer h-auto"
            >
              Exportar Reporte (CSV/Excel)
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={() => router.push(`/scanner?mode=grades&assignmentId=${assignment._id}`)}
              leftIcon={<QrCode size={18} />}
              className="bg-[#009ee3] hover:bg-[#0284c7] text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-sky-500/25 transition-all cursor-pointer h-auto"
            >
              Escanear QR de Tarea
            </Button>
          </div>

        </div>

        {/* ===== TARJETAS RESUMEN KPI (3 TARJETAS EN FILA) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Tarjeta 1: ENTREGARON (Verde pastel) */}
          <div className="bg-[#ddfae6] rounded-[2rem] p-6 text-slate-900 flex flex-col justify-between min-h-[170px] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900/90">
                ENTREGARON
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-200/70 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 size={18} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {deliveredCount} <span className="text-xl font-bold text-slate-600">/ {totalCount} alumnos</span>
              </div>
              <Badge className="bg-emerald-300/80 text-emerald-950 font-black text-xs px-3 py-1 rounded-full border-none">
                {deliveredPercent}%
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 mt-2">
              <CheckCircle2 size={14} />
              <span>Calificados y registrados en sistema</span>
            </div>
          </div>

          {/* Tarjeta 2: PENDIENTES / SIN ENTREGA (Rosa pastel) */}
          <div className="bg-[#ffe4e6] rounded-[2rem] p-6 text-slate-900 flex flex-col justify-between min-h-[170px] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-900/90">
                PENDIENTES / SIN ENTREGA
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-200/70 text-rose-800 flex items-center justify-center">
                <AlertCircle size={18} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {pendingCount} <span className="text-xl font-bold text-slate-600">alumnos</span>
              </div>
              <Badge className="bg-rose-300/80 text-rose-950 font-black text-xs px-3 py-1 rounded-full border-none">
                {pendingPercent}%
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-800 mt-2">
              <Clock size={14} />
              <span>Faltan por escanear o entregar</span>
            </div>
          </div>

          {/* Tarjeta 3: PROMEDIO GRUPAL (Amarillo/Dorado pastel) */}
          <div className="bg-[#fef8c3] rounded-[2rem] p-6 text-slate-900 flex flex-col justify-between min-h-[170px] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900/90">
                PROMEDIO GRUPAL
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-200/80 text-amber-800 flex items-center justify-center">
                <Star size={18} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {averageScore} <span className="text-xl font-bold text-slate-600">/ {maxScore} pts</span>
              </div>
              <Badge className="bg-amber-300/80 text-amber-950 font-black text-xs px-3 py-1 rounded-full border-none">
                {averagePercent >= 85 ? 'Desempeño Alto' : 'Desempeño Medio'}
              </Badge>
            </div>

            <div className="w-full h-2 bg-amber-200/80 rounded-full overflow-hidden my-1">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, averagePercent)}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 mt-1">
              <Star size={14} />
              <span>{excellentCount} alumnos con calificación excelente</span>
            </div>
          </div>

        </div>

        {/* ===== BARRA DE BÚSQUEDA Y FILTROS ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Input de Búsqueda */}
          <div className="w-full sm:w-96">
            <Input
              type="text"
              placeholder="Buscar alumno por nombre o matrícula (#K-001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} className="text-slate-400" />}
              containerClassName="bg-white rounded-full border border-slate-200/90 shadow-2xs"
              className="py-2.5 text-xs font-medium"
            />
          </div>

          {/* Pestañas de Filtro Píldora */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full overflow-x-auto border border-slate-200/60 shadow-2xs self-start sm:self-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFilterTab('all')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-full transition-all ${
                filterTab === 'all'
                  ? 'bg-[#009ee3] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Todos ({totalCount})
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setFilterTab('delivered')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-full transition-all ${
                filterTab === 'delivered'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Entregados ({deliveredCount})
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setFilterTab('pending')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-full transition-all ${
                filterTab === 'pending'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Pendientes ({pendingCount})
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setFilterTab('excellent')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-full transition-all ${
                filterTab === 'excellent'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Con Nota Sobresaliente ({excellentCount})
            </Button>
          </div>
        </div>

        {/* ===== LISTA DE FILAS DE ALUMNOS ===== */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6 shadow-xs">
              <p className="font-extrabold text-sm text-slate-700">No se encontraron alumnos</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Ajusta el filtro de búsqueda para visualizar los resultados de la clase.
              </p>
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const isDelivered = student.score !== null && student.score !== undefined;
              const avatarStyle = AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length];
              const scanTimeStr = formatScanTime(student.gradedAt);

              return (
                <div
                  key={student.studentId}
                  className="bg-white rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all"
                >
                  {/* Avatar + Nombre + Información de entrega */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {getInitials(student.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {student.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {student.enrollmentNumber}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-600 mt-0.5 flex items-center gap-1.5">
                        {isDelivered ? (
                          <>
                            <QrCode size={13} className="text-slate-400" />
                            <span>
                              Escaneado: {scanTimeStr ? `Hoy, ${scanTimeStr}` : 'Registrado'}
                            </span>
                          </>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <Clock size={13} />
                            Sin entrega registrada todavía
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones y Etiquetas del Lado Derecho */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {isDelivered ? (
                      <>
                        {/* Insignia Entregado */}
                        <Badge className="bg-[#dcfce7] text-[#15803d] font-black text-xs px-3.5 py-1.5 rounded-full border-none flex items-center gap-1.5">
                          <Check size={13} strokeWidth={3} />
                          <span>Entregado</span>
                        </Badge>

                        {/* Caja con la Nota */}
                        <div className="bg-[#e0f2fe] text-[#0369a1] font-black text-xs px-3 py-1.5 rounded-xl border border-sky-200/70">
                          {student.score} <span className="text-[10px] text-sky-700 font-bold">/ {maxScore}</span>
                        </div>

                        {/* Botón Ver QR */}
                        <Button
                          type="button"
                          variant="icon"
                          onClick={() => setSelectedQrStudent({ name: student.name, qrCode: student.qrCode })}
                          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-sky-50 hover:border-sky-200 text-slate-600 hover:text-sky-600 shadow-2xs transition-colors cursor-pointer"
                          title="Ver Código QR"
                        >
                          <QrCode size={16} />
                        </Button>

                        {/* Botón Editar Nota */}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setEditScoreModal({
                              isOpen: true,
                              studentId: student.studentId,
                              studentName: student.name,
                              currentScore: student.score ?? maxScore,
                              loading: false,
                            })
                          }
                          className="bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Editar Nota
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Insignia No Entregado */}
                        <Badge className="bg-[#ffe4e6] text-[#be123c] font-black text-xs px-3.5 py-1.5 rounded-full border-none flex items-center gap-1.5">
                          <X size={13} strokeWidth={3} />
                          <span>No Entregado</span>
                        </Badge>

                        {/* Caja Estado Pendiente */}
                        <div className="bg-slate-100 text-slate-600 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200/60">
                          Pendiente
                        </div>

                        {/* Botón Escanear Ahora */}
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => router.push(`/scanner?mode=grades&assignmentId=${assignment._id}`)}
                          leftIcon={<QrCode size={15} />}
                          className="bg-[#009ee3] hover:bg-[#0284c7] text-white font-black text-xs px-4 py-1.5 rounded-full shadow-md transition-all cursor-pointer h-auto"
                        >
                          Escanear Ahora
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Modal de Código QR */}
      <StudentQrModal
        student={selectedQrStudent}
        onClose={() => setSelectedQrStudent(null)}
      />

      {/* Modal para Editar Nota Manualmente */}
      {editScoreModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Editar Calificación</h3>
              <button
                onClick={() => setEditScoreModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500">Alumno:</p>
              <p className="text-base font-black text-slate-900">{editScoreModal.studentName}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Calificación (0 - {maxScore} pts):</label>
              <Input
                type="number"
                min={0}
                max={maxScore}
                value={editScoreModal.currentScore}
                onChange={(e) =>
                  setEditScoreModal((prev) => ({
                    ...prev,
                    currentScore: parseFloat(e.target.value) || 0,
                  }))
                }
                className="text-center text-2xl font-black text-[#0284c7]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="ghost"
                onClick={() => setEditScoreModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-xs font-bold text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveScore}
                disabled={editScoreModal.loading}
                className="bg-[#009ee3] hover:bg-[#0284c7] text-xs font-black px-5 py-2.5 rounded-xl shadow-md"
              >
                {editScoreModal.loading ? 'Guardando...' : 'Guardar Calificación'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
