import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  align?: 'left' | 'center';
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg = 'rgba(2, 132, 199, 0.08)',
  iconColor = 'var(--primary)',
  align = 'center',
  style,
  onClick
}: StatCardProps) {
  const isCentered = align === 'center';
  
  return (
    <div 
      className="mini-stat-card" 
      onClick={onClick}
      style={{ 
        padding: isCentered ? '16px' : '20px 24px', 
        alignItems: isCentered ? 'center' : 'flex-start', 
        textAlign: isCentered ? 'center' : 'left',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...style 
      }}
    >
      <div 
        className="mini-stat-icon-wrapper" 
        style={{ 
          background: iconBg, 
          color: iconColor,
          alignSelf: isCentered ? 'center' : 'flex-start'
        }}
      >
        {icon}
      </div>
      <div 
        className="mini-stat-val" 
        style={!isCentered ? { fontSize: '2.6rem', marginTop: '6px' } : undefined}
      >
        {value}
      </div>
      <div 
        className="mini-stat-lbl"
        style={!isCentered ? { fontSize: '0.75rem', marginTop: '4px' } : undefined}
      >
        {label}
      </div>
    </div>
  );
}
