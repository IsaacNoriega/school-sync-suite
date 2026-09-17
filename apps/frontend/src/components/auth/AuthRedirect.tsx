'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] select-none font-sans flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded-full bg-rose-300 animate-pulse" />
          <span className="w-6 h-6 rounded-full bg-amber-300 animate-pulse" style={{ animationDelay: '0.1s' }} />
          <span className="w-6 h-6 rounded-full bg-emerald-300 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-6 h-6 rounded-full bg-sky-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
        <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}