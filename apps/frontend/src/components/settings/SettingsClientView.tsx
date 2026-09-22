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
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import ConfirmLogoutModal from '@/components/ConfirmLogoutModal';
import { API_BASE_URL } from '@/config/api';

export type SettingsTab = 'Perfil' | 'Seguridad' | 'Preferencias QR';

export function SettingsClientView() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');

  // Navegación por pestañas verticales
  const [activeTab, setActiveTab] = useState<SettingsTab>('Perfil');

  // Modales
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Preferencias de Escáner (con auto-guardado silencioso)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [autoExport, setAutoExport] = useState(false);

  // Campos de perfil de docente
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCycle, setSchoolCycle] = useState('2025-2026');
  const [shift, setShift] = useState('Matutino');
  const [entryTime, setEntryTime] = useState('07:30');
  const [savingProfile, setSavingProfile] = useState(false);

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

    // Cargar preferencias del escáner
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

  // Guardado explícito exclusivo del formulario de Perfil Docente
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);

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
            shift: shift.trim(),
            entryTime: entryTime.trim(),
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setCurrentUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          toast.success('¡Perfil institucional actualizado con éxito!');
          setSavingProfile(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error al guardar perfil en el servidor:', err);
    }

    // Fallback local en caso de desconexión
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        name: teacherName,
        schoolName: schoolName,
        shift: shift,
        entryTime: entryTime,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }

    toast.success('¡Información guardada localmente!');
    setSavingProfile(false);
  };

  // Handlers con auto-guardado silencioso para los interruptores (Preferencias QR)
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('educaqr_sound_enabled', String(enabled));
    toast.success(enabled ? 'Sonido de confirmación activado' : 'Sonido silenciado', {
      id: 'pref-sound',
      duration: 1500,
    });
  };

  const handleToggleAutoConfirm = (enabled: boolean) => {
    setAutoConfirm(enabled);
    localStorage.setItem('educaqr_auto_confirm', String(enabled));
    toast.success(enabled ? 'Pase de lista automático activado' : 'Confirmación manual requerida', {
      id: 'pref-confirm',
      duration: 1500,
    });
  };

  const handleToggleAutoExport = (enabled: boolean) => {
    setAutoExport(enabled);
    localStorage.setItem('educaqr_auto_export', String(enabled));
    toast.success(enabled ? 'Auto-reporte diario activado' : 'Auto-reporte desactivado', {
      id: 'pref-export',
      duration: 1500,
    });
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

  /* ===================================================================================
   * RENDER TAB 1: PERFIL DOCENTE (Formulario + Botón de guardar al final)
   * =================================================================================== */
  const renderPerfil = () => (
    <div
      role="tabpanel"
      id="panel-perfil"
      aria-labelledby="tab-perfil"
      tabIndex={0}
      className="focus:outline-none"
    >
      <Card className="p-7 sm:p-9 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-7">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-xs">
            <User size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Información del Docente
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Datos personales y de la institución escolar registrados
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nombre Completo (Editable) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Nombre Completo *
              </label>
              <Input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ej. Kenia Gabriela Noriega"
                className="rounded-2xl border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* Correo Electrónico (Solo Lectura) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solo lectura</span>
              </div>
              <Input
                type="email"
                value={currentUser?.email || ''}
                readOnly
                disabled
                className="rounded-2xl bg-slate-100 text-slate-400 border-slate-200 font-semibold text-sm cursor-not-allowed select-none"
              />
            </div>

            {/* Institución Educativa (Editable) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Institución Educativa
              </label>
              <Input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ej. Colegio San Patricio"
                className="rounded-2xl border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* Ciclo Escolar Activo (Solo Lectura) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Ciclo Escolar Activo
                </label>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solo lectura</span>
              </div>
              <Input
                type="text"
                value={schoolCycle}
                readOnly
                disabled
                className="rounded-2xl bg-slate-100 text-slate-400 border-slate-200 font-semibold text-sm cursor-not-allowed select-none"
              />
            </div>

            {/* Turno Institucional (Editable) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Turno Institucional
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 font-semibold text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="Matutino">Turno Matutino</option>
                <option value="Vespertino">Turno Vespertino</option>
                <option value="Nocturno">Turno Nocturno</option>
              </select>
            </div>

            {/* Hora Límite de Entrada (Editable) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Hora Límite de Entrada
              </label>
              <Input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="rounded-2xl border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* Botón principal de Guardar Cambios ubicado estrictamente al final del formulario */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold px-7 py-3 rounded-2xl shadow-lg shadow-sky-500/20 hover:from-sky-600 hover:to-blue-700 transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              {savingProfile ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
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
        </form>
      </Card>
    </div>
  );

  /* ===================================================================================
   * RENDER TAB 2: SEGURIDAD (Cambio de Contraseña)
   * =================================================================================== */
  const renderSeguridad = () => (
    <div
      role="tabpanel"
      id="panel-seguridad"
      aria-labelledby="tab-seguridad"
      tabIndex={0}
      className="focus:outline-none"
    >
      <Card className="p-7 sm:p-9 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Seguridad y Contraseña
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Mantén protegida tu cuenta institucional con una clave robusta
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 bg-slate-50/80 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
              <KeyRound size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Contraseña de Acceso</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                •••••••••••• (Última actualización guardada)
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPasswordModalOpen(true)}
            className="rounded-2xl px-5 py-3 font-bold text-xs bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <Lock size={15} />
            <span>Cambiar Contraseña</span>
          </Button>
        </div>

        <div className="p-5 bg-sky-50/60 border border-sky-100/80 rounded-2xl flex items-start gap-3 text-xs text-sky-800">
          <Sparkles size={16} className="text-sky-500 shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">
            Te recomendamos usar una combinación de letras mayúsculas, minúsculas, números y símbolos para mantener la seguridad del aula escolar.
          </p>
        </div>
      </Card>
    </div>
  );

  /* ===================================================================================
   * RENDER TAB 3: PREFERENCIAS QR (Toggles con auto-guardado silencioso)
   * =================================================================================== */
  const renderPreferenciasQr = () => (
    <div
      role="tabpanel"
      id="panel-qr-preferences"
      aria-labelledby="tab-qr-preferences"
      tabIndex={0}
      className="focus:outline-none"
    >
      <Card className="p-7 sm:p-9 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
            <Sliders size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Preferencias del Escáner QR
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Personaliza el comportamiento del lector óptico y pase de lista (auto-guardado activo)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* TOGGLE 1: SONIDO AL ESCANEAR */}
          <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-3.5 pr-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  soundEnabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Sonido de Confirmación (Beep)</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Emitir un tono auditivo al detectar y validar correctamente un código QR
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* TOGGLE 2: AUTO CONFIRMAR ASISTENCIA */}
          <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-3.5 pr-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  autoConfirm ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Scan size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pase de Lista Automático</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Registrar la presencia inmediatamente sin requerir clic manual de confirmación
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoConfirm}
              onClick={() => handleToggleAutoConfirm(!autoConfirm)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                autoConfirm ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  autoConfirm ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* TOGGLE 3: AUTO EXPORTAR REPORTES */}
          <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-3.5 pr-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  autoExport ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Auto-Generar Reporte Diario</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Generar una copia en PDF del concentrado de asistencia al concluir la jornada escolar
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoExport}
              onClick={() => handleToggleAutoExport(!autoExport)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                autoExport ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  autoExport ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ========================================================
            CABECERA GLOBAL (Sin botón de guardar en la cabecera)
           ======================================================== */}
        <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
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
        </div>

        {/* ========================================================
            LAYOUT PRINCIPAL: MENÚ VERTICAL (IZQUIERDA) + CONTENIDO DINÁMICO (DERECHA)
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================
              COLUMNA IZQUIERDA: MENÚ DE NAVEGACIÓN VERTICAL (25% - 30%)
             ====================================================== */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
            {/* Tarjeta del Menú Lateral */}
            <Card className="p-5 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6">
              {/* 1. CABECERA DEL MENÚ: RESUMEN COMPACTO DEL USUARIO */}
              <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                    {getInitials(displayName)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white flex items-center justify-center text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black text-slate-800 truncate tracking-tight">
                    {displayName}
                  </h2>
                  <p className="text-[11px] font-bold text-sky-600 truncate mt-0.5">
                    {roleLabel}
                  </p>
                </div>
              </div>

              {/* 2. NAVEGACIÓN VERTICAL (3 TABS) */}
              <nav
                role="tablist"
                aria-label="Pestañas de Configuración"
                aria-orientation="vertical"
                className="space-y-1.5"
              >
                {/* Tab 1: Perfil */}
                <button
                  type="button"
                  role="tab"
                  id="tab-perfil"
                  aria-controls="panel-perfil"
                  aria-selected={activeTab === 'Perfil'}
                  tabIndex={activeTab === 'Perfil' ? 0 : -1}
                  onClick={() => setActiveTab('Perfil')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'Perfil'
                      ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-500 font-extrabold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <User
                    size={18}
                    className={activeTab === 'Perfil' ? 'text-sky-600' : 'text-slate-400'}
                  />
                  <span>Perfil</span>
                </button>

                {/* Tab 2: Seguridad */}
                <button
                  type="button"
                  role="tab"
                  id="tab-seguridad"
                  aria-controls="panel-seguridad"
                  aria-selected={activeTab === 'Seguridad'}
                  tabIndex={activeTab === 'Seguridad' ? 0 : -1}
                  onClick={() => setActiveTab('Seguridad')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'Seguridad'
                      ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-500 font-extrabold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <Shield
                    size={18}
                    className={activeTab === 'Seguridad' ? 'text-sky-600' : 'text-slate-400'}
                  />
                  <span>Seguridad</span>
                </button>

                {/* Tab 3: Preferencias QR */}
                <button
                  type="button"
                  role="tab"
                  id="tab-qr-preferences"
                  aria-controls="panel-qr-preferences"
                  aria-selected={activeTab === 'Preferencias QR'}
                  tabIndex={activeTab === 'Preferencias QR' ? 0 : -1}
                  onClick={() => setActiveTab('Preferencias QR')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'Preferencias QR'
                      ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-500 font-extrabold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <Sliders
                    size={18}
                    className={activeTab === 'Preferencias QR' ? 'text-sky-600' : 'text-slate-400'}
                  />
                  <span>Preferencias QR</span>
                </button>
              </nav>

              {/* 3. PIE DEL MENÚ: BOTÓN CERRAR SESIÓN */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100/80 text-rose-600 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </Card>

            {/* INDICADOR DE ESTADO DEL SISTEMA (Pie del Menú Lateral) */}
            <Card className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Server size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Estado del Sistema</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Sincronización en la Nube</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <Wifi size={13} className="animate-pulse" />
                  <span>Conectado</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="text-[10px] text-slate-500 font-medium space-y-0.5 pt-1">
                <p>• Versión: <span className="font-bold text-slate-700">EducaQR v2.4.0</span></p>
                <p>• Motor: <span className="font-bold text-slate-700">High-Precision QR</span></p>
              </div>
            </Card>
          </aside>

          {/* ======================================================
              COLUMNA DERECHA: PANEL DE CONTENIDO DINÁMICO
             ====================================================== */}
          <main className="lg:col-span-8 xl:col-span-9">
            {activeTab === 'Perfil' && renderPerfil()}
            {activeTab === 'Seguridad' && renderSeguridad()}
            {activeTab === 'Preferencias QR' && renderPreferenciasQr()}
          </main>
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
