'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
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

      // Store auth state
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 30px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <LogIn size={32} color="#3b82f6" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
          <span className="gradient-text">School Sync</span> Suite
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '30px' }}>
          Acceso al Panel de Control Académico
        </p>

        {error && (
          <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'left',
            color: 'var(--error)',
            fontSize: '0.9rem'
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '48px' }}
                placeholder="ejemplo@escuela.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '48px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {loading ? 'Iniciando Sesión...' : 'Entrar al Portal'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Credenciales semilla: <strong>admin@schoolsync.com</strong> / <strong>admin123</strong></span>
        </div>
      </div>
    </div>
  );
}
