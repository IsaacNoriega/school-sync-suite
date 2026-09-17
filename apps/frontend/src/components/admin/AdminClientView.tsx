'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Mail,
  Key,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Contact,
  X,
  CheckCircle2,
  School,
  Loader2,
  Clock,
  Calendar,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Button, Input, Card, Badge } from '@/components/ui';
import { API_BASE_URL } from '@/config/api';

const ChangePasswordModal = dynamic(() => import('@/components/ChangePasswordModal'), { ssr: false });

export interface SubjectItem {
  _id: string;
  name: string;
  code: string;
}

export interface TeacherItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  schoolName: string;
  schoolCycle?: string;
  entryTime?: string;
  shift?: string;
  code: string;
  isActive: boolean;
  subjects: SubjectItem[];
  createdAt: string;
  initials: string;
  avatarBg: string;
}

const AVATAR_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-purple-100 text-purple-800',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
];

export default function AdminClientView() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'suspendidos'>('todos');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [passwordModalTeacher, setPasswordModalTeacher] = useState<TeacherItem | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolCycle, setEditSchoolCycle] = useState('2025-2026');
  const [editEntryTime, setEditEntryTime] = useState('07:30');
  const [editShift, setEditShift] = useState('Matutino');
  const [isEditing, setIsEditing] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCycle, setNewSchoolCycle] = useState('2025-2026');
  const [newEntryTime, setNewEntryTime] = useState('07:30');
  const [newShift, setNewShift] = useState('Matutino');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  const fetchTeachers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/teachers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error('Sesión no autorizada o expirada');
          router.push('/login');
          return;
        }
        throw new Error('Error al consultar lista de maestros');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: TeacherItem[] = data.map((t: any, idx: number) => {
          const initials = t.name
            ? t.name
                .split(' ')
                .filter(Boolean)
                .map((w: string) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : 'DC';

          const shortId = t._id ? t._id.slice(-4).toUpperCase() : `00${idx + 1}`;

          return {
            id: t._id,
            userId: t.user?._id || '',
            name: t.name || 'Docente',
            email: t.user?.email || 'Sin correo',
            schoolName: t.schoolName || 'Sin institución asignada',
            schoolCycle: t.schoolCycle || '2025-2026',
            entryTime: t.entryTime || '07:30',
            shift: t.shift || 'Matutino',
            code: `DOC-${shortId}`,
            isActive: t.user?.isActive ?? true,
            subjects: Array.isArray(t.subjects) ? t.subjects : [],
            createdAt: t.createdAt || new Date().toISOString(),
            initials,
            avatarBg: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          };
        });

        setTeachers(mapped);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const totalAccounts = teachers.length;
  const activeCount = teachers.filter((t) => t.isActive).length;
  const suspendedCount = teachers.filter((t) => !t.isActive).length;

  const handleToggleStatus = async (teacher: TeacherItem) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newStatus = !teacher.isActive;
    const toastId = toast.loading(
      newStatus ? `Habilitando acceso a ${teacher.name}...` : `Suspendiendo acceso a ${teacher.name}...`
    );

    try {
      const res = await fetch(`${API_BASE_URL}/auth/teachers/${teacher.userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cambiar estado');
      }

      setTeachers((prev) =>
        prev.map((t) => (t.id === teacher.id ? { ...t, isActive: newStatus } : t))
      );

      toast.success(
        newStatus
          ? `Acceso habilitado para ${teacher.name}`
          : `Acceso suspendido para ${teacher.name}`,
        { id: toastId }
      );
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar el estado en la base de datos', {
        id: toastId,
      });
    }
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Registrando maestro en la base de datos...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          name: newName.trim(),
          schoolName: newSchoolName.trim() || 'Plantel Central',
          schoolCycle: newSchoolCycle.trim() || '2025-2026',
          entryTime: newEntryTime.trim() || '07:30',
          shift: newShift.trim() || 'Matutino',
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Error al registrar maestro');
      }

      toast.success(`¡${newName} registrado con éxito!`, { id: toastId });
      setIsRegisterModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewSchoolName('');
      setNewSchoolCycle('2025-2026');
      setNewEntryTime('07:30');
      setNewShift('Matutino');

      await fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar maestro', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminResetPassword = async (passwords: { newPass: string }) => {
    if (!passwordModalTeacher) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(
      `${API_BASE_URL}/auth/teachers/${passwordModalTeacher.userId}/reset-password`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: passwords.newPass }),
      }
    );

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resData.message || 'No se pudo restablecer la contraseña');
    }
  };

  const handleEditTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    if (!editName.trim() || !editSchoolName.trim()) {
      toast.error('Los campos no pueden estar vacíos');
      return;
    }

    setIsEditing(true);
    const toastId = toast.loading('Guardando cambios en la base de datos...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/teachers/${editingTeacher.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          schoolName: editSchoolName.trim(),
          schoolCycle: editSchoolCycle.trim() || '2025-2026',
          entryTime: editEntryTime.trim() || '07:30',
          shift: editShift.trim() || 'Matutino',
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.message || 'Error al actualizar docente');
      }

      toast.success('Docente actualizado con éxito', { id: toastId });
      setEditingTeacher(null);
      await fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar cambios', { id: toastId });
    } finally {
      setIsEditing(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const term = searchFilter.toLowerCase().trim();
      const matchesSearch =
        !term ||
        t.name.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term) ||
        t.code.toLowerCase().includes(term) ||
        t.schoolName.toLowerCase().includes(term) ||
        t.subjects.some(
          (s) =>
            s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)
        );

      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activos' && t.isActive) ||
        (statusFilter === 'suspendidos' && !t.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTeachers.slice(start, start + PAGE_SIZE);
  }, [filteredTeachers, currentPage, PAGE_SIZE]);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Gestión de Maestros
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1 max-w-xl">
              Administra los accesos docentes, estado de cuentas institucionales y materias registradas directamente en la base de datos.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsRegisterModalOpen(true)}
            leftIcon={<Plus className="w-5 h-5 stroke-[2.5]" />}
            className="px-6 py-3 font-black shadow-lg shadow-sky-400/25 shrink-0"
          >
            Registrar Maestro
          </Button>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card
            bgColor="bg-[#e0f2fe]"
            className="p-6 rounded-[2rem] border border-sky-100 flex flex-col justify-between relative overflow-hidden h-44 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">Total de Docentes</span>
              <div className="w-10 h-10 rounded-full bg-white text-sky-600 flex items-center justify-center shadow-xs">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div>
              <span className="text-4xl font-black text-slate-900 tracking-tight block">
                {loading ? '...' : totalAccounts}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 mt-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Registrados en MongoDB</span>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-sky-200/40 pointer-events-none" />
          </Card>

          <Card
            bgColor="bg-[#dcfce7]"
            className="p-6 rounded-[2rem] border border-emerald-100 flex flex-col justify-between relative overflow-hidden h-44 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Maestros Activos</span>
              <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div>
              <span className="text-4xl font-black text-slate-900 tracking-tight block">
                {loading ? '...' : activeCount}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Acceso Habilitado</span>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-emerald-200/40 pointer-events-none" />
          </Card>

          <Card
            bgColor="bg-[#fee2e2]"
            className="p-6 rounded-[2rem] border border-rose-100 flex flex-col justify-between relative overflow-hidden h-44 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900">Cuentas Suspendidas</span>
              <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-xs">
                <UserX className="w-5 h-5" />
              </div>
            </div>

            <div>
              <span className="text-4xl font-black text-slate-900 tracking-tight block">
                {loading ? '...' : suspendedCount}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 mt-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Bloqueadas o Inactivas</span>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-rose-200/40 pointer-events-none" />
          </Card>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTRADO */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <div className="w-full lg:w-96">
            <Input
              placeholder="Buscar por nombre, correo, escuela o materia..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="bg-white border border-slate-200/80 rounded-2xl py-3 text-xs font-medium placeholder:text-slate-400 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase mr-1">
              ESTADO:
            </span>

            <Button
              variant={statusFilter === 'todos' ? 'primary' : 'ghost'}
              size="sm"
              type="button"
              onClick={() => {
                setStatusFilter('todos');
                setCurrentPage(1);
              }}
              className={cn(
                'rounded-full px-4 py-2 font-bold text-xs transition-all',
                statusFilter !== 'todos' &&
                  'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              Todos ({totalAccounts})
            </Button>

            <Button
              variant={statusFilter === 'activos' ? 'primary' : 'ghost'}
              size="sm"
              type="button"
              onClick={() => {
                setStatusFilter('activos');
                setCurrentPage(1);
              }}
              className={cn(
                'rounded-full px-4 py-2 font-bold text-xs transition-all',
                statusFilter !== 'activos' &&
                  'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              Activos ({activeCount})
            </Button>

            <Button
              variant={statusFilter === 'suspendidos' ? 'primary' : 'ghost'}
              size="sm"
              type="button"
              onClick={() => {
                setStatusFilter('suspendidos');
                setCurrentPage(1);
              }}
              className={cn(
                'rounded-full px-4 py-2 font-bold text-xs transition-all',
                statusFilter !== 'suspendidos' &&
                  'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              Suspendidos ({suspendedCount})
            </Button>
          </div>
        </div>

        {/* LISTA DE MAESTROS */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-sm font-bold text-slate-600">Cargando maestros desde MongoDB...</p>
          </div>
        ) : paginatedTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">
              {teachers.length === 0
                ? 'No hay maestros registrados en la base de datos'
                : 'No se encontraron maestros con los filtros aplicados'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {teachers.length === 0
                ? 'Registra el primer docente institucional haciendo clic en el botón superior "Registrar Maestro".'
                : 'Prueba modificando los términos de búsqueda o cambiando el filtro de estado.'}
            </p>
            {teachers.length === 0 && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsRegisterModalOpen(true)}
                className="mt-2"
              >
                Registrar Maestro Ahora
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {paginatedTeachers.map((teacher) => (
              <Card
                key={teacher.id}
                bgColor="bg-white"
                className="p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border border-black/5 shadow-xs',
                      teacher.avatarBg
                    )}
                  >
                    {teacher.initials}
                  </div>

                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-900 truncate">
                        {teacher.name}
                      </h3>

                      <Badge
                        className="text-xs font-bold px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1"
                      >
                        <School className="w-3 h-3 text-slate-500" />
                        <span>{teacher.schoolName}</span>
                      </Badge>

                      <Badge
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        <span>Ciclo {teacher.schoolCycle || '2025-2026'}</span>
                      </Badge>

                      <Badge
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1"
                      >
                        <span>Turno {teacher.shift || 'Matutino'}</span>
                      </Badge>

                      <Badge
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Entrada: {teacher.entryTime || '07:30'}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {teacher.email}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Contact className="w-3.5 h-3.5 text-slate-400" />
                        ID: {teacher.code}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <Badge
                    color={
                      teacher.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }
                    className="text-xs font-bold px-3 py-1 rounded-full gap-1.5"
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        teacher.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                      )}
                    />
                    <span>{teacher.isActive ? 'Cuenta Activa' : 'Acceso Suspendido'}</span>
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setPasswordModalTeacher(teacher)}
                      className="w-9 h-9 !p-0 rounded-full bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Restablecer Contraseña (Admin)"
                    >
                      <Key className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setEditingTeacher(teacher);
                        setEditName(teacher.name);
                        setEditSchoolName(teacher.schoolName);
                        setEditSchoolCycle(teacher.schoolCycle || '2025-2026');
                        setEditEntryTime(teacher.entryTime || '07:30');
                        setEditShift(teacher.shift || 'Matutino');
                      }}
                      className="w-9 h-9 !p-0 rounded-full bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Editar Información"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => handleToggleStatus(teacher)}
                      className={cn(
                        'w-12 h-6.5 !p-0.5 rounded-full transition-colors relative flex items-center',
                        teacher.isActive
                          ? 'bg-emerald-600 justify-end'
                          : 'bg-slate-300 justify-start'
                      )}
                      title={teacher.isActive ? 'Suspender acceso' : 'Habilitar acceso'}
                    >
                      <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-1.5 mt-8 pt-4">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 !p-0 rounded-full text-slate-400 hover:text-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? 'primary' : 'ghost'}
                size="sm"
                type="button"
                onClick={() => setCurrentPage(p)}
                className={cn(
                  'w-8 h-8 !p-0 rounded-full font-bold text-xs',
                  p === currentPage ? 'font-black' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 !p-0 rounded-full text-slate-400 hover:text-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      {/* MODAL: REGISTRAR MAESTRO */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-white rounded-[2.2rem] p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                  <Users className="w-5 h-5 stroke-[2.4]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Registrar Maestro
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Crea la cuenta docente, ciclo escolar y hora de entrada
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 !p-0 rounded-full bg-slate-100/90 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </div>

            <form onSubmit={handleRegisterTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nombre Completo *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Ej. Mtra. Kenia Morales"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Correo Institucional *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="kenia@colegio.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Contraseña Inicial *
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Colegio / Plantel Escolar *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Ej. Colegio San Patricio"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Ciclo Escolar *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={newSchoolCycle}
                      onChange={(e) => setNewSchoolCycle(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none cursor-pointer"
                    >
                      <option value="2024-2025">Ciclo 2024 - 2025</option>
                      <option value="2025-2026">Ciclo 2025 - 2026</option>
                      <option value="2026-2027">Ciclo 2026 - 2027</option>
                      <option value="2027-2028">Ciclo 2027 - 2028</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Hora de Entrada *</span>
                  </label>
                  <Input
                    type="time"
                    required
                    value={newEntryTime}
                    onChange={(e) => setNewEntryTime(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Turno Escolar *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={newShift}
                      onChange={(e) => setNewShift(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none cursor-pointer"
                    >
                      <option value="Matutino">Turno Matutino</option>
                      <option value="Vespertino">Turno Vespertino</option>
                      <option value="Nocturno">Turno Nocturno</option>
                      <option value="Mixto">Turno Mixto</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <Button
                  variant="ghost"
                  size="md"
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-100 px-5 cursor-pointer h-10"
                >
                  Cancelar
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                  className="px-6 font-black shadow-lg shadow-sky-400/25 cursor-pointer h-10"
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar Maestro'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: EDITAR MAESTRO */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-white rounded-[2.2rem] p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Badge
                  size="lg"
                  color="bg-sky-100 text-sky-600 rounded-2xl p-2.5 flex items-center justify-center aspect-square"
                >
                  <Pencil className="w-5 h-5 stroke-[2.2]" />
                </Badge>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Editar Maestro
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Modifica los datos del docente, ciclo y horario en la base de datos
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="w-8 h-8 !p-0 rounded-full bg-slate-100/90 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </div>

            <form onSubmit={handleEditTeacherSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nombre Completo *
                  </label>
                  <Input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Colegio / Plantel Escolar *
                  </label>
                  <Input
                    type="text"
                    required
                    value={editSchoolName}
                    onChange={(e) => setEditSchoolName(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Ciclo Escolar *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={editSchoolCycle}
                      onChange={(e) => setEditSchoolCycle(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none cursor-pointer"
                    >
                      <option value="2024-2025">Ciclo 2024 - 2025</option>
                      <option value="2025-2026">Ciclo 2025 - 2026</option>
                      <option value="2026-2027">Ciclo 2026 - 2027</option>
                      <option value="2027-2028">Ciclo 2027 - 2028</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Hora de Entrada *</span>
                  </label>
                  <Input
                    type="time"
                    required
                    value={editEntryTime}
                    onChange={(e) => setEditEntryTime(e.target.value)}
                    className="text-sm font-semibold h-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Turno Escolar *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={editShift}
                      onChange={(e) => setEditShift(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none cursor-pointer"
                    >
                      <option value="Matutino">Turno Matutino</option>
                      <option value="Vespertino">Turno Vespertino</option>
                      <option value="Nocturno">Turno Nocturno</option>
                      <option value="Mixto">Turno Mixto</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Correo Electrónico (No editable)
                  </label>
                  <Input
                    type="email"
                    disabled
                    value={editingTeacher.email}
                    className="text-sm font-semibold bg-slate-100 opacity-75 cursor-not-allowed h-10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <Button
                  variant="ghost"
                  size="md"
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-100 px-5 cursor-pointer h-10"
                >
                  Cancelar
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={isEditing}
                  leftIcon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                  className="px-6 font-black shadow-lg shadow-sky-400/25 cursor-pointer h-10"
                >
                  {isEditing ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: RESTABLECER CONTRASEÑA */}
      <ChangePasswordModal
        isOpen={!!passwordModalTeacher}
        onClose={() => setPasswordModalTeacher(null)}
        teacherName={passwordModalTeacher?.name}
        teacherRole="Docente Institucional"
        teacherGrade={passwordModalTeacher?.schoolName}
        isAdminReset={true}
        onSubmit={handleAdminResetPassword}
      />
    </>
  );
}
