'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import { 
  Calendar, BookOpen, Users, LogOut, Award, Settings, Bell, HelpCircle, Search, Menu, X, ShieldAlert, School, GraduationCap
} from 'lucide-react';
import { LayoutContext } from './layout-context';
import { API_BASE_URL } from '@/config/api';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Layout States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // WebSocket and Sync Logs
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };


  // Auth verification & Socket Initialization
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');

    if (!savedToken || !savedUserStr) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(savedUserStr);
    setUser(parsedUser);
    setToken(savedToken);
    
    // Set default active tab based on role and current route
    if (parsedUser.role === 'SUPER_ADMIN') {
      setActiveTab('teachers');
      if (pathname === '/dashboard') {
        router.push('/admin');
      }
    } else {
      setActiveTab('attendance');
      if (pathname === '/admin') {
        router.push('/dashboard');
      }
    }

    setLoading(false);

    // Initialize WebSockets and load initial cache for teachers
    if (parsedUser.role === 'TEACHER') {


      let socketConnection: Socket | null = null;

      const connectSocket = () => {
        if (!socketConnection) {
          const conn = io(API_BASE_URL);
          socketConnection = conn;
          setSocket(conn);

          conn.on('connect', () => {
            conn.emit('join_room', { teacherId: parsedUser.teacherId });
            addLog('Conectado al servidor de sincronización en tiempo real.');
          });
        }
      };

      const disconnectSocket = () => {
        if (socketConnection) {
          socketConnection.disconnect();
          socketConnection = null;
          setSocket(null);
          addLog('Desconectado del servidor de sincronización.');
        }
      };

      // Connect initially
      connectSocket();

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          connectSocket();
        } else {
          disconnectSocket();
        }
      };

      const handlePageShow = (e: PageTransitionEvent) => {
        connectSocket();
      };

      const handlePageHide = () => {
        disconnectSocket();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', handlePageShow);
      window.addEventListener('pagehide', handlePageHide);

      return () => {
        disconnectSocket();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pageshow', handlePageShow);
        window.removeEventListener('pagehide', handlePageHide);
      };
    }
  }, [router, pathname]);



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket) {
      socket.disconnect();
    }
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-outfit)'
      }}>
        Cargando portal...
      </div>
    );
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  
  // Initials generator for topbar avatar
  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <LayoutContext.Provider value={{
      user,
      token,
      logout: handleLogout,
      searchQuery,
      setSearchQuery,
      activeTab,
      setActiveTab,
      socket,
      unreadNotifications,
      setUnreadNotifications,
      syncLogs,
      addLog,
    }}>
      <div className="app-layout">
        
        {/* Mobile Sidebar Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ================= SIDEBAR ================= */}
        <aside className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <button 
              className="mobile-close-btn"
              onClick={() => setIsMobileSidebarOpen(false)}
              style={{ display: 'none' }}
              title="Cerrar menú"
            >
              <X size={20} />
            </button>
            
            {isSuperAdmin ? (
              <>
                <div className="brand-icon-container">
                  <GraduationCap size={24} />
                </div>
                <div className="brand-text">
                  <span className="brand-title">EduControl Pro</span>
                  <span className="brand-subtitle">Academic Management</span>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: '#e8edf2', border: '1.5px solid #cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden'
                }}>
                  <Image src="/logo-circle.png" alt="EducaQR icon" width={42} height={42}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }} priority
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.1 }}>
                    <span style={{ color: '#1e3a5f' }}>Educa</span><span style={{ color: '#0ea5e9' }}>QR</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginTop: '1px' }}>Academic Management</div>
                </div>
              </>
            )}
          </div>

          <nav className="sidebar-nav">
            {isSuperAdmin ? (
              <>
                <div 
                  className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('teachers'); setIsMobileSidebarOpen(false); }}
                >
                  <Users size={20} />
                  <span>Teachers</span>
                </div>

                <div className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <Calendar size={20} />
                  <span>Attendance</span>
                </div>

                <div className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <BookOpen size={20} />
                  <span>Subjects</span>
                </div>

                <div className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <Users size={20} />
                  <span>Students</span>
                </div>
              </>
            ) : (
              <>
                <div 
                  className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('attendance'); setIsMobileSidebarOpen(false); }}
                >
                  <Calendar size={20} />
                  <span>Attendance</span>
                </div>

                <div 
                  className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('subjects'); setIsMobileSidebarOpen(false); }}
                >
                  <BookOpen size={20} />
                  <span>Subjects</span>
                </div>

                <div 
                  className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('students'); setIsMobileSidebarOpen(false); }}
                >
                  <Users size={20} />
                  <span>Students</span>
                </div>
              </>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            {isSuperAdmin ? (
              <div style={{ padding: '0 24px', fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div>Modo Administrador</div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(2, 132, 199, 0.06)', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s', userSelect: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.11)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.06)'; }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontWeight: 700, fontSize: '0.82rem' }}>
                    {getInitials(user?.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name || 'Maestra'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <School size={10} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.schoolName || 'Mi Escuela'}
                      </span>
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748b' }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                    background: 'white', borderRadius: '10px', border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => { setShowUserMenu(false); setActiveTab('settings'); setIsMobileSidebarOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    >
                      <Settings size={14} />
                      Configuración
                    </button>
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px', border: '1px solid #fecaca', borderRadius: '10px', background: '#fff5f5', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                >
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ================= MAIN WRAPPER ================= */}
        <div className="main-wrapper">
          
          {/* Mobile Topbar */}
          <header className="mobile-topbar" style={{ display: 'none' }}>
            <button 
              onClick={() => setIsMobileSidebarOpen(true)} 
              className="mobile-hamburger-btn"
              title="Abrir menú"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSuperAdmin ? (
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0369a1' }}>EduControl</span>
              ) : (
                <>
                  <Image src="/logo-circle.png" alt="EducaQR" width={32} height={32} style={{ objectFit: 'contain' }} />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e3a5f' }}>Educa<span style={{ color: '#0ea5e9' }}>QR</span></span>
                </>
              )}
            </div>
            <div 
              onClick={() => { if (!isSuperAdmin) { setActiveTab('settings'); } else { handleLogout(); } }}
              style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: isSuperAdmin ? '#fef2f2' : 'linear-gradient(135deg, #0284c7, #0ea5e9)', 
                border: isSuperAdmin ? '1px solid #fee2e2' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: isSuperAdmin ? 'var(--error)' : 'white', 
                fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' 
              }}
            >
              {isSuperAdmin ? 'AD' : getInitials(user?.name)}
            </div>
          </header>

          {/* Desktop Topbar */}
          <header className="topbar">
            <div className="topbar-logo">
              {isSuperAdmin ? 'EduControl' : 'EducaQR'}
            </div>
            
            <div className="topbar-search">
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder={isSuperAdmin ? "Buscar profesoras, correos..." : "Buscar alumnos..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="topbar-actions">
              <button className="topbar-icon-btn" onClick={() => alert(isSuperAdmin ? 'Sesión de administración global.' : 'Logs y Notificaciones en tiempo real.')} style={{ position: 'relative' }}>
                <Bell size={20} />
                {!isSuperAdmin && unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--error)',
                    borderRadius: '50%'
                  }} />
                )}
              </button>
              <button className="topbar-icon-btn">
                <HelpCircle size={20} />
              </button>
              <div className="topbar-divider"></div>
              
              <div 
                className="avatar-badge" 
                title="Cerrar sesión"
                onClick={handleLogout}
                style={isSuperAdmin ? { background: '#fef2f2', borderColor: '#fee2e2', color: 'var(--error)' } : undefined}
              >
                {isSuperAdmin ? 'AD' : getInitials(user?.name)}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="content-body">
            {children}
          </div>
        </div>

      </div>
    </LayoutContext.Provider>
  );
}
