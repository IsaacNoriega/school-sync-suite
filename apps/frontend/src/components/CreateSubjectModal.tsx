import React, { useState } from 'react';
import { 
  X, Plus, BookOpen, Calculator, FileText, FlaskConical, Globe, Users, Award, CheckSquare 
} from 'lucide-react';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: { name: string; description: string; iconKey: string; color: string }) => Promise<void>;
}

export const SUBJECT_ICON_OPTIONS = [
  { key: 'BookOpen',     label: 'General',      node: <BookOpen size={20} /> },
  { key: 'Calculator',  label: 'Matemáticas', node: <Calculator size={20} /> },
  { key: 'FileText',    label: 'Lengua',       node: <FileText size={20} /> },
  { key: 'FlaskConical',label: 'Ciencias',     node: <FlaskConical size={20} /> },
  { key: 'Globe',       label: 'Historia',     node: <Globe size={20} /> },
  { key: 'Users',       label: 'Grupo',        node: <Users size={20} /> },
  { key: 'Award',       label: 'Premio',       node: <Award size={20} /> },
  { key: 'CheckSquare', label: 'Evaluación', node: <CheckSquare size={20} /> },
];

export const SUBJECT_COLOR_OPTIONS = [
  { bg: '#e0f2fe', color: '#0284c7', label: 'Azul' },
  { bg: '#f3e8ff', color: '#a855f7', label: 'Morado' },
  { bg: '#ffedd5', color: '#f97316', label: 'Naranja' },
  { bg: '#fee2e2', color: '#ef4444', label: 'Rojo' },
  { bg: '#dcfce7', color: '#16a34a', label: 'Verde' },
  { bg: '#fef9c3', color: '#ca8a04', label: 'Amarillo' },
  { bg: '#fce7f3', color: '#db2777', label: 'Rosa' },
  { bg: '#e0e7ff', color: '#4f46e5', label: 'Índigo' },
];

export default function CreateSubjectModal({
  isOpen,
  onClose,
  onSubmit
}: CreateSubjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconKey, setIconKey] = useState('BookOpen');
  const [color, setColor] = useState('#0284c7');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ name, description, iconKey, color });
      setName('');
      setDescription('');
      setIconKey('BookOpen');
      setColor('#0284c7');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear la asignatura');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedColorBg = SUBJECT_COLOR_OPTIONS.find(c => c.color === color)?.bg || '#e0f2fe';
  const selectedIconNode = SUBJECT_ICON_OPTIONS.find(i => i.key === iconKey)?.node || <BookOpen size={24} />;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '32px',
        borderRadius: '16px',
        background: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border-color)',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
          title="Cerrar"
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} color="#0284c7" />
          Registrar Nueva Asignatura
        </h2>

        {error && (
          <div style={{ color: 'var(--error)', background: 'var(--error-light)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live preview card */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <div style={{
              width: '130px', minHeight: '140px',
              background: selectedColorBg,
              borderRadius: '16px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '18px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: `2px solid ${color}22`
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color
              }}>
                {selectedIconNode}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', textAlign: 'center', wordBreak: 'break-word' }}>
                {name || 'Mi Asignatura'}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Nombre de la Asignatura</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ej. Matemáticas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Descripción (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Turno Matutino / Semestre Otoño"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Ícono</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {SUBJECT_ICON_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  title={opt.label}
                  onClick={() => setIconKey(opt.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '4px', padding: '10px 6px', borderRadius: '10px', border: '2px solid',
                    borderColor: iconKey === opt.key ? color : 'transparent',
                    background: iconKey === opt.key ? `${color}15` : '#f8fafc',
                    color: iconKey === opt.key ? color : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s', fontSize: '0.62rem', fontWeight: 600
                  }}
                >
                  {opt.node}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Paleta de Color</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {SUBJECT_COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.color}
                  type="button"
                  onClick={() => setColor(opt.color)}
                  style={{
                    height: '38px', borderRadius: '8px', border: '2px solid',
                    borderColor: color === opt.color ? '#0f172a' : 'transparent',
                    background: opt.color,
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: color === opt.color ? 'white' : 'transparent',
                    fontWeight: 800
                  }}
                >
                  {color === opt.color && '✓'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ flex: 1, padding: '12px' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
              style={{ flex: 1, padding: '12px', background: color }}
            >
              {submitting ? 'Creando...' : 'Crear Asignatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
