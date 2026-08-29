'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, LogOut, Plus, UserCheck, UserX, School, 
  User, Bell, HelpCircle, GraduationCap, Settings, 
  Calendar, BookOpen, Users, FileText, Search
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    setUserEmail(user.email);
    fetchTeachers(token);
  }, [router]);

  const fetchTeachers = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/auth/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTeachers(data);
      }
    } catch (err) {
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

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3001/auth/register-teacher', {
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
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/auth/teachers/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setTeachers(prev => prev.map(t => {
          if (t.user._id === userId) {
            return {
              ...t,
              user: { ...t.user, isActive: !currentStatus }
            };
          }
          return t;
        }));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-layout">
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-container">
            <GraduationCap size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">EduControl Pro</span>
            <span className="brand-subtitle">Academic Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <User size={20} />
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

          <div className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <FileText size={20} />
            <span>Reports</span>
          </div>

          <div className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </nav>

        <div style={{ marginTop: 'auto', padding: '24px', fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div>Modo Administrador</div>
        </div>
      </aside>

      {/* RIGHT SIDE WRAPPER */}
      <div className="main-wrapper">
        
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-logo">
            EduControl
          </div>
          
          <div className="topbar-search">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar profesoras, correos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="topbar-actions">
            <button className="topbar-icon-btn" onClick={() => alert('Sesión de administración global.')}>
              <Bell size={20} />
            </button>
            <button className="topbar-icon-btn">
              <HelpCircle size={20} />
            </button>
            <div className="topbar-divider"></div>
            
            <div 
              className="avatar-badge" 
              title="Cerrar sesión"
              onClick={handleLogout}
              style={{ background: '#fef2f2', borderColor: '#fee2e2', color: 'var(--error)' }}
            >
              AD
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="content-body">
          <div className="responsive-split-1-2">
            
            {/* Form */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} />
                Registrar Profesora
              </h2>

              {formError && (
                <div style={{ color: 'var(--error)', background: 'var(--error-light)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ color: 'var(--success)', background: 'var(--success-light)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
                  {formSuccess}
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

            {/* List */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <School size={20} />
                Profesoras Activas
              </h2>

              {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Cargando datos...</div>
              ) : filteredTeachers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No hay registros coincidentes.</div>
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
        </div>

      </div>

    </div>
  );
}
