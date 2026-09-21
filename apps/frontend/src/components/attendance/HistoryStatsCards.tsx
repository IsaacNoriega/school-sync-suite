'use client';

import React from 'react';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';
import { AttendanceFilterStatus, AttendanceSummaryStats } from './types';

interface HistoryStatsCardsProps {
  stats: AttendanceSummaryStats;
  activeFilter: AttendanceFilterStatus;
  onFilterChange: (status: AttendanceFilterStatus) => void;
}

export const HistoryStatsCards: React.FC<HistoryStatsCardsProps> = ({
  stats,
  activeFilter,
  onFilterChange,
}) => {
  const presentPercent = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const latePercent = stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0;
  const absentPercent = stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0;

  const cards = [
    {
      id: 'ALL' as AttendanceFilterStatus,
      label: 'Total Matriculados',
      count: stats.total,
      sublabel: `${stats.attendanceRate}% Asistencia general`,
      icon: Users,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      borderColor: 'border-sky-200',
      activeRing: 'ring-2 ring-sky-500 bg-sky-50/60',
    },
    {
      id: 'PRESENT' as AttendanceFilterStatus,
      label: 'Asistencias Puntuales',
      count: stats.present,
      sublabel: `${presentPercent}% del grupo`,
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      activeRing: 'ring-2 ring-emerald-500 bg-emerald-50/60',
    },
    {
      id: 'LATE' as AttendanceFilterStatus,
      label: 'Retardos',
      count: stats.late,
      sublabel: `${latePercent}% del grupo`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      activeRing: 'ring-2 ring-amber-500 bg-amber-50/60',
    },
    {
      id: 'ABSENT' as AttendanceFilterStatus,
      label: 'Inasistencias / Faltas',
      count: stats.absent,
      sublabel: `${absentPercent}% del grupo`,
      icon: UserX,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      borderColor: 'border-rose-200',
      activeRing: 'ring-2 ring-rose-500 bg-rose-50/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange(card.id)}
            className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs hover:border-slate-300 ${
              isActive ? card.activeRing : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                <Icon size={16} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {card.count}
              </span>
              <span className="text-[11px] font-bold text-slate-500 truncate">
                {card.sublabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
