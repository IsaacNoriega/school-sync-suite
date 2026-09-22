'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  QrCode,
  Download,
  Printer,
  Trash2,
  Loader2,
  UserPlus,
  Sparkles,
  Users,
  Search,
  Edit2,
  X,
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

export interface StudentItem {
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
  // Estado local para navegación de pestañas
  const [activeTab, setActiveTab] = useState<'quick-register' | 'directory'>('quick-register');

  // Formulario de Alta Rápida
  const [fullName, setFullName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [currentUser, setCurrentUser] = useState<{
    schoolName?: string;
    schoolCycle?: string;
    shift?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Lista y previsualización
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [activePreviewStudent, setActivePreviewStudent] = useState<StudentItem | null>(null);

  // Búsqueda y modales para Directorio
  const [searchQuery, setSearchQuery] = useState('');
  const [modalStudent, setModalStudent] = useState<{ name: string; qrCode: string } | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

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
              group: st.group || '',
              shift: st.shift || '',
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
              setEnrollmentNumber(`#EQR-${formatted.length + 1050}`);
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
        toast.success(`¡${saved.name} guardado con éxito!`);
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

  /**
   * Genera el nombre del archivo en minúsculas, separado por guiones y finalizado en "-qr.png"
   * Ejemplo exacto: "Diego Camacho Noriega" -> "diego-camacho-noriega-qr.png"
   */
  const getQrFileName = (name: string): string => {
    const formatted = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina acentos/tildes
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Reemplaza espacios y caracteres especiales por guiones
      .replace(/^-+|-+$/g, ''); // Limpia guiones al inicio o fin
    return `${formatted || 'alumno'}-qr.png`;
  };

  /**
   * Fuerza la descarga directa del código QR con nombre dinámico mediante Fetch Blob o Canvas,
   * generando un enlace sintético <a> en memoria para evitar que el navegador abra la imagen en otra pestaña.
   */
  const handleDownloadQr = async (student: { name: string; qrCode: string }) => {
    if (!student || !student.qrCode) {
      toast.error('No hay código QR disponible para descargar');
      return;
    }

    const fileName = getQrFileName(student.name);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      student.qrCode
    )}&color=0f172a&bgcolor=ffffff`;

    try {
      // 1. Intento primario con Fetch Blob para forzar descarga directa
      const res = await fetch(qrUrl);
      if (!res.ok) throw new Error('Error de red al consultar el generador QR');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success(`Descarga iniciada: ${fileName}`);
    } catch {
      // 2. Respaldo secundario mediante Canvas para extraer imagen y forzar descarga
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 500;
          canvas.height = img.naturalHeight || 500;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');

            const fallbackLink = document.createElement('a');
            fallbackLink.href = dataUrl;
            fallbackLink.download = fileName;
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            document.body.removeChild(fallbackLink);
            toast.success(`Descarga iniciada: ${fileName}`);
          }
        };
        img.onerror = () => {
          toast.error('No se pudo procesar la imagen del código QR');
        };
        img.src = qrUrl;
      } catch {
        toast.error('No se pudo forzar la descarga del código QR');
      }
    }
  };

  /**
   * Dispara la impresión nativa aislando exclusivamente el código QR,
   * el nombre del estudiante y su matrícula gracias a las utilidades de impresión de Tailwind.
   */
  const handlePrint = (studentToPrint = activePreviewStudent) => {
    if (!studentToPrint) {
      toast.error('No hay ningún alumno seleccionado para imprimir');
      return;
    }
    if (activePreviewStudent?._id !== studentToPrint._id) {
      setActivePreviewStudent(studentToPrint);
    }
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 80);
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
    if (!confirm(`¿Estás seguro de eliminar el registro de ${name}?`)) return;
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
        toast.success(`Registro de ${name} eliminado con éxito`);
      } else {
        toast.error('No se pudo eliminar el alumno');
      }
    } catch {
      toast.error('Error de conexión al eliminar');
    }
  };

  const handleSaveStudentEdit = async (
    id: string,
    updatedData: {
      name: string;
      enrollmentNumber: string;
      tutor: string;
      tutorPhone: string;
      group?: string;
      shift?: string;
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

      const cleanEnrollment = updatedData.enrollmentNumber.startsWith('#')
        ? updatedData.enrollmentNumber
        : `#${updatedData.enrollmentNumber}`;

      setStudents((prev) =>
        prev.map((s) =>
          s._id === id
            ? {
                ...s,
                name: updatedData.name,
                enrollmentNumber: cleanEnrollment,
                tutor: updatedData.tutor,
                tutorPhone: updatedData.tutorPhone,
                group: updatedData.group,
                shift: updatedData.shift,
              }
            : s
        )
      );

      if (activePreviewStudent?._id === id) {
        setActivePreviewStudent((prev) =>
          prev
            ? {
                ...prev,
                name: updatedData.name,
                enrollmentNumber: cleanEnrollment,
                tutor: updatedData.tutor,
                tutorPhone: updatedData.tutorPhone,
              }
            : null
        );
      }

      toast.success('Expediente del alumno actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al comunicar con el servidor');
      throw err;
    }
  };

  // Filtrado de alumnos para el directorio
  const filteredStudents = students.filter((s) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      s.name.toLowerCase().includes(term) ||
      s.enrollmentNumber.toLowerCase().includes(term) ||
      (s.tutor && s.tutor.toLowerCase().includes(term))
    );
  });

  const getInitials = (name: string) => {
    if (!name) return 'AL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  /* ===================================================================================
   * RENDER TAB 1: ALTA RÁPIDA (Formulario + Previsualización de Credencial QR)
   * =================================================================================== */
  const renderAltaRapida = () => (
    <div
      role="tabpanel"
      id="panel-quick-register"
      aria-labelledby="tab-quick-register"
      tabIndex={0}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch focus:outline-none"
    >
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

        <div className="flex items-center gap-3 mt-8 pt-4 border-t border-slate-100">
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
          <div ref={badgeRef} className="flex flex-col items-center text-center my-auto py-2">
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
            onClick={() => activePreviewStudent && handleDownloadQr(activePreviewStudent)}
            disabled={!activePreviewStudent}
            leftIcon={<Download size={16} />}
            className="flex-1 bg-[#009ee3] hover:bg-[#0284c7] py-3.5 px-6 shadow-lg shadow-sky-500/25 text-sm"
          >
            Descargar QR
          </Button>

          <Button
            variant="secondary"
            onClick={() => handlePrint(activePreviewStudent)}
            disabled={!activePreviewStudent}
            leftIcon={<Printer size={16} />}
            className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 py-3.5 px-6 text-sm shadow-xs shrink-0"
          >
            Imprimir Código
          </Button>
        </div>
      </div>
    </div>
  );

  /* ===================================================================================
   * RENDER TAB 2: DIRECTORIO ESCOLAR (Tabla a ancho completo + Barra de búsqueda)
   * =================================================================================== */
  const renderDirectorioEscolar = () => (
    <div
      role="tabpanel"
      id="panel-directory"
      aria-labelledby="tab-directory"
      tabIndex={0}
      className="space-y-4 focus:outline-none"
    >
      {/* Barra superior de Búsqueda y Estadísticas rápidas */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Buscar por nombre o matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} className="text-slate-400" />}
            className="bg-[#f8fafc] border-slate-200/80 text-sm font-semibold placeholder-slate-400 focus:bg-white pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="text-slate-400">Total listados:</span>
          <Badge status="neutral" className="bg-slate-100 text-slate-700 font-extrabold px-3 py-1">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'alumno' : 'alumnos'}
          </Badge>
        </div>
      </div>

      {/* Tabla a ancho completo de Alumnos */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-6">
                  Estudiante
                </th>
                <th scope="col" className="py-3.5 px-6">
                  Matrícula
                </th>
                <th scope="col" className="py-3.5 px-6">
                  Tutor y Contacto
                </th>
                <th scope="col" className="py-3.5 px-6 text-center">
                  Código QR
                </th>
                <th scope="col" className="py-3.5 px-6 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {fetching && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Loader2 size={24} className="animate-spin text-sky-500" />
                      <span className="text-xs font-bold">Cargando directorio escolar...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!fetching && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Users size={36} className="text-slate-300 mb-1" />
                      <p className="text-sm font-bold text-slate-700">
                        {students.length === 0
                          ? 'No hay alumnos registrados en la base de datos'
                          : 'No se encontraron resultados para tu búsqueda'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {students.length === 0
                          ? 'Usa la pestaña "Alta Rápida" para dar de alta al primer estudiante.'
                          : 'Prueba verificando la ortografía o buscando con otro término de búsqueda.'}
                      </p>
                      {students.length === 0 && (
                        <Button
                          size="sm"
                          onClick={() => setActiveTab('quick-register')}
                          leftIcon={<UserPlus size={14} />}
                          className="mt-3 bg-sky-500 hover:bg-sky-600 text-white font-bold"
                        >
                          Ir a Alta Rápida
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!fetching &&
                filteredStudents.map((student, idx) => {
                  const avatarStyle = [
                    { bg: 'bg-[#bbf7d0]', text: 'text-[#15803d]' },
                    { bg: 'bg-[#fef08a]', text: 'text-[#a16207]' },
                    { bg: 'bg-[#fecdd3]', text: 'text-[#e11d48]' },
                    { bg: 'bg-[#bae6fd]', text: 'text-[#0284c7]' },
                    { bg: 'bg-[#e9d5ff]', text: 'text-[#7e22ce]' },
                  ][idx % 5];

                  const cleanCode = student.enrollmentNumber.replace('#', '');

                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50/80 transition-colors duration-150 group"
                    >
                      {/* Estudiante con Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                              {student.name}
                            </div>
                            <div className="text-xs font-semibold text-slate-400">
                              Registro: {student.timeLabel || 'Reciente'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Matrícula */}
                      <td className="py-4 px-6">
                        <Badge
                          status="neutral"
                          className="font-black text-xs bg-slate-100 text-slate-700 px-2.5 py-1"
                        >
                          {student.enrollmentNumber}
                        </Badge>
                      </td>

                      {/* Tutor y Contacto */}
                      <td className="py-4 px-6">
                        {student.tutor ? (
                          <div>
                            <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                              {student.tutor}
                            </div>
                            {student.tutorPhone && (
                              <div className="text-xs font-medium text-slate-400 mt-0.5">
                                Tel: {student.tutorPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">Sin tutor registrado</span>
                        )}
                      </td>

                      {/* Botón QR preview */}
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => setModalStudent({ name: student.name, qrCode: student.qrCode })}
                          className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-sky-200/80 transition-all cursor-pointer shadow-2xs"
                          title="Ver QR en grande"
                        >
                          <QrCode size={13} className="text-sky-600" />
                          <span>QR-{cleanCode}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Descargar QR */}
                          <Button
                            variant="icon"
                            onClick={() => handleDownloadQr(student)}
                            className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-sky-600 hover:bg-sky-50 shadow-2xs"
                            title="Descargar QR PNG"
                          >
                            <Download size={14} />
                          </Button>

                          {/* Editar Alumno */}
                          <Button
                            variant="icon"
                            onClick={() => setEditingStudent(student)}
                            className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-amber-600 hover:bg-amber-50 shadow-2xs"
                            title="Editar expediente"
                          >
                            <Edit2 size={14} />
                          </Button>

                          {/* Eliminar Alumno */}
                          <Button
                            variant="icon"
                            onClick={() => handleDeleteStudent(student._id, student.name)}
                            className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-2xs"
                            title="Eliminar expediente"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 space-y-6 print:hidden">
        {/* HEADER PRINCIPAL CON ACCIÓN GLOBAL (CSV) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Registrar Alumnos
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Gestión de matrícula escolar y emisión de credenciales con código QR
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportAll}
              leftIcon={<Download size={16} className="text-slate-500" />}
              className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 text-xs sm:text-sm shadow-xs"
            >
              <span>Descargar Lote Completo (CSV)</span>
            </Button>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS (TABS WAI-ARIA CON TAILWIND) */}
        <div className="border-b border-slate-200/90">
          <div
            role="tablist"
            aria-label="Gestión de Alumnos"
            className="flex items-center gap-2 -mb-px"
          >
            {/* Pestaña 1: Alta Rápida */}
            <button
              role="tab"
              id="tab-quick-register"
              aria-controls="panel-quick-register"
              aria-selected={activeTab === 'quick-register'}
              tabIndex={activeTab === 'quick-register' ? 0 : -1}
              onClick={() => setActiveTab('quick-register')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-extrabold transition-all duration-150 cursor-pointer border-b-2 rounded-t-xl ${
                activeTab === 'quick-register'
                  ? 'border-sky-500 text-sky-600 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              <UserPlus
                size={17}
                className={activeTab === 'quick-register' ? 'text-sky-500' : 'text-slate-400'}
              />
              <span>Alta Rápida</span>
            </button>

            {/* Pestaña 2: Directorio Escolar */}
            <button
              role="tab"
              id="tab-directory"
              aria-controls="panel-directory"
              aria-selected={activeTab === 'directory'}
              tabIndex={activeTab === 'directory' ? 0 : -1}
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-extrabold transition-all duration-150 cursor-pointer border-b-2 rounded-t-xl ${
                activeTab === 'directory'
                  ? 'border-sky-500 text-sky-600 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              <Users
                size={17}
                className={activeTab === 'directory' ? 'text-sky-500' : 'text-slate-400'}
              />
              <span>Directorio Escolar</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  activeTab === 'directory'
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {students.length}
              </span>
            </button>
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        {activeTab === 'quick-register' ? renderAltaRapida() : renderDirectorioEscolar()}
      </main>

      {/* =======================================================================
          ÁREA EXCLUSIVA PARA IMPRESIÓN (Aislamiento total con Tailwind CSS)
          En papel SOLO aparece: Código QR, Nombre del estudiante y Matrícula.
          Todo el resto del dashboard, navegación y botones quedan 100% ocultos.
          ======================================================================= */}
      {activePreviewStudent && (
        <div
          id="isolated-qr-print"
          className="hidden print:flex print:fixed print:inset-0 print:bg-white print:z-[99999] flex-col items-center justify-center p-8 text-center"
        >
          <div className="border-2 border-slate-900 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center justify-center bg-white shadow-none">
            {/* 1. Nombre del estudiante */}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {activePreviewStudent.name}
            </h1>

            {/* 2. Matrícula escolar */}
            <p className="text-sm font-black text-sky-600 mt-1.5 tracking-wider">
              Matrícula: {activePreviewStudent.enrollmentNumber}
            </p>

            {/* 3. Código QR */}
            <div className="my-6 p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  activePreviewStudent.qrCode
                )}&color=0f172a&bgcolor=ffffff`}
                alt={`Código QR de ${activePreviewStudent.name}`}
                className="w-56 h-56 object-contain"
              />
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              EducaQR • Identificación Escolar
            </p>
          </div>
        </div>
      )}

      {/* Modal para ver QR en grande */}
      {modalStudent && (
        <StudentQrModal
          student={modalStudent}
          onClose={() => setModalStudent(null)}
        />
      )}

      {/* Modal para editar alumno */}
      <EditStudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onSubmit={handleSaveStudentEdit}
      />
    </>
  );
}
