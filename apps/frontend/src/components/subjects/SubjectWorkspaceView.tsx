'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus,
  QrCode,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Download,
  Search,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { API_BASE_URL } from '@/config/api';
import { handleAuthError } from '@/lib/auth';

import {
  SubjectItem,
  AssignmentItem,
  getSubjectVisuals,
  getAuthToken,
  LUCIDE_ICONS,
  COLOR_MAP,
} from './subjectUtils';
import SubjectBreadcrumb from './SubjectBreadcrumb';
import SubjectEmptyState from './SubjectEmptyState';

const CreateAssignmentModal = dynamic(() => import('@/components/CreateAssignmentModal'), { ssr: false });
const EditAssignmentModal = dynamic(() => import('@/components/EditAssignmentModal'), { ssr: false });
const ConfirmDeleteModal = dynamic(() => import('@/components/ConfirmDeleteModal'), { ssr: false });
const AssignmentDetailView = dynamic(() => import('./AssignmentDetailView'), { ssr: false });

export interface SubjectWorkspaceViewProps {
  subjectId: string;
  initialSubject?: SubjectItem;
  initialTasks?: AssignmentItem[];
  basePath?: string;
}

export default function SubjectWorkspaceView({
  subjectId,
  initialSubject,
  initialTasks,
  basePath: propBasePath,
}: SubjectWorkspaceViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const basePath = useMemo(() => {
    if (propBasePath) return propBasePath;
    if (pathname?.startsWith('/dashboard/subjects')) return '/dashboard/subjects';
    return '/subjects';
  }, [propBasePath, pathname]);

  const [subject, setSubject] = useState<SubjectItem | null>(initialSubject || null);
  const [tasks, setTasks] = useState<AssignmentItem[]>(initialTasks || []);
  const [loading, setLoading] = useState(!initialSubject);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected assignment for full grading detail view
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);

  // Modals state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<AssignmentItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    loading: boolean;
  }>({
    isOpen: false,
    id: '',
    title: '',
    loading: false,
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Fetch subject details and its assignments
  const fetchSubjectData = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !subjectId) return;

    try {
      setLoading(true);
      const [subRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/assignments?subjectId=${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!subRes.ok) {
        if (subRes.status === 401 || subRes.status === 403) {
          handleAuthError(router);
          return;
        }
        throw new Error('No se pudo encontrar la asignatura solicitada');
      }

      const subData: SubjectItem = await subRes.json();
      setSubject(subData);

      if (tasksRes.ok) {
        const tasksData: AssignmentItem[] = await tasksRes.json();
        // Filtrar estrictamente por esta materia
        const cleanSubId = String(subData._id);
        const filtered = tasksData.filter((t) => {
          const tSubId = typeof t.subject === 'object' && t.subject !== null ? (t.subject as any)._id : String(t.subject || '');
          return String(tSubId) === cleanSubId;
        });
        setTasks(filtered);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar la materia');
    } finally {
      setLoading(false);
    }
  }, [subjectId, router]);

  useEffect(() => {
    if (!initialSubject || !initialTasks) {
      fetchSubjectData();
    }
  }, [initialSubject, initialTasks, fetchSubjectData]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  // Handle Scan redirection
  const handleScanTask = (task: AssignmentItem) => {
    const subId = typeof task.subject === 'object' && task.subject !== null
      ? (task.subject as any)._id
      : (task.subject || subjectId);
    const maxScore = task.maxScore || 100;
    router.push(`/scanner?mode=grades&subjectId=${subId}&assignmentId=${task._id}&maxScore=${maxScore}`);
  };

  // Handle Create Task
  const handleCreateAssignment = async (formData: {
    subjectId: string;
    title: string;
    maxScore: number;
    dueDate: string;
    color: string;
    iconKey: string;
  }) => {
    const token = getAuthToken();
    const cleanSubId = String(formData.subjectId || subjectId).trim();

    const res = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subjectId: cleanSubId,
        title: formData.title,
        maxScore: formData.maxScore,
        dueDate: formData.dueDate,
        color: formData.color,
        iconKey: formData.iconKey,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al crear la tarea');
    }

    const created = await res.json().catch(() => null);
    await fetchSubjectData();
    return created;
  };

  // Handle Edit Task
  const handleEditAssignment = async (
    id: string,
    formData: {
      title: string;
      maxScore: number;
      dueDate: string;
      color: string;
      iconKey: string;
    }
  ) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/assignments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al actualizar la tarea');
    }

    toast.success('Tarea actualizada con éxito');
    setTaskToEdit(null);
    await fetchSubjectData();
  };

  // Handle Delete Task
  const handleDeleteAssignment = async () => {
    const { id } = deleteConfirmation;
    if (!id) return;

    setDeleteConfirmation((prev) => ({ ...prev, loading: true }));
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al eliminar la tarea');
      }

      toast.success('Tarea eliminada');
      setDeleteConfirmation({ isOpen: false, id: '', title: '', loading: false });
      await fetchSubjectData();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar la tarea');
      setDeleteConfirmation((prev) => ({ ...prev, loading: false }));
    }
  };

  // Export Subject Report to Excel
  const handleExportSubjectReport = async () => {
    if (!subject) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsExportingExcel(true);
      toast.loading(`Generando reporte de ${subject.name}...`, { id: 'subject-excel' });

      const [studentsRes, gradesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        Promise.all(
          tasks.map(async (t) => {
            const r = await fetch(`${API_BASE_URL}/grades/assignment?assignmentId=${t._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
              const data: any[] = await r.json();
              return { assignmentId: t._id, data };
            }
            return { assignmentId: t._id, data: [] };
          })
        ),
      ]);

      if (!studentsRes.ok) throw new Error('Error al consultar alumnos');
      const students: any[] = await studentsRes.json();

      const wb = XLSX.utils.book_new();
      const headers = ['N°', 'Matrícula', 'Nombre del Alumno'];
      tasks.forEach((t) => {
        headers.push(`${t.title} (${t.maxScore || 10} pts)`);
      });
      headers.push('Promedio (%)');

      const rows: any[][] = [
        [`REPORTE DE CALIFICACIONES: ${subject.name.toUpperCase()}`],
        [`Código: ${subject.code || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-MX')}`],
        [],
        headers,
      ];

      students.forEach((st, idx) => {
        const rowData: any[] = [idx + 1, st.enrollmentNumber || '-', st.name || '-'];
        let sumPoints = 0;
        let sumMax = 0;

        tasks.forEach((t) => {
          const matchGradeList = gradesRes.find((g) => g.assignmentId === t._id)?.data || [];
          const found = matchGradeList.find((item) => {
            const sid = String(item.studentId || (typeof item.student === 'object' ? item.student?._id : item.student));
            return sid === String(st._id);
          });

          if (found && found.score !== null && found.score !== undefined) {
            rowData.push(found.score);
            sumPoints += found.score;
            sumMax += t.maxScore || 10;
          } else {
            rowData.push('-');
          }
        });

        const percent = sumMax > 0 ? `${Math.round((sumPoints / sumMax) * 100)}%` : '-';
        rowData.push(percent);
        rows.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, subject.name.slice(0, 28));
      XLSX.writeFile(wb, `Reporte_${subject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Reporte descargado con éxito', { id: 'subject-excel' });
    } catch (err: any) {
      toast.error(err.message || 'Error al generar reporte', { id: 'subject-excel' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // If a task is selected for viewing detail records, show AssignmentDetailView
  if (selectedTaskForDetail) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-6">
        <AssignmentDetailView
          assignment={{
            ...selectedTaskForDetail,
            subject: subject || { _id: subjectId, name: 'Materia' },
          }}
          onBack={() => setSelectedTaskForDetail(null)}
        />
      </div>
    );
  }

  const visuals = subject ? getSubjectVisuals(subject) : getSubjectVisuals({ name: 'Materia' });
  const IconComp = visuals.IconComponent;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-8 space-y-7 animate-in fade-in duration-200">
      {/* ===== 1. CONTEXTO FIJO (BREADCRUMBS) ===== */}
      <div className="flex items-center justify-between gap-4">
        <SubjectBreadcrumb
          basePath={basePath}
          subjectName={subject?.name || 'Cargando...'}
          subjectCode={subject?.code}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(basePath)}
          leftIcon={<ArrowLeft size={15} />}
          className="text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer px-3"
        >
          Volver a Materias
        </Button>
      </div>

      {/* ===== 2. CABECERA PROMINENTE DE LA MATERIA CON BOTÓN ANCLADO ===== */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-sm transition-all relative overflow-hidden ${visuals.cardBg}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Lado Izquierdo: Icono + Título + Metadatos */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white shadow-md border border-white/80 flex items-center justify-center shrink-0">
              <IconComp className={`w-7 h-7 sm:w-8 sm:h-8 ${visuals.textColor}`} strokeWidth={2.3} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-black/5 shadow-2xs">
                  {subject?.code || '3° Primaria'}
                </span>
                <Badge className={`${visuals.badgeBg} ${visuals.badgeText} text-xs font-black px-3 py-0.5 rounded-full`}>
                  {tasks.length} {tasks.length === 1 ? 'tarea asignada' : 'tareas asignadas'}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {subject?.name || 'Cargando Asignatura...'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-2xl leading-relaxed">
                {subject?.description || 'Espacio de trabajo aislado para actividades, calificaciones y escaneo QR.'}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Botón '+ Nueva Tarea' ANCLADO A ESTA CABECERA */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {tasks.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isExportingExcel}
                onClick={handleExportSubjectReport}
                leftIcon={<Download size={15} />}
                className="bg-white/90 hover:bg-white text-slate-700 border-slate-200/90 text-xs font-black px-4 py-2.5 rounded-2xl shadow-xs cursor-pointer h-auto"
              >
                {isExportingExcel ? 'Exportando...' : 'Reporte Excel'}
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateTaskModalOpen(true)}
              leftIcon={<Plus size={18} strokeWidth={2.8} />}
              className="bg-[#009ee3] hover:bg-[#0284c7] text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-sky-500/25 transition-all cursor-pointer h-auto hover:scale-105 active:scale-95"
            >
              + Nueva Tarea
            </Button>
          </div>
        </div>
      </div>

      {/* ===== 3. LISTA / GRID DE TAREAS O EMPTY STATE ===== */}
      <div className="space-y-4">
        {/* Barra superior de filtrado si hay tareas */}
        {tasks.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Actividades Evaluativas
              </h2>
              <span className="text-xs font-bold text-slate-400">
                ({filteredTasks.length} de {tasks.length})
              </span>
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="Filtrar tarea por nombre o código..."
                leftIcon={<Search size={15} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                containerClassName="rounded-2xl border border-slate-200/90 bg-white shadow-2xs"
                className="py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* Estado de Carga */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/60"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* ===== EMPTY STATE AMIGABLE ===== */
          <SubjectEmptyState
            type="tasks"
            subjectName={subject?.name}
            onAction={() => setIsCreateTaskModalOpen(true)}
            actionLabel="+ Crear Primera Tarea"
          />
        ) : (
          /* ===== GRID DE TAREAS ===== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task, idx) => {
              const taskVisuals = getSubjectVisuals(
                {
                  name: task.title,
                  color: task.color || subject?.color,
                  iconKey: task.iconKey,
                },
                idx
              );
              const TaskIcon = taskVisuals.IconComponent;
              const delivered = task.deliveredCount ?? 0;
              const total = task.totalStudents ?? 30;
              const percent = total > 0 ? Math.min(100, Math.round((delivered / total) * 100)) : 0;

              return (
                <Card
                  key={task._id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  {/* Fila Superior de la Tarea */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${taskVisuals.cardBg}`}
                        >
                          <TaskIcon className={`w-4 h-4 ${taskVisuals.textColor}`} strokeWidth={2.4} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            {task.code || `QR-${idx + 1}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                          {task.maxScore || 100} PTS
                        </span>

                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() => setTaskToEdit(task)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 cursor-pointer"
                          title="Editar tarea"
                        >
                          <Pencil size={12} strokeWidth={2.4} />
                        </Button>

                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() =>
                            setDeleteConfirmation({
                              isOpen: true,
                              id: task._id,
                              title: task.title,
                              loading: false,
                            })
                          }
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <Trash2 size={12} strokeWidth={2.4} />
                        </Button>
                      </div>
                    </div>

                    {/* Título y Descripción */}
                    <div
                      onClick={() => setSelectedTaskForDetail(task)}
                      className="cursor-pointer space-y-1 mb-4"
                    >
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug group-hover:text-sky-600 transition-colors line-clamp-1">
                        {task.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 line-clamp-2">
                        {task.description || 'Calificación continua y evaluación mediante lectura de código QR.'}
                      </p>
                    </div>

                    {/* Fecha Límite */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-3 bg-slate-50/80 px-2.5 py-1 rounded-xl w-fit">
                      <Calendar size={12} className="text-slate-400" />
                      <span>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Sin fecha límite'}
                      </span>
                    </div>

                    {/* Barra de Progreso de Entregas */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Entregaron</span>
                        <span className="text-slate-800 font-extrabold">
                          {delivered} / {total} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la Tarea: Escanear / Ver Calificaciones */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTaskForDetail(task)}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold py-2 rounded-xl cursor-pointer"
                    >
                      Ver Notas
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleScanTask(task)}
                      leftIcon={<QrCode size={14} strokeWidth={2.4} />}
                      className="flex-1 bg-[#009ee3] hover:bg-[#0284c7] text-white font-black text-xs py-2 rounded-xl shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      Escanear
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== MODAL CREAR TAREA (VINCULADA A ESTA MATERIA) ===== */}
      <CreateAssignmentModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        subjects={subject ? [subject] : []}
        defaultSubjectId={subjectId}
        onSubmit={handleCreateAssignment}
      />

      {/* ===== MODAL EDITAR TAREA ===== */}
      <EditAssignmentModal
        isOpen={!!taskToEdit}
        assignment={
          taskToEdit
            ? {
                ...taskToEdit,
                subject:
                  typeof taskToEdit.subject === 'object' && taskToEdit.subject !== null
                    ? {
                        _id: (taskToEdit.subject as any)._id || String(taskToEdit.subject),
                        name: (taskToEdit.subject as any).name || (subject?.name ?? 'Materia'),
                      }
                    : subject
                    ? { _id: subject._id, name: subject.name }
                    : undefined,
              }
            : null
        }
        onClose={() => setTaskToEdit(null)}
        onSubmit={handleEditAssignment}
      />

      {/* ===== MODAL CONFIRMAR ELIMINACIÓN ===== */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title="Eliminar Tarea"
        description={`¿Estás seguro de que deseas eliminar permanentemente la tarea "${deleteConfirmation.title}"?`}
        loading={deleteConfirmation.loading}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, id: '', title: '', loading: false })
        }
        onConfirm={handleDeleteAssignment}
      />
    </div>
  );
}
