'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  ArrowRight, ScanLine, BookOpen,
  Palette, Music, FlaskConical, Trophy, DraftingCompass,
  ClipboardList, FileText, Pencil, Trash2, LucideIcon,
  FileSpreadsheet, Loader2, QrCode, CheckCircle2, Search
} from 'lucide-react';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge } from '@/components/ui';
import { API_BASE_URL } from '@/config/api';
import { handleAuthError } from '@/lib/auth';

const CreateSubjectModal = dynamic(() => import('@/components/CreateSubjectModal'), { ssr: false });
const EditSubjectModal = dynamic(() => import('@/components/EditSubjectModal'), { ssr: false });
const CreateAssignmentModal = dynamic(() => import('@/components/CreateAssignmentModal'), { ssr: false });
const EditAssignmentModal = dynamic(() => import('@/components/EditAssignmentModal'), { ssr: false });
const ConfirmDeleteModal = dynamic(() => import('@/components/ConfirmDeleteModal'), { ssr: false });
const AssignmentDetailView = dynamic(() => import('@/components/subjects/AssignmentDetailView'), { ssr: false });

export interface SubjectItem {
  _id: string;
  name: string;
  code: string;
  description: string;
  color?: string;
  iconKey?: string;
  grade?: string;
  activeTasksCount: number;
}

export interface AssignmentItem {
  _id: string;
  title: string;
  code?: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  color?: string;
  iconKey?: string;
  deliveredCount: number;
  totalStudents: number;
  status: 'active' | 'completed' | 'pending';
  subject: {
    _id: string;
    name: string;
    code: string;
    color?: string;
    iconKey?: string;
  };
}

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  math: DraftingCompass,
  science: FlaskConical,
  art: Palette,
  music: Music,
  sport: Trophy,
  clipboard: ClipboardList,
  exam: FileText,
};

