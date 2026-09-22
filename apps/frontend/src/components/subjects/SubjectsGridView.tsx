'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Download, Search, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { API_BASE_URL } from '@/config/api';
import { handleAuthError } from '@/lib/auth';

import { SubjectItem, AssignmentItem, getAuthToken } from './subjectUtils';
import SubjectCard from './SubjectCard';
import SubjectEmptyState from './SubjectEmptyState';

const CreateSubjectModal = dynamic(() => import('@/components/CreateSubjectModal'), { ssr: false });
const EditSubjectModal = dynamic(() => import('@/components/EditSubjectModal'), { ssr: false });
const ConfirmDeleteModal = dynamic(() => import('@/components/ConfirmDeleteModal'), { ssr: false });

export interface SubjectsGridViewProps {
  initialSubjects?: SubjectItem[];
  basePath?: string;
}

export default function SubjectsGridView({
  initialSubjects,
  basePath: propBasePath,
}: SubjectsGridViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Detect base path: if accessed via /dashboard/subjects, maintain that prefix
  const basePath = useMemo(() => {
    if (propBasePath) return propBasePath;
    if (pathname?.startsWith('/dashboard/subjects')) return '/dashboard/subjects';
    return '/subjects';
  }, [propBasePath, pathname]);

  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects || []);
  const [loading, setLoading] = useState(!initialSubjects || initialSubjects.length === 0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    loading: boolean;
  }>({
    isOpen: false,
    id: '',
    name: '',
    loading: false,
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Fetch subjects if not passed or after mutation
  const fetchSubjects = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleAuthError(router);
          return;
        }
        throw new Error('Error al cargar materias');
      }

      const data: SubjectItem[] = await res.json();
      setSubjects(data);
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron cargar las materias');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load only if initialSubjects was not provided
  useEffect(() => {
    if (!initialSubjects) {
      fetchSubjects();
    }
  }, [initialSubjects, fetchSubjects]);

  // Filter subjects by search
  const filteredSubjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  // Handle Create Subject
  const handleCreateSubject = async (formData: {
    name: string;
    description: string;
    iconKey: string;
    color: string;
  }) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al crear la materia');
    }

    toast.success('¡Asignatura creada con éxito!');
    setIsCreateModalOpen(false);
    await fetchSubjects();
  };

  // Handle Edit Subject
  const handleEditSubject = async (
    id: string,
    formData: {
      name: string;
      description: string;
      iconKey: string;
      color: string;
    }
  ) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al actualizar la materia');
    }

    toast.success('Materia actualizada');
    setSubjectToEdit(null);
    await fetchSubjects();
  };

  // Handle Delete Subject
  const handleDeleteSubject = async () => {
    const { id } = deleteConfirmation;
    if (!id) return;

    setDeleteConfirmation((prev) => ({ ...prev, loading: true }));
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al eliminar la materia');
      }

      toast.success('Asignatura eliminada con éxito');
      setDeleteConfirmation({ isOpen: false, id: '', name: '', loading: false });
      await fetchSubjects();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar la asignatura');
      setDeleteConfirmation((prev) => ({ ...prev, loading: false }));
    }
  };

  // Export all grades to Excel
  const handleExportAllGradesToExcel = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Sesión no válida o expirada');
      return;
    }

    try {
      setIsExportingExcel(true);
      toast.loading('Generando reporte Excel de todas las materias...', { id: 'excel-export' });

      const [studentsRes, subjectsRes, assignmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!studentsRes.ok || !subjectsRes.ok || !assignmentsRes.ok) {
        throw new Error('Error al consultar datos escolares');
      }

      const students: any[] = await studentsRes.json();
      const allSubjects: SubjectItem[] = await subjectsRes.json();
      const allAssignments: AssignmentItem[] = await assignmentsRes.json();

      if (!students || students.length === 0) {
        toast.error('No hay alumnos registrados para generar el reporte.', { id: 'excel-export' });
        setIsExportingExcel(false);
        return;
      }

      const wb = XLSX.utils.book_new();

      // Recopilar calificaciones por asignación
      const assignmentGradesMap: Record<string, Record<string, number | null>> = {};
      await Promise.all(
        allAssignments.map(async (asg) => {
          try {
            const gradesRes = await fetch(`${API_BASE_URL}/grades/assignment?assignmentId=${asg._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (gradesRes.ok) {
              const gradesData: any[] = await gradesRes.json();
              const scoreMap: Record<string, number | null> = {};
              gradesData.forEach((g) => {
                const sId = String(g.studentId || (typeof g.student === 'object' ? g.student?._id : g.student));
                scoreMap[sId] = g.score !== undefined ? g.score : null;
              });
              assignmentGradesMap[asg._id] = scoreMap;
            }
          } catch {
            // Ignorar fallos puntuales
          }
        })
      );

      // Generar hoja por materia
      allSubjects.forEach((sub) => {
        const subAssignments = allAssignments.filter((a) => {
          const sId = typeof a.subject === 'object' && a.subject ? a.subject._id : a.subject;
          return String(sId) === String(sub._id);
        });

        const headers = ['N°', 'Matrícula', 'Nombre del Alumno'];
        subAssignments.forEach((asg) => {
          headers.push(`${asg.title} (${asg.maxScore || 10} pts)`);
        });
        headers.push('Promedio Global (%)');

        const rows: any[][] = [
          [`REPORTE DE CALIFICACIONES - ${sub.name.toUpperCase()}`],
          [`Código: ${sub.code || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-MX')}`],
          [],
          headers,
        ];

        students.forEach((st, idx) => {
          const rowData: any[] = [idx + 1, st.enrollmentNumber || '-', st.name || '-'];
          let sumPoints = 0;
          let sumMax = 0;

          subAssignments.forEach((asg) => {
            const score = assignmentGradesMap[asg._id]?.[String(st._id)];
            if (score !== null && score !== undefined) {
              rowData.push(score);
              sumPoints += score;
              sumMax += asg.maxScore || 10;
            } else {
              rowData.push('-');
            }
          });

          const percent = sumMax > 0 ? `${Math.round((sumPoints / sumMax) * 100)}%` : '-';
          rowData.push(percent);
          rows.push(rowData);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const sheetName = sub.name.replace(/[:\\/?*[\]]/g, '').slice(0, 28);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, `Reporte_General_EducaQR_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Reporte Excel descargado con éxito', { id: 'excel-export' });
    } catch (err: any) {
      toast.error(err.message || 'Error al exportar a Excel', { id: 'excel-export' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* ===== CABECERA DE NIVEL 1 ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              <Layers className="w-3.5 h-3.5" />
              Nivel 1: Materias
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Mis Asignaturas
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Haz clic en una materia para abrir su espacio de trabajo y gestionar sus tareas
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {subjects.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExportingExcel}
              onClick={handleExportAllGradesToExcel}
              leftIcon={<Download size={15} />}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-2xs cursor-pointer h-auto"
            >
              {isExportingExcel ? 'Generando...' : 'Exportar Todo a Excel'}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus size={16} strokeWidth={2.8} />}
            className="bg-[#009ee3] hover:bg-[#0284c7] text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-lg shadow-sky-500/25 transition-all cursor-pointer h-auto"
          >
            Añadir Materia
          </Button>
        </div>
      </div>

      {/* ===== BARRA DE BÚSQUEDA ===== */}
      {subjects.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Buscar materia por nombre o código..."
              leftIcon={<Search size={15} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              containerClassName="rounded-2xl border border-slate-200/90 bg-white shadow-2xs"
              className="py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 shrink-0">
            {filteredSubjects.length} {filteredSubjects.length === 1 ? 'materia' : 'materias'}
          </span>
        </div>
      )}

      {/* ===== GRID DE MATERIAS O EMPTY STATE ===== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/60"
            />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <SubjectEmptyState
          type="subjects"
          onAction={() => setIsCreateModalOpen(true)}
          actionLabel="Añadir Primera Materia"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((sub, idx) => (
            <SubjectCard
              key={sub._id}
              subject={sub}
              index={idx}
              basePath={basePath}
              onEdit={(s) => setSubjectToEdit(s)}
              onDelete={(s) =>
                setDeleteConfirmation({
                  isOpen: true,
                  id: s._id,
                  name: s.name,
                  loading: false,
                })
              }
            />
          ))}

          {/* Tarjeta Dashed "+ Añadir Materia" al final del grid */}
          <Card
            colorPreset="dashed"
            onClick={() => setIsCreateModalOpen(true)}
            className="p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md group min-h-[190px] rounded-3xl border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30"
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 mb-3 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Plus size={22} strokeWidth={2.6} />
            </div>
            <h4 className="text-sm font-black text-slate-900 group-hover:text-sky-900 transition-colors">
              Añadir Materia
            </h4>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Crear nueva asignatura
            </p>
          </Card>
        </div>
      )}

      {/* ===== MODALES DE CREACIÓN / EDICIÓN / ELIMINACIÓN DE MATERIA ===== */}
      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubject}
      />

      <EditSubjectModal
        isOpen={!!subjectToEdit}
        subject={subjectToEdit}
        onClose={() => setSubjectToEdit(null)}
        onSubmit={handleEditSubject}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title="Eliminar Asignatura"
        description={`¿Estás seguro de que deseas eliminar permanentemente la materia "${deleteConfirmation.name}"? Esta acción borrará todas sus tareas asociadas.`}
        loading={deleteConfirmation.loading}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, id: '', name: '', loading: false })
        }
        onConfirm={handleDeleteSubject}
      />
    </div>
  );
}
