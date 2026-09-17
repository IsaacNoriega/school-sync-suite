'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Users,
  UserPlus,
  QrCode,
  Download,
  Trash2,
  Edit2,
  Printer,
  Search,
  ArrowUpDown,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderDown,
  Contact,
  GraduationCap,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Badge } from '@/components/ui';
import { API_BASE_URL } from '@/config/api';

const StudentQrModal = dynamic(() => import('@/components/StudentQrModal'), { ssr: false });
const EditStudentModal = dynamic(() => import('@/components/EditStudentModal'), { ssr: false });

/* ===== AVATARES SVG ILUSTRADOS ===== */
function StudentAvatar({ type, size = 44 }: { type?: string; size?: number }) {
  if (type === 'sofia' || type === 'emerald') {
    return (
      <svg
        viewBox="0 0 44 44"
        style={{ width: size, height: size }}
        className="rounded-full overflow-hidden shrink-0 shadow-xs"
      >
        <circle cx="22" cy="22" r="22" fill="#a7f3d0" />
        <ellipse cx="22" cy="38" rx="14" ry="9" fill="#059669" />
        <circle cx="22" cy="20" r="8" fill="#fde047" />
        <path
          d="M14 18C14 13 17 11 22 11C27 11 30 13 30 18C28 16 26 15 22 15C18 15 16 16 14 18Z"
          fill="#dc2626"
        />
        <circle cx="19.5" cy="20" r="1.2" fill="#1e293b" />
        <circle cx="24.5" cy="20" r="1.2" fill="#1e293b" />
        <path
          d="M20 23.5C21 24.5 23 24.5 24 23.5"
          stroke="#1e293b"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === 'dante' || type === 'amber') {
    return (
      <svg
        viewBox="0 0 44 44"
        style={{ width: size, height: size }}
        className="rounded-full overflow-hidden shrink-0 shadow-xs"
      >
        <circle cx="22" cy="22" r="22" fill="#fef08a" />
        <ellipse cx="22" cy="38" rx="14" ry="9" fill="#2563eb" />
        <circle cx="22" cy="20" r="8" fill="#f5c298" />
        <path
          d="M14 18C15 13 18 11 22 11C26 11 29 13 30 18C28 16 26 15 22 15C18 15 16 16 14 18Z"
          fill="#1e293b"
        />
        <circle cx="19.5" cy="20.5" r="1.2" fill="#0f172a" />
        <circle cx="24.5" cy="20.5" r="1.2" fill="#0f172a" />
        <path
          d="M20.5 24C21 24.8 23 24.8 23.5 24"
          stroke="#0f172a"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === 'sabine' || type === 'rose') {
    return (
      <svg
        viewBox="0 0 44 44"
        style={{ width: size, height: size }}
        className="rounded-full overflow-hidden shrink-0 shadow-xs"
      >
        <circle cx="22" cy="22" r="22" fill="#fcd5ce" />
        <ellipse cx="22" cy="38" rx="14" ry="9" fill="#e76f51" />
        <circle cx="22" cy="20" r="8" fill="#b06c49" />
        <path
          d="M14 19C14 14 17 11 22 11C27 11 30 14 30 19C28 17 26 17 22 17C18 17 16 17 14 19Z"
          fill="#592d1d"
        />
        <circle cx="19.5" cy="20.5" r="1.2" fill="#2b1408" />
        <circle cx="24.5" cy="20.5" r="1.2" fill="#2b1408" />
        <path
          d="M20.5 24C21 24.5 23 24.5 23.5 24"
          stroke="#2b1408"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 44 44"
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden shrink-0 shadow-xs"
    >
      <circle cx="22" cy="22" r="22" fill="#bae6fd" />
      <ellipse cx="22" cy="38" rx="14" ry="9" fill="#0284c7" />
      <circle cx="22" cy="20" r="8" fill="#fed7aa" />
      <path
        d="M14 18C15 13 18 11 22 11C26 11 29 13 30 18C28 16 26 15 22 15C18 15 16 16 14 18Z"
        fill="#0369a1"
      />
      <circle cx="19.5" cy="20.5" r="1.2" fill="#082f49" />
      <circle cx="24.5" cy="20.5" r="1.2" fill="#082f49" />
      <path
        d="M20.5 24C21 24.8 23 24.8 23.5 24"
        stroke="#082f49"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface DirectoryStudent {
  _id: string;
  name: string;
  enrollmentNumber: string;
  qrCode: string;
  group: string;
  shift: string;
  tutor: string;
  tutorPhone?: string;
  status: 'EMITTED' | 'PENDING';
  badgeType?: string;
  avatarType: string;
  createdAt?: string;
}

export default function StudentsDirectoryClientView() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<DirectoryStudent[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'printed' | 'pending' | 'morning'>('all');
  const [sortBy, setSortBy] = useState<'alpha' | 'id'>('alpha');
  const [modalStudent, setModalStudent] = useState<{ name: string; qrCode: string } | null>(null);
  const [editingStudent, setEditingStudent] = useState<DirectoryStudent | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    schoolName?: string;
    schoolCycle?: string;
    shift?: string;
    entryTime?: string;
  } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
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
        .catch(() => {});
    }
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/students`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const avatars = ['sofia', 'dante', 'sabine', 'mateo'];
          const mapped: DirectoryStudent[] = data.map((item: any, idx: number) => {
            const avatar = avatars[idx % avatars.length];
            const enrollment = item.enrollmentNumber?.startsWith('#')
              ? item.enrollmentNumber
              : `#${item.enrollmentNumber || `EQR-${(idx + 1).toString().padStart(4, '0')}`}`;

            const status: 'EMITTED' | 'PENDING' =
              item.status === 'PENDING' || !item.qrCode ? 'PENDING' : 'EMITTED';

            let badgeType: string | undefined = undefined;
            if (item.badgeType) {
              badgeType = item.badgeType;
            } else if (status === 'PENDING') {
              badgeType = idx % 2 === 0 ? 'Nuevo Registro' : 'Reimpresión Solicitada';
            }

            return {
              _id: item._id,
              name: item.name,
              enrollmentNumber: enrollment,
              qrCode: item.qrCode || `QR-${enrollment.replace('#', '')}`,
              group: item.group || '3° B',
              shift: item.shift || currentUser?.shift || 'Matutino',
              tutor: item.tutor || 'Sin tutor asignado',
              tutorPhone: item.tutorPhone || '',
              status,
              badgeType,
              avatarType: avatar,
              createdAt: item.createdAt,
            };
          });

          setStudents(mapped);
        }
      } else {
        toast.error('No se pudieron cargar los alumnos de la base de datos');
      }
    } catch (err) {
      console.error('Error al consultar directorio de alumnos:', err);
      toast.error('Error de conexión al cargar el directorio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const totalCount = students.length;
  const printedCount = students.filter((s) => s.status === 'EMITTED' && s.qrCode).length;
  const pendingCount = students.filter((s) => s.status === 'PENDING' || !s.qrCode).length;
  const morningCount = students.filter((s) => s.shift === 'Matutino' || !s.shift).length;
  const percentReady = totalCount > 0 ? Math.round((printedCount / totalCount) * 100) : 0;


  const filteredStudents = students
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tutor.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (activeFilter === 'printed') return s.status === 'EMITTED';
      if (activeFilter === 'pending') return s.status === 'PENDING';
      if (activeFilter === 'morning') return s.shift === 'Matutino';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return a.name.localeCompare(b.name);
      return a.enrollmentNumber.localeCompare(b.enrollmentNumber);
    });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );


  const handleDownloadAllZipped = () => {
    if (students.length === 0) {
      toast.error('No hay alumnos para exportar');
      return;
    }
    const header = 'ID,Nombre,Matricula,Grupo,Turno,Tutor,Estado,CodigoQR\n';
    const rows = students
      .map(
        (s) =>
          `"${s._id}","${s.name}","${s.enrollmentNumber}","${s.group}","${s.shift}","${s.tutor}","${s.status}","${s.qrCode}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Directorio_Completo_Alumnos.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Descarga del lote completo iniciada');
  };

  const handleEditStudent = (student: DirectoryStudent) => {
    setEditingStudent(student);
  };

  const handleSaveStudentEdit = async (
    id: string,
    updatedData: {
      name: string;
      enrollmentNumber: string;
      group: string;
      shift: string;
      tutor: string;
      tutorPhone: string;
    }
  ) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al actualizar información');
      }

      setStudents((prev) =>
        prev.map((s) => (s._id === id ? { ...s, ...updatedData } : s))
      );
      toast.success('Información del alumno actualizada con éxito');
    } catch (err: any) {
      toast.error(err.message || 'Error al comunicar con la base de datos');
      throw err;
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} permanentemente de la base de datos?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s._id !== id));
        toast.success('Alumno eliminado de la base de datos');
      } else {
        toast.error('No se pudo eliminar de la base de datos');
      }
    } catch {
      toast.error('Error de conexión al eliminar');
    }
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-5 space-y-6">
        {/* BREADCRUMB */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Button
              variant="ghost"
              onClick={() => router.push('/students')}
              leftIcon={<GraduationCap size={15} className="text-slate-400" />}
              className="hover:text-sky-600 text-xs font-semibold text-slate-500 p-0"
            >
              <span>Gestión de Alumnos</span>
            </Button>
            <span className="text-slate-300 font-bold">›</span>
            <Badge status="info" className="font-black px-3 py-1 shadow-2xs">
              Directorio Completo ({totalCount})
            </Badge>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push('/students')}
            leftIcon={<ArrowLeft size={14} strokeWidth={2.5} />}
            className="bg-white border border-slate-200/90 hover:bg-slate-50 text-sky-600 hover:text-sky-700 text-xs font-black px-4 py-2 shadow-2xs"
          >
            <span>Volver a Registro de Alumnos</span>
          </Button>
        </div>

        {/* SUBHEADER: Título de Directorio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
              <Contact size={24} />
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Directorio de Alumnos
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>
                  {totalCount} alumnos inscritos en {students[0]?.group || '3° B'} • {currentUser?.schoolName || 'Primaria'} • Ciclo Escolar {currentUser?.schoolCycle || '2025-2026'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleDownloadAllZipped}
              leftIcon={<FolderDown size={16} className="text-slate-500" />}
              className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 text-xs sm:text-sm shadow-xs"
            >
              <span>Descargar Todos los Gafetes (PDF ZIP)</span>
            </Button>

            <Button
              onClick={() => router.push('/students')}
              leftIcon={<UserPlus size={16} />}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold px-5 py-2.5 text-xs sm:text-sm shadow-md shadow-sky-500/20"
            >
              <span>+ Nuevo Alumno</span>
            </Button>
          </div>
        </div>

        {/* MÉTRICAS KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total</span>
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users size={14} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-2">{totalCount}</div>
            <span className="text-[11px] font-bold text-slate-400">100% expedientes activos</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">QR Emitidos</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <QrCode size={14} />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight mt-2">{printedCount}</div>
            <span className="text-[11px] font-bold text-emerald-600/90">{percentReady}% listos para escanear</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pendientes</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle size={14} />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-500 tracking-tight mt-2">{pendingCount}</div>
            <span className="text-[11px] font-bold text-amber-600/90">Requieren credencial física</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Turno {currentUser?.shift || 'Matutino'}</span>
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Check size={14} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-2">{morningCount}</div>
            <span className="text-[11px] font-bold text-slate-400">Entrada: {currentUser?.entryTime || '07:30'}</span>
          </div>
        </div>

        {/* BARRA DE FILTROS & BÚSQUEDA */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Buscar por nombre, matrícula o tutor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search size={16} className="text-slate-400" />}
                className="bg-[#f8fafc] border-slate-200/80 text-xs sm:text-sm font-semibold placeholder-slate-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={activeFilter === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setActiveFilter('all');
                  setCurrentPage(1);
                }}
                className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${
                  activeFilter === 'all' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({totalCount})
              </Button>

              <Button
                variant={activeFilter === 'printed' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setActiveFilter('printed');
                  setCurrentPage(1);
                }}
                className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${
                  activeFilter === 'printed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                QR Emitidos ({printedCount})
              </Button>

              <Button
                variant={activeFilter === 'pending' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setActiveFilter('pending');
                  setCurrentPage(1);
                }}
                className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${
                  activeFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pendientes ({pendingCount})
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSortBy((prev) => (prev === 'alpha' ? 'id' : 'alpha'))}
                leftIcon={<ArrowUpDown size={14} className="text-slate-500" />}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs hover:bg-slate-50"
              >
                <span>{sortBy === 'alpha' ? 'Alfabético (A-Z)' : 'Por Matrícula'}</span>
              </Button>
            </div>
          </div>


        </div>

        {/* LISTA DE ALUMNOS */}
        <div className="space-y-3">
          {/* Cabecera de la tabla */}
          <div className="bg-white/60 rounded-2xl px-5 py-3 border border-slate-200/60 flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-3">
              <span>INFORMACIÓN DEL ALUMNO</span>
            </div>
            <div className="flex items-center gap-12 pr-4">
              <span className="hidden sm:inline">ESTADO DE GAFETE</span>
              <span>ACCIONES RÁPIDAS</span>
            </div>
          </div>

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-3xl border border-slate-100">
              <Loader2 size={28} className="animate-spin text-sky-500" />
              <span className="text-xs font-bold">Cargando directorio completo desde MongoDB...</span>
            </div>
          )}

          {!loading && paginatedStudents.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
              <Users size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No se encontraron alumnos con los filtros actuales</p>
              <p className="text-xs text-slate-400 mt-1">Prueba cambiando el término de búsqueda o seleccionando otro filtro.</p>
            </div>
          )}

          {!loading &&
            paginatedStudents.map((student, idx) => {
              const isPending = student.status === 'PENDING';
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

              const cleanCode = student.enrollmentNumber.replace('#', '');

              return (
                <div
                  key={student._id}
                  className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-100 hover:border-slate-200 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                      {getInitials(student.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {student.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          #{cleanCode}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-500 mt-0.5">
                        Tutor: {student.tutor} {student.tutorPhone ? `• Tel: ${student.tutorPhone}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap justify-end shrink-0">
                    {student.status === 'EMITTED' ? (
                      <Badge className="bg-[#dcfce7] text-[#15803d] font-black text-xs px-3.5 py-1.5 rounded-full border-none flex items-center gap-1.5">
                        <Check size={13} strokeWidth={3} />
                        <span>QR Emitido</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-[#fef3c7] text-[#b45309] font-black text-xs px-3.5 py-1.5 rounded-full border-none flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        <span>Pendiente</span>
                      </Badge>
                    )}

                    <div
                      onClick={() => setModalStudent({ name: student.name, qrCode: student.qrCode })}
                      className="bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode size={13} className="text-slate-500" />
                      <span>QR-{cleanCode}</span>
                    </div>

                    {isPending && (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => {
                          toast.success(`Imprimiendo gafete de ${student.name}`);
                          if (typeof window !== 'undefined') window.print();
                        }}
                        leftIcon={<Printer size={13} />}
                        className="text-xs px-3.5 py-1.5 rounded-xl shadow-xs"
                      >
                        <span>Imprimir</span>
                      </Button>
                    )}

                    <Button
                      variant="icon"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          student.qrCode
                        )}`;
                        link.download = `Gafete_${student.name.replace(/\s+/g, '_')}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success(`Descargando gafete de ${student.name}`);
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-sky-600 hover:bg-slate-100 shadow-2xs"
                      title="Descargar Gafete"
                    >
                      <Download size={15} />
                    </Button>

                    <Button
                      variant="icon"
                      onClick={() => handleEditStudent(student)}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-sky-600 hover:bg-slate-100 shadow-2xs"
                      title="Editar alumno"
                    >
                      <Edit2 size={15} />
                    </Button>

                    <Button
                      variant="icon"
                      onClick={() => handleDeleteStudent(student._id, student.name)}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-2xs"
                      title="Eliminar de directorio"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* FOOTER: PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-12 border-t border-slate-200/60">
          <div className="text-xs font-bold text-slate-400">
            {filteredStudents.length > 0 ? (
              <>
                Mostrando <strong>{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)}</strong> de <strong>{filteredStudents.length}</strong> alumnos registrados
              </>
            ) : (
              'Sin resultados'
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-center">
              <Button
                variant="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 shadow-2xs"
              >
                <ChevronLeft size={14} />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  size="sm"
                  variant={currentPage === page ? 'primary' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 p-0 rounded-full font-bold text-xs ${
                    currentPage === page
                      ? 'bg-sky-500 text-white shadow-xs font-black'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 shadow-2xs"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          )}

          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 self-center sm:self-auto">
            <span className="text-sky-600 font-extrabold">EducaQR Sync</span>
            <span>•</span>
            <span>Directorio sincronizado con MongoDB ({totalCount} registros)</span>
          </div>
        </div>
      </main>

      {/* Modal de QR */}
      {modalStudent && (
        <StudentQrModal
          student={modalStudent}
          onClose={() => setModalStudent(null)}
        />
      )}

      {/* Modal de Edición de Alumno */}
      <EditStudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onSubmit={handleSaveStudentEdit}
      />
    </>
  );
}
