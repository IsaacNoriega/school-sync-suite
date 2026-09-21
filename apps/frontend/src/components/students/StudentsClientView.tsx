'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Download,
  Printer,
  Trash2,
  Info,
  Loader2,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Badge } from '@/components/ui';
import { API_BASE_URL } from '@/config/api';

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

interface StudentItem {
  _id: string;
  name: string;
  enrollmentNumber: string;
  qrCode: string;
  tutor?: string;
  tutorPhone?: string;
  group?: string;
  shift?: string;
  timeLabel?: string;
  avatarType?: string;
  themeColor?: 'emerald' | 'amber' | 'rose' | 'sky';
  createdAt?: string;
}

export default function StudentsClientView() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [currentUser, setCurrentUser] = useState<{
    schoolCycle?: string;
    shift?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [activePreviewStudent, setActivePreviewStudent] = useState<StudentItem | null>(null);

  const badgeRef = useRef<HTMLDivElement>(null);

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
        .catch(() => {});
    }
  }, []);

  const formatTimeLabel = (dateStr?: string) => {
    if (!dateStr) return 'Reciente';
    try {
      const d = new Date(dateStr);
      const isToday = new Date().toDateString() === d.toDateString();
      const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return isToday ? `Hoy ${timePart}` : `${d.toLocaleDateString([], { day: '2-digit', month: 'short' })} ${timePart}`;
    } catch {
      return 'Reciente';
    }
  };

  const fetchStudents = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/students`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const themes: ('emerald' | 'amber' | 'rose' | 'sky')[] = ['emerald', 'amber', 'rose', 'sky'];
          const avatars = ['sofia', 'dante', 'sabine', 'mateo'];

          const formatted: StudentItem[] = data.map((st: any, idx: number) => {
            const theme = themes[idx % themes.length];
            const avatar = avatars[idx % avatars.length];
            const enrollment = st.enrollmentNumber?.startsWith('#')
              ? st.enrollmentNumber
              : `#${st.enrollmentNumber || `EQR-${(idx + 1).toString().padStart(4, '0')}`}`;

            return {
              _id: st._id,
              name: st.name,
              enrollmentNumber: enrollment,
              qrCode: st.qrCode || `QR-${enrollment.replace('#', '')}`,
              tutor: st.tutor || '',
              tutorPhone: st.tutorPhone || '',
              timeLabel: formatTimeLabel(st.createdAt),
              avatarType: avatar,
              themeColor: theme,
              createdAt: st.createdAt,
            };
          });

          setStudents(formatted);

          if (formatted.length > 0) {
            setActivePreviewStudent((prev) => prev || formatted[0]);
            if (!enrollmentNumber) {
              setEnrollmentNumber(`#EQR-${(formatted.length + 1050)}`);
            }
          } else {
            setEnrollmentNumber('#EQR-1001');
          }
        }
      }
    } catch (err) {
      console.error('Error al consultar alumnos de la BD:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleGenerateAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Por favor escribe el nombre completo del alumno');
      return;
    }

    setLoading(true);
    const cleanEnrollment = enrollmentNumber.trim() || `#EQR-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: fullName.trim(),
          enrollmentNumber: cleanEnrollment.replace('#', ''),
          tutor: tutorName.trim(),
          tutorPhone: tutorPhone.trim(),
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        const newStudent: StudentItem = {
          _id: saved._id,
          name: saved.name,
          enrollmentNumber: `#${saved.enrollmentNumber || cleanEnrollment.replace('#', '')}`,
          qrCode: saved.qrCode,
          tutor: saved.tutor || tutorName.trim() || '',
          tutorPhone: saved.tutorPhone || tutorPhone.trim() || '',
          timeLabel: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatarType: 'sofia',
          themeColor: 'emerald',
          createdAt: saved.createdAt || new Date().toISOString(),
        };

        setStudents((prev) => [newStudent, ...prev]);
        setActivePreviewStudent(newStudent);
        setFullName('');
        setTutorName('');
        setTutorPhone('');
        setEnrollmentNumber(`#EQR-${students.length + 1052}`);
        toast.success(`¡${saved.name} guardado en la base de datos con éxito!`);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Error al guardar el alumno en la base de datos');
      }
    } catch (error) {
      console.error('Error de red al guardar alumno:', error);
      toast.error('No se pudo conectar con el servidor para registrar el alumno');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFullName('');
    setTutorName('');
    setTutorPhone('');
    setEnrollmentNumber(`#EQR-${students.length + 1051}`);
    toast('Formulario listo para nuevo registro', {
      icon: <Sparkles size={18} className="text-amber-500" />,
    });
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadBadge = () => {
    if (!activePreviewStudent) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      activePreviewStudent.qrCode
    )}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `Gafete_${activePreviewStudent.enrollmentNumber.replace('#', '')}_${activePreviewStudent.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Descarga del código QR iniciada');
  };

  const handleExportAll = () => {
    if (students.length === 0) {
      toast.error('No hay alumnos registrados para exportar');
      return;
    }
    const header = 'ID,Nombre,Matricula,Tutor,TelefonoTutor,CodigoQR,FechaCreacion\n';
    const rows = students
      .map(
        (s) =>
          `"${s._id}","${s.name}","${s.enrollmentNumber}","${s.tutor || ''}","${s.tutorPhone || ''}","${s.qrCode}","${s.createdAt || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lote_Alumnos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Lote completo descargado en CSV');
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el registro de ${name} de la base de datos?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s._id !== id));
        if (activePreviewStudent?._id === id) {
          const remaining = students.filter((s) => s._id !== id);
          setActivePreviewStudent(remaining.length > 0 ? remaining[0] : null);
        }
        toast.success(`Registro de ${name} eliminado de la base de datos`);
      } else {
        toast.error('No se pudo eliminar el alumno');
      }
    } catch {
      toast.error('Error de conexión al eliminar');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 space-y-6">
      {/* SUBHEADER: Título */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Registrar Alumnos
          </h1>
        </div>
      </div>

      {/* FILA SUPERIOR: Formulario (Izquierda) + Código QR Generado (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* COLUMNA IZQUIERDA: Formulario de Registro */}
        <div className="bg-white rounded-3xl border border-slate-100 p-7 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2">
              <Badge status="info" className="gap-1.5 px-3 py-1.5">
                <UserPlus size={14} />
                <span>Alta Rápida de Expediente</span>
              </Badge>
              <span className="text-xs font-semibold text-slate-400">
                Ciclo {currentUser?.schoolCycle || '2025-2026'} • Emisión QR
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-4">
              Datos del Nuevo Estudiante
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Ingresa la información requerida del alumno y tutor para generar su credencial QR.
            </p>

            <form onSubmit={handleGenerateAndSave} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre Completo del Alumno *
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sofía Valentina Morales"
                  className="bg-[#f1f5f9]/70 border-0 px-4 py-3.5 text-sm font-semibold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Matrícula Escolar / ID
                </label>
                <Input
                  type="text"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  placeholder="#EQR-1092"
                  className="bg-[#f1f5f9]/70 border-0 px-4 py-3.5 text-sm font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nombre del Tutor
                  </label>
                  <Input
                    type="text"
                    value={tutorName}
                    onChange={(e) => setTutorName(e.target.value)}
                    placeholder="Sra. Claudia Morales"
                    className="bg-[#f1f5f9]/70 border-0 px-4 py-3.5 text-sm font-semibold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Número / Teléfono del Tutor
                  </label>
                  <Input
                    type="tel"
                    value={tutorPhone}
                    onChange={(e) => setTutorPhone(e.target.value)}
                    placeholder="+52 33 1234 5678"
                    className="bg-[#f1f5f9]/70 border-0 px-4 py-3.5 text-sm font-semibold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3 mt-8 pt-4">
            <Button
              type="submit"
              onClick={() => handleGenerateAndSave()}
              disabled={loading}
              leftIcon={loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
              className="flex-1 bg-[#009ee3] hover:bg-[#0284c7] py-3.5 px-6 shadow-lg shadow-sky-500/25 text-sm"
            >
              <span>{loading ? 'Guardando en BD...' : 'Generar QR y Guardar'}</span>
            </Button>

            <Button
              variant="secondary"
              onClick={handleClear}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 px-8 text-sm"
            >
              Limpiar
            </Button>
          </div>
        </div>

        {/* COLUMNA DERECHA: Vista Previa del Código QR Generado */}
        <div className="bg-[#f0f9ff]/70 border border-sky-100/90 rounded-3xl p-7 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 pb-2">
            <Badge status="success" className="gap-1.5 px-3 py-1 border border-emerald-200/70">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
              <span>Código QR Generado</span>
            </Badge>

            <Badge status="neutral" className="bg-white/80 border border-slate-200/80 text-slate-600 px-3 py-1 shadow-2xs">
              Ciclo {currentUser?.schoolCycle || '2025-2026'}
            </Badge>
          </div>

          {activePreviewStudent ? (
            <div ref={badgeRef} className="flex flex-col items-center text-center my-auto py-2 animate-in fade-in">
              <Badge status="neutral" className="gap-1.5 bg-slate-100/90 text-slate-600 text-[10px] uppercase px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>QR LISTO PARA ESCANEAR</span>
              </Badge>

              <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                {activePreviewStudent.name}
              </h3>

              <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-bold text-sky-600">
                  {activePreviewStudent.enrollmentNumber}
                </span>
                {activePreviewStudent.tutor && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-600">
                      Tutor: {activePreviewStudent.tutor}
                    </span>
                  </>
                )}
              </div>

              <div className="my-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    activePreviewStudent.qrCode
                  )}&color=0f172a&bgcolor=ffffff`}
                  alt={`QR de ${activePreviewStudent.name}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-2xl object-contain"
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Alta definición • Compatible con lector y app móvil</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 rounded-3xl border border-dashed border-slate-200 p-8 max-w-[340px] mx-auto w-full text-center flex flex-col items-center justify-center my-8 text-slate-400">
              <QrCode size={40} className="text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600">Sin alumnos registrados</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Ingresa los datos en el formulario a la izquierda para generar el primer código QR.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={handleDownloadBadge}
              disabled={!activePreviewStudent}
              leftIcon={<Download size={16} />}
              className="flex-1 bg-[#009ee3] hover:bg-[#0284c7] py-3.5 px-6 shadow-lg shadow-sky-500/25 text-sm"
            >
              Descargar QR (PNG/SVG)
            </Button>

            <Button
              variant="secondary"
              onClick={handlePrint}
              disabled={!activePreviewStudent}
              leftIcon={<Printer size={16} />}
              className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 py-3.5 px-6 text-sm shadow-xs shrink-0"
            >
              Imprimir Código
            </Button>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Alumnos Registrados Recientemente */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Alumnos Registrados Recientemente
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Expedientes guardados en la base de datos con credenciales activas
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <Button
              variant="ghost"
              onClick={handleExportAll}
              leftIcon={<Info size={14} className="text-slate-400" />}
              className="hover:text-sky-600 text-xs font-bold text-slate-500 p-0"
            >
              Descargar Lote Completo (CSV)
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/students/directory')}
              className="hover:text-sky-600 text-slate-500 font-bold text-xs p-0"
            >
              Ver Todos ({students.length})
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative space-y-3">
          <div className="grid grid-cols-12 px-4 pb-2 text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">
            <div className="col-span-6 flex items-center gap-1">
              <span>NOMBRE DEL ALUMNO</span>
            </div>
            <div className="col-span-3">
              <span>MATRÍCULA / TUTOR</span>
            </div>
            <div className="col-span-3 text-right">
              <span>ACCIONES</span>
            </div>
          </div>

          {fetching && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 size={24} className="animate-spin text-sky-500" />
              <span className="text-xs font-bold">Cargando alumnos desde la base de datos...</span>
            </div>
          )}

          {!fetching && students.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-bold text-slate-600">No hay alumnos registrados en la base de datos.</p>
              <p className="text-xs text-slate-400 mt-1">Usa el formulario superior para registrar el primer estudiante.</p>
            </div>
          )}

          {!fetching &&
            students.slice(0, 8).map((student, idx) => {
              const isSelected = activePreviewStudent?._id === student._id;
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

              const cleanCode = student.enrollmentNumber.replace('#', '');

              return (
                <div
                  key={student._id}
                  onClick={() => setActivePreviewStudent(student)}
                  className={`bg-white rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${
                    isSelected ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-100 hover:border-slate-200'
                  }`}
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
                      {student.tutor && (
                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                          Tutor: {student.tutor} {student.tutorPhone ? `• Tel: ${student.tutorPhone}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {/* Botón/Badge QR Pill */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewStudent(student);
                      }}
                      className="bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode size={13} className="text-slate-500" />
                      <span>QR-{cleanCode}</span>
                    </div>

                    {/* Botón Descargar */}
                    <Button
                      variant="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewStudent(student);
                        handleDownloadBadge();
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-sky-600 hover:bg-slate-100 shadow-2xs"
                      title="Descargar QR"
                    >
                      <Download size={15} />
                    </Button>

                    {/* Botón Eliminar */}
                    <Button
                      variant="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStudent(student._id, student.name);
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-2xs"
                      title="Eliminar expediente"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </main>
  );
}
