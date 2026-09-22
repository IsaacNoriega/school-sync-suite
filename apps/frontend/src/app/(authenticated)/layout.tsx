'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { LayoutContext } from './layout-context';
import { API_BASE_URL } from '@/config/api';
import { isTokenExpired, clearAuthSession, handleAuthError } from '@/lib/auth';
import { connectSocket, disconnectSocket } from '@/lib/socket';

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

    if (!savedToken || !savedUserStr || isTokenExpired(savedToken)) {
      handleAuthError(router);
      return;
    }

    let parsedUser: any = null;
    try {
      parsedUser = JSON.parse(savedUserStr);
      setUser(parsedUser);
      setToken(savedToken);
      
      // Set default active tab based on role and enforce route access
      if (parsedUser.role === 'SUPER_ADMIN') {
        setActiveTab('teachers');
        if (pathname !== '/admin') {
          router.replace('/admin');
          return;
        }
      } else {
        setActiveTab('attendance');
        if (pathname === '/admin') {
          router.replace('/dashboard');
          return;
        }
      }

      setLoading(false);
    } catch {
      handleAuthError(router);
      return;
    }

    // Initialize WebSockets using shared singleton
    if (parsedUser.role === 'TEACHER') {
      const conn = connectSocket(parsedUser.teacherId, savedToken);
      setSocket(conn);

      const handleConnect = () => {
        addLog('Conectado al servidor de sincronización en tiempo real.');
      };

      const handleConnectError = (err: any) => {
        addLog(`Error de conexión: ${err.message}. Reintentando...`);
      };

      if (conn.connected) {
        handleConnect();
      }

      conn.on('connect', handleConnect);
      conn.on('connect_error', handleConnectError);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          connectSocket(parsedUser.teacherId, savedToken);
        }
      };

      const handlePageShow = () => {
        connectSocket(parsedUser.teacherId, savedToken);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', handlePageShow);

      return () => {
        conn.off('connect', handleConnect);
        conn.off('connect_error', handleConnectError);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pageshow', handlePageShow);
      };
    }
  }, [router]);



  // Enforce role-based route access on every navigation
  useEffect(() => {
    if (!user) return;
    if (user.role === 'SUPER_ADMIN') {
      if (pathname !== '/admin') {
        router.replace('/admin');
      }
    } else {
      if (pathname === '/admin') {
        router.replace('/dashboard');
      }
    }
  }, [pathname, user, router]);

  const handleLogout = () => {
    clearAuthSession();
    disconnectSocket();
    setSocket(null);
    router.replace('/login');
  };


  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isUnauthorized = Boolean(
    user && ((isSuperAdmin && pathname !== '/admin') || (!isSuperAdmin && pathname === '/admin'))
  );

  if (loading || !user || isUnauthorized) {
    return (
      <div className="min-h-screen bg-[#f8fafc] select-none font-sans">
        {/* Navbar skeleton */}
        <div className="w-full bg-white/95 sticky top-0 z-50 px-6 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="h-10 w-36 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-full">
              <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-8 w-20 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-8 w-28 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 space-y-5 pb-16">
          <div className="h-9 w-64 bg-slate-200 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 space-y-3">
                <div className="h-3 w-16 bg-slate-200 rounded-full animate-pulse" />
                <div className="h-10 w-20 bg-slate-200 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-200 rounded-full animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-200 rounded-full animate-pulse" />
                  <div className="h-3 w-32 bg-slate-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

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
      <div className="min-h-screen bg-[#f8fafc]">
        {children}
      </div>
    </LayoutContext.Provider>
  );
}
