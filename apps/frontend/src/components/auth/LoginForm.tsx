'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ShieldAlert,
  Info,
  School,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/config/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isTokenExpired, clearAuthSession } from '@/lib/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      if (isTokenExpired(token)) {
        clearAuthSession();
      } else {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'SUPER_ADMIN') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
          return;
        } catch (err) {
          console.error('Error reading stored session:', err);
          clearAuthSession();
        }
      }
    }

    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor ingresa correo y contraseña');
      return;
    }

    setError('');
    setLoading(true);
    const loadToast = toast.loading('Iniciando sesión...');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem('saved_email', email);
      } else {
        localStorage.removeItem('saved_email');
      }

      toast.success('¡Bienvenido a EducaQR!', { id: loadToast });

      if (data.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Credenciales inválidas o error de conexión';
      setError(errMsg);
      toast.error(errMsg, { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Mensaje de error si ocurre */}
      {error && (
        <div className="w-full mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
        {/* Campo: Correo Institucional */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            Correo Institucional
          </label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maestro@sanpatricio.edu"
            leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
            className="text-sm font-semibold"
          />
        </div>

        {/* Campo: Contraseña */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Contraseña
            </label>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() =>
                toast('Contacta al administrador para restablecer tu contraseña', {
                  icon: <Info className="w-5 h-5 text-sky-500" />,
                })
              }
              className="p-0 h-auto text-sky-600 hover:text-sky-700 text-xs font-bold hover:bg-transparent"
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-5 h-5 text-slate-400" />}
            rightIcon={
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-8 h-8 p-1 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-full"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            }
            className="text-sm font-semibold tracking-wider"
          />
        </div>

        {/* Checkbox Recordar Sesión */}
        <div className="flex items-center gap-2.5 pt-1">
          <Button
            variant={rememberMe ? 'primary' : 'secondary'}
            size="sm"
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-5 h-5 !p-0 rounded-md border transition-all flex items-center justify-center ${
              rememberMe
                ? 'border-sky-500 bg-sky-500 text-white'
                : 'border-slate-200 bg-slate-100 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </Button>
          <span
            onClick={() => setRememberMe(!rememberMe)}
            className="text-xs font-semibold text-slate-600 cursor-pointer select-none"
          >
            Recordar mi sesión en este equipo
          </span>
        </div>

        {/* Botón Iniciar Sesión */}
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          rightIcon={<ArrowRight className="w-5 h-5 stroke-[2.5]" />}
          className="w-full py-4 text-base font-black shadow-lg shadow-sky-400/25 mt-2"
        >
          {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>

      {/* Enlace Registro / Dirección */}
      <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-slate-500">
        <span>¿No tienes cuenta?</span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() =>
            toast('Acude con el Administrador Escolar para tu alta de usuario.', {
              icon: <School className="w-5 h-5 text-sky-500" />,
            })
          }
          className="p-0 h-auto text-sky-600 hover:text-sky-700 font-bold hover:bg-transparent"
        >
          Solicita tu acceso a Dirección.
        </Button>
      </div>
    </div>
  );
}
