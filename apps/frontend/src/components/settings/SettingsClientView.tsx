'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Shield,
  Volume2,
  VolumeX,
  Scan,
  CheckCircle2,
  LogOut,
  KeyRound,
  ArrowLeft,
  Building,
  Save,
  Sparkles,
  Wifi,
  Server,
  Sliders,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import ConfirmLogoutModal from '@/components/ConfirmLogoutModal';
import { API_BASE_URL } from '@/config/api';

export function SettingsClientView() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  // Logout Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Preference Toggles (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Editable User Profile fields
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCycle, setSchoolCycle] = useState('2025-2026');
  const [shift, setShift] = useState('Matutino');
  const [entryTime, setEntryTime] = useState('07:30');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');

    if (savedToken) setToken(savedToken);
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        setCurrentUser(u);
        setTeacherName(u.name || '');
        setSchoolName(u.schoolName || 'Escuela Primaria EducaQR');
        setSchoolCycle(u.schoolCycle || '2025-2026');
        setShift(u.shift || 'Matutino');
        setEntryTime(u.entryTime || '07:30');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (savedToken) {
      fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile) {
            setCurrentUser(profile);
            setTeacherName(profile.name || '');
            setSchoolName(profile.schoolName || 'Escuela Primaria EducaQR');
            setSchoolCycle(profile.schoolCycle || '2025-2026');
            setShift(profile.shift || 'Matutino');
            setEntryTime(profile.entryTime || '07:30');
            localStorage.setItem('user', JSON.stringify(profile));
          }
        })
        .catch(() => {});
    }

    // Load scanner sound preferences
    const soundPref = localStorage.getItem('educaqr_sound_enabled');
    if (soundPref !== null) setSoundEnabled(soundPref === 'true');

    const autoConfPref = localStorage.getItem('educaqr_auto_confirm');
    if (autoConfPref !== null) setAutoConfirm(autoConfPref === 'true');

    const autoExpPref = localStorage.getItem('educaqr_auto_export');
    if (autoExpPref !== null) setAutoExport(autoExpPref === 'true');
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    localStorage.setItem('educaqr_sound_enabled', String(soundEnabled));
    localStorage.setItem('educaqr_auto_confirm', String(autoConfirm));
    localStorage.setItem('educaqr_auto_export', String(autoExport));

    try {
      const activeToken = token || localStorage.getItem('token');
      if (activeToken) {
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            name: teacherName.trim(),
            schoolName: schoolName.trim(),
            schoolCycle: schoolCycle.trim(),
            shift: shift.trim(),
            entryTime: entryTime.trim(),
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setCurrentUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          toast.success('¡Perfil institucional actualizado en la base de datos!');
          setSavingPrefs(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error al guardar perfil en MongoDB:', err);
    }

    // Fallback local en caso de desconexión
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        name: teacherName,
        schoolName: schoolName,
        schoolCycle: schoolCycle,
        shift: shift,
        entryTime: entryTime,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }

    toast.success('¡Preferencias guardadas correctamente!');
    setSavingPrefs(false);
  };

  const handleChangePasswordSubmit = async (passwords: {
    current: string;
    newPass: string;
    confirmPass: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: passwords.current,
          newPassword: passwords.newPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleConfirmLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const displayName = currentUser?.name || currentUser?.email || 'Docente Titular';
  const roleLabel = currentUser?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Docente Titular';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ========================================================
            HEADER Y BREADCRUMB
           ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-3 bg-slate-100 hover:bg-slate-200/80 rounded-2xl text-slate-600 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="info" className="text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                  Ajustes de Cuenta
                </Badge>
                <span className="text-xs text-slate-400 font-semibold">• EducaQR</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Configuración del Sistema
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-sky-500/20 hover:from-sky-600 hover:to-blue-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              {savingPrefs ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ========================================================
            CONTENIDO PRINCIPAL (GRID 2 COLUMNAS)
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA: RESUMEN DE PERFIL */}
          <div className="space-y-6">
            <Card className="p-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              {/* Soft Gradient Top Decorative Banner */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 opacity-90" />

              {/* Avatar Circle */}
              <div className="relative z-10 mt-6 mb-4">
                <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-inner">
                    {getInitials(displayName)}
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 ring-4 ring-white flex items-center justify-center text-white shadow-xs">
                  <Check size={11} strokeWidth={3} />
                </span>
              </div>

              {/* User Identity Details */}
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {displayName}
              </h2>
              <p className="text-xs font-bold text-slate-600 mb-3 truncate max-w-full px-2">
                {currentUser?.email || 'docente@educaqr.com'}
              </p>

              <Badge variant="success" className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-6">
                {roleLabel}
              </Badge>

              <div className="w-full pt-5 border-t border-slate-100 space-y-3 text-left">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                  <Building size={16} className="text-sky-500 shrink-0" />
                  <span className="truncate">{schoolName}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                  <Sparkles size={16} className="text-amber-500 shrink-0" />
                  <span>Ciclo escolar: {schoolCycle} • Turno {shift}</span>
                </div>
              </div>

              {/* Logout Button inside Profile Card */}
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full mt-6 py-3 px-4 bg-rose-50 hover:bg-rose-100/80 text-rose-600 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </Card>

            {/* SYNC & SERVER STATUS CARD */}
            <Card className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-slate-800">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Estado del Sistema</h3>
                  <p className="text-[11px] text-slate-600 font-semibold">Sincronización en la Nube</p>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <Wifi size={14} className="animate-pulse" />
                  <span>Conectado en Tiempo Real</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="text-[11px] text-slate-600 font-medium space-y-1">
                <p>• Versión: <span className="font-bold text-slate-700">EducaQR Suite v2.4.0</span></p>
                <p>• Motor QR: <span className="font-bold text-slate-700">High-Precision ZXing</span></p>
              </div>
            </Card>
          </div>

          {/* COLUMNA DERECHA: SECCIONES DE CONFIGURACIÓN */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. INFORMACIÓN PERSONAL Y DOCENTE */}
            <Card className="p-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-xs">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    Información del Docente
                  </h3>
                  <p className="text-xs font-semibold text-slate-600">
                    Datos personales y de la institución escolar
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Nombre Completo
                  </label>
                  <Input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Ej. Kenia Gabriela Noriega"
                    className="rounded-2xl border-slate-200 font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <Input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="rounded-2xl bg-slate-50 text-slate-600 border-slate-200 font-semibold text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Institución Educativa
                  </label>
                  <Input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ej. Colegio San Patricio"
                    className="rounded-2xl border-slate-200 font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Ciclo Escolar Activo
                  </label>
                  <Input
                    type="text"
                    value={schoolCycle}
                    onChange={(e) => setSchoolCycle(e.target.value)}
                    placeholder="Ej. 2025-2026"
                    className="rounded-2xl border-slate-200 font-semibold text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Turno Institucional
                    </label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full h-11 px-4 rounded-2xl border border-slate-200 font-semibold text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Matutino">Turno Matutino</option>
                      <option value="Vespertino">Turno Vespertino</option>
                      <option value="Nocturno">Turno Nocturno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Hora Límite de Entrada
                    </label>
                    <Input
                      type="time"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="rounded-2xl border-slate-200 font-semibold text-sm"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. SEGURIDAD Y CAMBIO DE CONTRASEÑA */}
            <Card className="p-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    Seguridad y Contraseña
                  </h3>
                  <p className="text-xs font-semibold text-slate-600">
                    Mantén protegida tu cuenta con una clave segura
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Contraseña de Acceso</h4>
                    <p className="text-xs text-slate-600 font-semibold">••••••••••••</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="rounded-xl px-4 py-2.5 font-bold text-xs bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Lock size={14} />
                  <span>Cambiar Contraseña</span>
                </Button>
              </div>
            </Card>

            {/* 3. PREFERENCIAS DEL ESCÁNER Y NOTIFICACIONES */}
            <Card className="p-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    Preferencias del Escáner QR
                  </h3>
                  <p className="text-xs font-semibold text-slate-600">
                    Personaliza las lecturas de gafetes y asistencias
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* TOGGLE 1: SONIDO AL ESCANEAR */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${soundEnabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Sonido de Confirmación (Beep)</h4>
                      <p className="text-xs text-slate-600 font-semibold">Emitir un tono auditivo al detectar correctamente un código QR</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* TOGGLE 2: AUTO CONFIRMAR ASISTENCIA */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${autoConfirm ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'}`}>
                      <Scan size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Pase de Lista Automático</h4>
                      <p className="text-xs text-slate-600 font-semibold">Registrar la presencia inmediatamente sin requerir clic adicional</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoConfirm(!autoConfirm)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${autoConfirm ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${autoConfirm ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* TOGGLE 3: AUTO EXPORTAR REPORTES */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${autoExport ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Auto-Generar Reporte Diario</h4>
                      <p className="text-xs text-slate-600 font-semibold">Generar una copia en PDF del pase de lista al concluir la jornada</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoExport(!autoExport)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${autoExport ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${autoExport ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAL CAMBIAR CONTRASEÑA */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        teacherName={displayName}
        teacherRole={roleLabel}
        teacherGrade={schoolName}
        onSubmit={handleChangePasswordSubmit}
      />

      {/* MODAL CONFIRMAR LOGOUT */}
      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        userName={displayName}
      />
    </div>
  );
}

export default SettingsClientView;
