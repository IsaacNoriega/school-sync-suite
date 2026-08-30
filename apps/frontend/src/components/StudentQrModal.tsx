import React from 'react';

interface StudentQrModalProps {
  student: { name: string; qrCode: string } | null;
  onClose: () => void;
}

export default function StudentQrModal({
  student,
  onClose
}: StudentQrModalProps) {
  if (!student) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

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
        maxWidth: '350px',
        width: '100%',
        padding: '30px',
        textAlign: 'center',
        borderRadius: '16px',
        background: 'white',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h3 style={{ fontSize: '1.2rem', color: '#0c4a6e', marginBottom: '8px' }}>Código QR del Alumno</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>{student.name}</p>
        
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          display: 'inline-block',
          marginBottom: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${student.qrCode}`}
            alt={`Código QR para ${student.name}`}
            style={{ display: 'block' }}
          />
        </div>
        
        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '20px', wordBreak: 'break-all' }}>
          {student.qrCode}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            style={{ width: '100%' }}
          >
            Imprimir Código QR
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ width: '100%' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
