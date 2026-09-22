'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  Settings,
} from 'lucide-react';
import ConfirmLogoutModal from '@/components/ConfirmLogoutModal';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: any;
  badge?: any;
  isSpecial?: boolean;
  tooltip: string;
  path: string;
}

export interface EducaNavbarProps {
  activeTab?: 'dashboard' | 'scanner' | 'attendance' | 'students' | 'subjects' | 'reports' | 'admin' | string;
  onNavigate?: (id: string) => void;
  currentGroup?: string;
  teacherName?: string;
  alertCount?: number;
  notificationCount?: number;
}

/**
 * EducaQR - Navbar de Navegación Principal
 * Estilo: Playful Utility (Pastel, rounded-full/rounded-2xl, cero bordes grises duros)
 */
export const EducaNavbar: React.FC<EducaNavbarProps> = ({
  activeTab = 'dashboard',
  onNavigate,
  currentGroup = '3° B - Primaria',
  teacherName = 'Docente Titular',
  alertCount = 3,
  notificationCount = 9,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab automatically from route if not explicitly overridden
  const initialActive = (() => {
    if (activeTab && activeTab !== 'dashboard') return activeTab;
    if (pathname?.includes('/scanner')) return 'scanner';
    if (pathname?.includes('/attendance')) return 'attendance';
    if (pathname?.includes('/students')) return 'students';
    if (pathname?.includes('/subjects')) return 'subjects';
    if (pathname?.includes('/admin')) return 'admin';
    if (pathname?.includes('/settings')) return 'settings';
    return 'dashboard';
  })();

  const [active, setActive] = useState<string>(initialActive);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error reading user', e);
      }
    }
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Definición de las rutas según el rol
  const navigationItems: NavigationItem[] = isSuperAdmin
    ? [
        {
          id: 'admin',
          label: 'Super Admin',
          tooltip: 'Panel de administración escolar y gestión de maestros',
          path: '/admin',
        },
      ]
    : [
        {
          id: 'dashboard',
          label: 'Dashboard',
          tooltip: 'Resumen del día, alertas y accesos rápidos',
          path: '/dashboard',
        },
        {
          id: 'scanner',
          label: 'Escáner QR',
          isSpecial: true, // "Joya de la corona"
          tooltip: 'Pase de lista y calificación continua',
          path: '/scanner',
        },
        {
          id: 'attendance',
          label: 'Historial Asistencia',
          tooltip: 'Historial diario y reportes mensuales con exportación a Excel',
          path: '/attendance',
        },
        {
          id: 'students',
          label: 'Registrar Alumnos',
          tooltip: 'Registro, credenciales y gafetes QR',
          path: '/students',
        },
        {
          id: 'subjects',
          label: 'Materias y Tareas',
          tooltip: 'Carpetas de colores, asignaciones y puntajes',
          path: '/subjects',
        },
      ];

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const displayName = currentUser?.name || currentUser?.email || teacherName;

  return (
    <>
      <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 px-6 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.03)] select-none print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* ========================================================
              1. MARCA CON SÍMBOLOS LÚDICOS (+, -, ×, ÷) Y NOMBRE
             ======================================================== */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={isSuperAdmin ? '/admin' : '/dashboard'}
              className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl hover:bg-slate-100/80 transition-colors"
            >
              {/* Isotipos matemáticos lúdicos característicos */}
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-rose-400 text-white font-black text-xs flex items-center justify-center shadow-sm shadow-rose-200">
                  +
                </span>
                <span className="w-5 h-5 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-sm shadow-amber-200">
                  −
                </span>
                <span className="w-5 h-5 rounded-full bg-emerald-400 text-white font-black text-xs flex items-center justify-center shadow-sm shadow-emerald-200">
                  ×
                </span>
                <span className="w-5 h-5 rounded-full bg-sky-400 text-white font-black text-xs flex items-center justify-center shadow-sm shadow-sky-200">
                  ÷
                </span>
              </div>

              {/* Logotipo tipográfico */}
              <div className="flex items-baseline ml-1">
                <span className="text-xl font-black text-slate-800 tracking-tight font-display">
                  Educa<span className="text-sky-500">QR</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
              </div>
            </Link>
          </div>
          <nav className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-full overflow-x-auto">
            {navigationItems.map((item) => {
              const isActive = active === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => {
                    setActive(item.id);
                    if (onNavigate) onNavigate(item.id);
                  }}
                  title={item.tooltip}
                  prefetch={true}
                  className={`group relative flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 shrink-0 ${
                    isActive
                      ? item.isSpecial
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                        : 'bg-white text-slate-800 shadow-sm shadow-slate-200/80 scale-[1.01]'
                      : item.isSpecial
                      ? 'text-sky-600 hover:bg-sky-100/60'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{item.label}</span>

                  {/* Destacado sutil en caso de ser la herramienta protagonista */}
                  {item.isSpecial && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse ml-1.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ========================================================
              3. ACCIONES LATERALES: PERFIL CON INICIALES Y MENÚ
             ======================================================== */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Avatar del Maestro / Perfil con Iniciales y Dropdown */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="relative rounded-full p-0.5 ring-2 ring-sky-200 hover:ring-sky-400 transition-all focus:outline-none cursor-pointer"
                title={`Perfil: ${displayName}`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs select-none">
                  {getInitials(displayName)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1.5 border-b border-slate-100 mb-2">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{displayName}</p>
                      <p className="text-[10px] font-semibold text-slate-600 truncate">
                        {currentUser?.role || 'Docente'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      {!isSuperAdmin && (
                        <Link
                          href="/settings"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onNavigate) onNavigate('settings');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-sky-600 rounded-xl transition-colors"
                        >
                          <Settings size={14} className="text-slate-500" />
                          <span>Configuración</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal de confirmación de cierre de sesión */}
      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        userName={displayName}
      />
    </>
  );
};

export default EducaNavbar;

