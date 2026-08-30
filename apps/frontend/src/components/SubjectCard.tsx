import React from 'react';
import { Plus } from 'lucide-react';

interface SubjectCardProps {
  name?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  isActive?: boolean;
  isCreator?: boolean;
  onClick: () => void;
}

export default function SubjectCard({
  name,
  icon,
  iconBg,
  iconColor,
  isActive = false,
  isCreator = false,
  onClick
}: SubjectCardProps) {
  if (isCreator) {
    return (
      <div 
        className="subject-card"
        style={{ 
          '--card-color': '#94a3b8',
          borderStyle: 'dashed', 
          borderColor: '#94a3b8', 
          background: '#f8fafc',
          cursor: 'pointer'
        } as React.CSSProperties}
        onClick={onClick}
      >
        <div className="subject-card-inner" style={{ alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div className="subject-card-icon-box" style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
            <Plus size={24} />
          </div>
          <div className="subject-card-name" style={{ color: '#94a3b8', marginTop: '8px' }}>
            Crear Asignatura
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`subject-card ${isActive ? 'active' : ''}`}
      style={{ 
        '--card-color': iconColor,
        cursor: 'pointer'
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="subject-card-inner">
        <div className="subject-card-icon-box" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        <div className="subject-card-name">{name}</div>
      </div>
    </div>
  );
}