const COLOR_MAP: Record<string, { cardBg: string; badgeBg: string; badgeText: string; textColor: string; iconBg: string }> = {
  sky: {
    cardBg: 'bg-[#e0f1fc]',
    badgeBg: 'bg-[#c5e4fa]',
    badgeText: 'text-sky-800',
    textColor: 'text-sky-900',
    iconBg: 'bg-sky-100 text-sky-700',
  },
  emerald: {
    cardBg: 'bg-[#ddfae6]',
    badgeBg: 'bg-[#bbf7d0]',
    badgeText: 'text-emerald-800',
    textColor: 'text-emerald-900',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  amber: {
    cardBg: 'bg-[#fef8c3]',
    badgeBg: 'bg-[#fef08a]',
    badgeText: 'text-amber-900',
    textColor: 'text-amber-950',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  rose: {
    cardBg: 'bg-[#ffe4e6]',
    badgeBg: 'bg-[#fecdd3]',
    badgeText: 'text-rose-800',
    textColor: 'text-rose-950',
    iconBg: 'bg-rose-100 text-rose-700',
  },
  purple: {
    cardBg: 'bg-[#f3e8ff]',
    badgeBg: 'bg-[#e9d5ff]',
    badgeText: 'text-purple-800',
    textColor: 'text-purple-950',
    iconBg: 'bg-purple-100 text-purple-700',
  },
};

const DEFAULT_THEME_KEYS = ['sky', 'emerald', 'amber', 'rose', 'purple'];

function getSubjectVisuals(sub: { name: string; code?: string; color?: string; iconKey?: string }, index: number) {
  const colorKey = sub.color && COLOR_MAP[sub.color] ? sub.color : DEFAULT_THEME_KEYS[index % DEFAULT_THEME_KEYS.length];
  const theme = COLOR_MAP[colorKey];

  let IconComponent = sub.iconKey && LUCIDE_ICONS[sub.iconKey] ? LUCIDE_ICONS[sub.iconKey] : null;

  if (!IconComponent) {
    const nameLower = (sub.name || '').toLowerCase();
    if (nameLower.includes('mat')) {
      IconComponent = DraftingCompass;
    } else if (nameLower.includes('español') || nameLower.includes('lectura') || nameLower.includes('lengua')) {
      IconComponent = BookOpen;
    } else if (nameLower.includes('cien') || nameLower.includes('bio') || nameLower.includes('quim')) {
      IconComponent = FlaskConical;
    } else if (nameLower.includes('art') || nameLower.includes('hist') || nameLower.includes('soc')) {
      IconComponent = Palette;
    } else if (nameLower.includes('músic') || nameLower.includes('music')) {
      IconComponent = Music;
    } else if (nameLower.includes('depor') || nameLower.includes('físic')) {
      IconComponent = Trophy;
    } else {
      IconComponent = BookOpen;
    }
  }

  return {
    ...theme,
    IconComponent,
  };
}

function getAssignmentVisuals(task: AssignmentItem, index: number) {
  const chosenColor = task.color || task.subject?.color;
  const colorKey = chosenColor && COLOR_MAP[chosenColor] ? chosenColor : DEFAULT_THEME_KEYS[index % DEFAULT_THEME_KEYS.length];
  const theme = COLOR_MAP[colorKey];

  const chosenIconKey = task.iconKey || task.subject?.iconKey;
  const IconComponent = chosenIconKey && LUCIDE_ICONS[chosenIconKey] ? LUCIDE_ICONS[chosenIconKey] : ClipboardList;

  return {
    ...theme,
    IconComponent,
  };
}

function formatDueDate(dueDate?: string) {
  if (!dueDate) return 'Sin fecha de vencimiento';
  try {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) return dueDate;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      const timeStr = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      return `Vencimiento: Hoy ${timeStr}`;
    }
    return `Vencimiento: ${d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } catch {
    return dueDate;
  }
}

export default function SubjectsClientView() {
  const router = useRouter();

  // Data states
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('Grupo 3° B');
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);

  // UI states
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [searchTaskQuery, setSearchTaskQuery] = useState('');
  const [selectedAssignmentDetail, setSelectedAssignmentDetail] = useState<AssignmentItem | null>(null);

  // Modals state
  const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);

  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<AssignmentItem | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'subject' | 'assignment';
    id: string;
    name: string;
    loading: boolean;
  }>({
    isOpen: false,
    type: 'subject',
    id: '',
    name: '',
    loading: false,
  });

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  };

  // Fetch subjects from real backend
  const fetchSubjects = useCallback(async () => {
    const token = getAuthToken();
    try {
      setLoadingSubjects(true);
      const res = await fetch(`${API_BASE_URL}/subjects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      if (data.length > 0 && selectedSubject === 'all') {
        const firstId = typeof data[0]._id === 'object' && data[0]._id !== null
          ? (data[0]._id as any)._id || String(data[0]._id)
          : String(data[0]._id);
        setSelectedSubject(firstId);
      }
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      toast.error('No se pudieron cargar las asignaturas');
    } finally {
      setLoadingSubjects(false);
    }
  }, [selectedSubject, router]);

  // Fetch students info to get group name and count
  const fetchStudentsInfo = useCallback(async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTotalStudentsCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching students count:', err);
    }
  }, []);

  // Fetch assignments from real backend based on selectedSubject
  const fetchAssignments = useCallback(async (rawSubjectId?: any) => {
    const token = getAuthToken();
    try {
      setLoadingAssignments(true);
      let cleanSubjectId = '';
      if (rawSubjectId && rawSubjectId !== 'all') {
        if (typeof rawSubjectId === 'object' && rawSubjectId !== null) {
          cleanSubjectId = rawSubjectId._id || rawSubjectId.id || '';
        } else if (typeof rawSubjectId === 'string' && rawSubjectId !== '[object Object]') {
          cleanSubjectId = rawSubjectId.trim();
        }
      }
      const queryParam = cleanSubjectId ? `?subjectId=${cleanSubjectId}` : '';
      const res = await fetch(`${API_BASE_URL}/assignments${queryParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleAuthError(router);
          return;
        }
        throw new Error('Error al cargar tareas');
      }
      const data: AssignmentItem[] = await res.json();
      setAssignments(data);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      toast.error('No se pudieron cargar las tareas');
    } finally {
      setLoadingAssignments(false);
    }
  }, [router]);

  // Initial load
  useEffect(() => {
    fetchSubjects();
    fetchStudentsInfo();
  }, [fetchSubjects, fetchStudentsInfo]);

  // Trigger assignments reload when selectedSubject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchAssignments(selectedSubject);
    }
  }, [selectedSubject, fetchAssignments]);

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
      body: JSON.stringify({
        name: formData.name,
        description: formData.description,
        color: formData.color,
        iconKey: formData.iconKey,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al guardar la materia');
    }

    const created = await res.json();
    await fetchSubjects();
    setSelectedSubject(created._id);
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

    await fetchSubjects();
    if (selectedSubject === id) {
      await fetchAssignments(id);
    }
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al eliminar la materia');
      }

      toast.success('Asignatura eliminada con éxito');
      setDeleteConfirmation({ isOpen: false, type: 'subject', id: '', name: '', loading: false });

      if (selectedSubject === id) {
        setSelectedSubject('all');
      }
      await fetchSubjects();
      await fetchAssignments('all');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar la asignatura');
      setDeleteConfirmation((prev) => ({ ...prev, loading: false }));
    }
  };

  // Handle Create Assignment
  const handleCreateAssignment = async (formData: {
    subjectId: string;
    title: string;
    maxScore: number;
    dueDate: string;
    color: string;
    iconKey: string;
  }) => {
    const token = getAuthToken();
    const cleanSubId = typeof formData.subjectId === 'object' && formData.subjectId !== null
      ? (formData.subjectId as any)._id || String(formData.subjectId)
      : String(formData.subjectId || '').trim();

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
      if (res.status === 401 || res.status === 403) {
        handleAuthError(router);
        return;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al crear la tarea');
    }

    const created = await res.json().catch(() => null);
    await fetchAssignments(selectedSubject);
    await fetchSubjects();
    return created;
  };

  // Handle Edit Assignment
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

    await fetchAssignments(selectedSubject);
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = async () => {
    const { id } = deleteConfirmation;
    if (!id) return;

    setDeleteConfirmation((prev) => ({ ...prev, loading: true }));
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al eliminar la tarea');
      }

      toast.success('Tarea eliminada con éxito');
      setDeleteConfirmation({ isOpen: false, type: 'assignment', id: '', name: '', loading: false });

      await fetchAssignments(selectedSubject);
      await fetchSubjects();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar la tarea');
      setDeleteConfirmation((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleScanTask = (task: AssignmentItem) => {
    const subId = typeof task.subject === 'object' && task.subject !== null
      ? task.subject._id
      : (task.subject || selectedSubject);
    const maxScore = task.maxScore || 100;
    router.push(`/scanner?mode=grades&subjectId=${subId}&assignmentId=${task._id}&maxScore=${maxScore}`);
  };

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportAllGradesToExcel = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Sesión no válida o expirada');
      return;
    }

    try {
      setIsExportingExcel(true);
      toast.loading('Generando reporte Excel de todas las materias...', { id: 'excel-export' });

      // 1. Obtener todos los alumnos
      const studentsRes = await fetch(`${API_BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!studentsRes.ok) throw new Error('Error al obtener lista de alumnos');
      const students: any[] = await studentsRes.json();

      if (!students || students.length === 0) {
        toast.error('No hay alumnos registrados para generar el reporte.', { id: 'excel-export' });
        setIsExportingExcel(false);
        return;
      }

      students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // 2. Obtener todas las materias
      const subjectsRes = await fetch(`${API_BASE_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!subjectsRes.ok) throw new Error('Error al obtener lista de materias');
      const allSubjects: SubjectItem[] = await subjectsRes.json();

      // 3. Obtener todas las tareas de todas las materias
      const assignmentsRes = await fetch(`${API_BASE_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!assignmentsRes.ok) throw new Error('Error al obtener tareas');
      const allAssignments: AssignmentItem[] = await assignmentsRes.json();

      // 4. Obtener calificaciones para todas las tareas en paralelo
      const assignmentGradesMap: Record<string, Record<string, number | null>> = {};

      await Promise.all(
        allAssignments.map(async (assignment) => {
          try {
            const gradesRes = await fetch(`${API_BASE_URL}/grades/assignment?assignmentId=${assignment._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (gradesRes.ok) {
              const gradesData: any[] = await gradesRes.json();
              const studentScores: Record<string, number | null> = {};
              gradesData.forEach((g) => {
                const sId = String(g.studentId || (typeof g.student === 'object' ? g.student?._id : g.student));
                studentScores[sId] = g.score !== undefined && g.score !== null ? g.score : null;
              });
              assignmentGradesMap[assignment._id] = studentScores;
            }
          } catch (e) {
            console.error(`Error fetching grades for assignment ${assignment._id}:`, e);
          }
        })
      );

      // 5. Crear el libro de trabajo Excel
      const workbook = XLSX.utils.book_new();

      const studentSubjectAverages: Record<string, Record<string, number | null>> = {};
      students.forEach((s) => {
        studentSubjectAverages[s._id] = {};
      });

      // HOJAS INDIVIDUALES POR CADA MATERIA
      allSubjects.forEach((subject) => {
        const subjectTasks = allAssignments.filter((a) => {
          const sId = typeof a.subject === 'object' && a.subject ? a.subject._id : a.subject;
          return String(sId) === String(subject._id);
        });

        const rows: any[] = [];

        students.forEach((student, index) => {
          const rowData: Record<string, any> = {
            'N°': index + 1,
            'Matrícula': student.enrollmentNumber || 'S/N',
            'Nombre del Alumno': student.name,
          };

          let sumScores = 0;
          let gradedCount = 0;

          subjectTasks.forEach((task) => {
            const maxScore = task.maxScore || 10;
            const colHeader = `${task.title} (Max: ${maxScore})`;
            const score = assignmentGradesMap[task._id]?.[student._id];

            if (score !== undefined && score !== null) {
              rowData[colHeader] = score;
              sumScores += (score / maxScore) * 10;
              gradedCount++;
            } else {
              rowData[colHeader] = 'Sin calificar';
            }
          });

          rowData['Tareas Calificadas'] = `${gradedCount} / ${subjectTasks.length}`;

          if (gradedCount > 0) {
            const avg = Number((sumScores / gradedCount).toFixed(2));
            rowData['Promedio Materia (Base 10)'] = avg;
            studentSubjectAverages[student._id][subject._id] = avg;
          } else {
            rowData['Promedio Materia (Base 10)'] = '-';
            studentSubjectAverages[student._id][subject._id] = null;
          }

          rows.push(rowData);
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);

        const colWidths = [
          { wch: 6 },
          { wch: 16 },
          { wch: 32 },
          { wch: 14 },
        ];
        subjectTasks.forEach((t) => {
          colWidths.push({ wch: Math.max(t.title.length + 12, 18) });
        });
        colWidths.push({ wch: 18 });
        colWidths.push({ wch: 28 });

        worksheet['!cols'] = colWidths;

        const cleanSheetName = (subject.name || 'Materia')
          .replace(/[\\/*?:\[\]]/g, '')
          .trim()
          .slice(0, 30);

        let uniqueName = cleanSheetName;
        let counter = 1;
        while (workbook.SheetNames.includes(uniqueName)) {
          uniqueName = `${cleanSheetName.slice(0, 27)}_${counter++}`;
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, uniqueName);
      });

      // HOJA DE RESUMEN GENERAL
      const summaryRows = students.map((student, index) => {
        const rowData: Record<string, any> = {
          'N°': index + 1,
          'Matrícula': student.enrollmentNumber || 'S/N',
          'Nombre del Alumno': student.name,
        };

        let totalAvgSum = 0;
        let totalAvgCount = 0;

        allSubjects.forEach((subject) => {
          const avg = studentSubjectAverages[student._id]?.[subject._id];
          if (avg !== undefined && avg !== null) {
            rowData[`${subject.name} (Prom)`] = avg;
            totalAvgSum += avg;
            totalAvgCount++;
          } else {
            rowData[`${subject.name} (Prom)`] = '-';
          }
        });

        if (totalAvgCount > 0) {
          rowData['Promedio General (Base 10)'] = Number((totalAvgSum / totalAvgCount).toFixed(2));
        } else {
          rowData['Promedio General (Base 10)'] = '-';
        }

        return rowData;
      });

      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      const summaryCols = [
        { wch: 6 },
        { wch: 16 },
        { wch: 32 },
        { wch: 14 },
      ];
      allSubjects.forEach((s) => summaryCols.push({ wch: Math.max(s.name.length + 10, 18) }));
      summaryCols.push({ wch: 28 });
      summarySheet['!cols'] = summaryCols;

      workbook.SheetNames.unshift('Resumen General');
      workbook.Sheets['Resumen General'] = summarySheet;

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(workbook, `Reporte_Calificaciones_${dateStr}.xlsx`);

      toast.success('¡Reporte de calificaciones exportado exitosamente a Excel!', { id: 'excel-export' });
    } catch (err: any) {
      console.error('Error generating Excel:', err);
      toast.error(err.message || 'Error al generar el archivo Excel', { id: 'excel-export' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const activeSubject = subjects.find((s) => s._id === selectedSubject);

  const filteredAssignments = assignments.filter((task) =>
    task.title.toLowerCase().includes(searchTaskQuery.toLowerCase()) ||
    (task.code && task.code.toLowerCase().includes(searchTaskQuery.toLowerCase()))
  );

  if (selectedAssignmentDetail) {
    return (
      <AssignmentDetailView
        assignment={selectedAssignmentDetail}
        onBack={() => setSelectedAssignmentDetail(null)}
      />
    );
  }

  return (
    <>
      <main className="max-w-[1400px] mx-auto px-6 sm:px-10 mt-8 space-y-10">
        
        {/* Título de la Vista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Gestión de Materias y Tareas
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Planifica tus lecciones, administra hojas de examen y califica con códigos QR al instante.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportAllGradesToExcel}
              disabled={isExportingExcel}
              leftIcon={
                isExportingExcel ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                )
              }
              className="px-5 py-2.5 text-xs font-black bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 shadow-xs border-slate-200 cursor-pointer"
            >
              {isExportingExcel ? 'Generando Excel...' : 'Descargar Excel de Calificaciones'}
            </Button>
          </div>
        </div>

        {/* ===== SECCIÓN 1: TARJETAS DE MATERIAS ===== */}
        <div>
          {loadingSubjects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {subjects.map((subject, idx) => {
                const isSelected = selectedSubject === subject._id;
                const visuals = getSubjectVisuals(subject, idx);
                const IconComp = visuals.IconComponent;

                const matchingTasks = assignments.filter((a) => {
                  const subId = typeof a.subject === 'object' && a.subject ? a.subject._id : a.subject;
                  return String(subId) === String(subject._id);
                });
                const tasksCount = matchingTasks.length > 0 ? matchingTasks.length : (subject.activeTasksCount ?? 0);

                return (
                  <Card
                    key={subject._id}
                    bgColor={visuals.cardBg}
                    onClick={() => setSelectedSubject(subject._id)}
                    className={`p-5 sm:p-6 flex flex-col justify-between cursor-pointer border transition-all duration-200 hover:-translate-y-1 hover:shadow-md relative group ${
                      isSelected ? 'ring-3 ring-sky-400/50 shadow-sm' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/95 shadow-2xs border border-white/60 flex items-center justify-center shrink-0">
                        <IconComp className={`w-5 h-5 ${visuals.textColor}`} strokeWidth={2.3} />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={`${visuals.badgeBg} ${visuals.badgeText} text-[11px] font-black px-2.5 py-0.5 rounded-full`}
                        >
                          {tasksCount} {tasksCount === 1 ? 'tarea' : 'tareas'}
                        </Badge>

                        <Button
                          variant="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubjectToEdit(subject);
                          }}
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-sky-600 shadow-2xs"
                          title="Editar materia"
                        >
                          <Pencil size={13} strokeWidth={2.3} />
                        </Button>

                        <Button
                          variant="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmation({
                              isOpen: true,
                              type: 'subject',
                              id: subject._id,
                              name: subject.name,
                              loading: false,
                            });
                          }}
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-2xs"
                          title="Eliminar materia"
                        >
                          <Trash2 size={13} strokeWidth={2.3} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 my-1">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                        {subject.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-2">
                        {subject.description || 'Sin descripción registrada'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-2 border-t border-black/5">
                      <span className="text-xs font-black text-slate-800">
                        {subject.code || '3° Grado Primaria'}
                      </span>
                      <ArrowRight size={15} className={`text-slate-800 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                    </div>
                  </Card>
                );
              })}

              <Card
                colorPreset="dashed"
                onClick={() => setIsCreateSubjectModalOpen(true)}
                className="p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md group min-h-[170px]"
              >
                <div className="w-11 h-11 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 mb-2.5 group-hover:scale-105 transition-transform">
                  <Plus size={20} strokeWidth={2.5} />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Añadir Materia
                </h4>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Crear nueva asignatura
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* ===== SECCIÓN 2: TAREAS ASIGNADAS ===== */}
        <section className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Tareas Asignadas
              </h2>
              <Badge status="neutral" className="bg-slate-100 text-slate-700 text-xs font-extrabold px-3 py-1">
                {activeSubject ? activeSubject.name : 'Todas las Materias'}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-72">
                <Input
                  placeholder="Filtrar tarea por nombre o código..."
                  leftIcon={<Search size={15} />}
                  value={searchTaskQuery}
                  onChange={(e) => setSearchTaskQuery(e.target.value)}
                  containerClassName="rounded-xl border border-slate-200 bg-white"
                  className="py-2 text-xs font-medium"
                />
              </div>

              <Button
                variant="dark"
                onClick={() => setIsCreateAssignmentModalOpen(true)}
                leftIcon={<Plus size={16} strokeWidth={3} />}
                className="px-5 py-2.5 text-xs font-black shadow-md"
              >
                Nueva Tarea
              </Button>
            </div>
          </div>

          {loadingAssignments ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAssignments.map((task, idx) => {
                const totalStudents = task.totalStudents || totalStudentsCount || 41;
                const delivered = task.deliveredCount ?? 0;
                const isCompleted = task.status === 'completed' || delivered >= totalStudents;
                const isPending = task.status === 'pending' || delivered === 0;

                const visuals = getAssignmentVisuals(task, idx);
                const cardBg = visuals.cardBg;
                const badgeColor = `${visuals.badgeBg} ${visuals.badgeText}`;
                const IconComp = visuals.IconComponent;

                let actionType: 'scan-qr' | 'scan-amber' | 'view-grades' | 'scan-batch' = 'scan-qr';

                if (isCompleted) {
                  actionType = 'view-grades';
                } else if (isPending) {
                  actionType = 'scan-batch';
                } else {
                  if (delivered > totalStudents / 2) {
                    actionType = 'scan-qr';
                  } else {
                    actionType = 'scan-amber';
                  }
                }

                return (
                  <Card
                    key={task._id}
                    bgColor={cardBg}
                    onClick={() => setSelectedAssignmentDetail(task)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white/95 shadow-xs border border-white/60 flex items-center justify-center shrink-0">
                        <IconComp className={`w-6 h-6 ${visuals.textColor}`} strokeWidth={2.2} />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-extrabold text-base text-slate-900 truncate hover:text-sky-600 transition-colors">
                            {task.title}
                          </h3>
                          <Badge className={`${badgeColor} text-[11px] font-black px-2.5 py-0.5`}>
                            {task.code || 'QR-ASG'}
                          </Badge>
                          {task.subject && (
                            <Badge status="neutral" className="bg-white/80 text-slate-600 text-[10px] font-bold px-2 py-0.5 border border-slate-200/60">
                              {task.subject.name}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-500">
                          {formatDueDate(task.dueDate)} •{' '}
                          <span className="text-slate-700 font-extrabold">
                            {`${delivered}/${totalStudents} escaneados`}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      {actionType === 'scan-qr' && (
                        <Button
                          variant="primary"
                          leftIcon={<QrCode size={16} />}
                          onClick={() => handleScanTask(task)}
                          className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 text-xs font-black shadow-sm"
                        >
                          Escanear QR
                        </Button>
                      )}

                      {actionType === 'scan-amber' && (
                        <Button
                          variant="warning"
                          leftIcon={<QrCode size={16} />}
                          onClick={() => handleScanTask(task)}
                          className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-4 py-2 text-xs font-black shadow-sm"
                        >
                          Escanear QR
                        </Button>
                      )}

                      {actionType === 'view-grades' && (
                        <Button
                          variant="success"
                          leftIcon={<CheckCircle2 size={16} />}
                          onClick={() => setSelectedAssignmentDetail(task)}
                          className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 text-xs font-black shadow-sm"
                        >
                          Calificaciones
                        </Button>
                      )}

                      {actionType === 'scan-batch' && (
                        <Button
                          variant="danger"
                          leftIcon={<ScanLine size={16} />}
                          onClick={() => handleScanTask(task)}
                          className="bg-[#f43f5e] hover:bg-[#e11d48] text-white px-4 py-2 text-xs font-black shadow-sm"
                        >
                          Escanear
                        </Button>
                      )}

                      <Button
                        variant="icon"
                        onClick={() => setAssignmentToEdit(task)}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 shadow-2xs"
                        title="Editar tarea"
                      >
                        <Pencil size={14} strokeWidth={2.2} />
                      </Button>

                      <Button
                        variant="icon"
                        onClick={() =>
                          setDeleteConfirmation({
                            isOpen: true,
                            type: 'assignment',
                            id: task._id,
                            name: task.title,
                            loading: false,
                          })
                        }
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 shadow-2xs"
                        title="Eliminar tarea"
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                      </Button>
                    </div>
                  </Card>
                );
              })}

              {filteredAssignments.length === 0 && (
                <Card className="text-center py-12 text-slate-400 text-sm font-bold border border-slate-100 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <p className="text-slate-700 font-extrabold">No se encontraron tareas registradas</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTaskQuery
                        ? `No hay coincidencias para "${searchTaskQuery}"`
                        : 'Haz clic en "Nueva Tarea" para asignar actividades a tus alumnos'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setIsCreateAssignmentModalOpen(true)}
                    leftIcon={<Plus size={16} />}
                    className="mt-2 text-xs font-bold"
                  >
                    Crear primera tarea
                  </Button>
                </Card>
              )}
            </div>
          )}
        </section>

      </main>

      {/* Modal Crear Nueva Materia */}
      <CreateSubjectModal
        isOpen={isCreateSubjectModalOpen}
        onClose={() => setIsCreateSubjectModalOpen(false)}
        onSubmit={handleCreateSubject}
      />

      {/* Modal Editar Materia */}
      <EditSubjectModal
        isOpen={!!subjectToEdit}
        subject={subjectToEdit}
        onClose={() => setSubjectToEdit(null)}
        onSubmit={handleEditSubject}
      />

      {/* Modal Crear Nueva Tarea */}
      <CreateAssignmentModal
        isOpen={isCreateAssignmentModalOpen}
        onClose={() => setIsCreateAssignmentModalOpen(false)}
        subjects={subjects}
        defaultSubjectId={
          selectedSubject && selectedSubject !== 'all' && selectedSubject !== '[object Object]'
            ? (typeof selectedSubject === 'object' && selectedSubject !== null ? (selectedSubject as any)._id : String(selectedSubject))
            : (subjects[0] ? (typeof subjects[0]._id === 'object' && subjects[0]._id !== null ? (subjects[0]._id as any)._id || String(subjects[0]._id) : String(subjects[0]._id)) : '')
        }
        onSubmit={handleCreateAssignment}
      />

      {/* Modal Editar Tarea */}
      <EditAssignmentModal
        isOpen={!!assignmentToEdit}
        assignment={assignmentToEdit}
        onClose={() => setAssignmentToEdit(null)}
        onSubmit={handleEditAssignment}
      />

      {/* Modal Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title={
          deleteConfirmation.type === 'subject'
            ? '¿Eliminar Asignatura?'
            : '¿Eliminar Tarea?'
        }
        description={
          deleteConfirmation.type === 'subject'
            ? 'Esta acción eliminará la materia y todas las tareas y calificaciones asociadas. Esta acción no se puede deshacer.'
            : 'Esta acción eliminará la tarea y sus registros de calificaciones asociados.'
        }
        itemName={deleteConfirmation.name}
        loading={deleteConfirmation.loading}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, type: 'subject', id: '', name: '', loading: false })
        }
        onConfirm={
          deleteConfirmation.type === 'subject'
            ? handleDeleteSubject
            : handleDeleteAssignment
        }
      />
    </>
  );
}
