'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, UserX, School, User, Search, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useLayout } from '../layout-context';
import { API_BASE_URL } from '@/config/api';

export default function AdminPage() {
  const { token, searchQuery } = useLayout();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch teachers when token is available
  useEffect(() => {
    if (token) {
      fetchTeachers(token);
    }
  }, [token]);

  const fetchTeachers = async (authToken: string) => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/teachers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTeachers(data);
      } else {
        setFetchError(data.message || 'Error al obtener la lista de profesoras.');
      }
    } catch (err) {
      setFetchError('No se pudo conectar con el servidor de control.');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, name, schoolName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar profesora');
      }

      setFormSuccess(`¡Profesora ${data.name} registrada exitosamente!`);
      setName('');
      setEmail('');
      setPassword('');
      setSchoolName('');
      if (token) fetchTeachers(token);
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error al registrar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/teachers/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setTeachers(prev => prev.map(t => {
          if (t.user?._id === userId) {
            return {
              ...t,
              user: { ...t.user, isActive: !currentStatus }
            };
          }
          return t;
        }));
      } else {
        const data = await response.json();
        alert(data.message || 'Error al modificar el estado de la profesora');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Error de red al intentar modificar el estado');
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="responsive-split-1-2">
      
      {/* Form Card */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} />
          Registrar Profesora
        </h2>

        {formError && (
          <div style={{ 
            color: 'var(--error)', 
            background: 'var(--error-light)', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '15px', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}
        
        {formSuccess && (
          <div style={{ 
            color: 'var(--success)', 
            background: 'var(--success-light)', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '15px', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleRegisterTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Nombre de la Profesora"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="correo@colegio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Escuela / Colegio</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Colegio Las Américas"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '10px' }}>
            {submitting ? 'Registrando...' : 'Dar de Alta'}
          </button>
        </form>
      </div>

      {/* List Card */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <School size={20} />
          Profesoras Activas
        </h2>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={24} className="spin" />
            <span>Cargando datos de profesoras...</span>
          </div>
        ) : fetchError ? (
          <div style={{ 
            color: 'var(--error)', 
            background: 'var(--error-light)', 
            padding: '20px', 
            borderRadius: '10px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={24} />
            <span>{fetchError}</span>
            <button className="btn btn-secondary" onClick={() => token && fetchTeachers(token)} style={{ marginTop: '10px', background: 'white' }}>
              Reintentar Carga
            </button>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
            {searchQuery ? 'No hay profesoras que coincidan con la búsqueda.' : 'No hay profesoras registradas en el sistema.'}
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Escuela</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher._id}>
                    <td style={{ fontWeight: 600 }}>{teacher.name}</td>
                    <td>{teacher.schoolName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{teacher.user?.email}</td>
                    <td>
                      <span className={`badge ${teacher.user?.isActive ? 'badge-present' : 'badge-absent'}`}>
                        {teacher.user?.isActive ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn ${teacher.user?.isActive ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleToggleStatus(teacher.user?._id, teacher.user?.isActive)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          width: '120px'
                        }}
                      >
                        {teacher.user?.isActive ? 'Suspender' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
