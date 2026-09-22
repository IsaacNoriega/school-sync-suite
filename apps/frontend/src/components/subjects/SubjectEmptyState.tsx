'use client';

import React from 'react';
import { ClipboardList, Plus, Sparkles, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface SubjectEmptyStateProps {
  type?: 'tasks' | 'subjects';
  subjectName?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const SubjectEmptyState: React.FC<SubjectEmptyStateProps> = ({
  type = 'tasks',
  subjectName,
  onAction,
  actionLabel,
  className,
}) => {
  const isTasks = type === 'tasks';

  const defaultTitle = isTasks
    ? subjectName
      ? `Aún no hay tareas en ${subjectName}`
      : 'Aún no hay tareas en esta materia'
    : 'Aún no tienes materias registradas';

  const defaultDescription = isTasks
    ? 'Crea tu primera tarea evaluativa para generar actividades, registrar ponderaciones y calificar en segundos con el escáner QR.'
    : 'Crea tus asignaturas por grado o curso para empezar a organizar tareas, asistencia y registro escolar.';

  const defaultActionLabel = isTasks ? 'Crear Primera Tarea' : 'Crear Primera Materia';
  const IconComponent = isTasks ? ClipboardList : FolderPlus;

  return (
    <div
      className={`max-w-xl mx-auto my-8 p-8 sm:p-10 rounded-3xl bg-white border-2 border-dashed border-sky-200/80 shadow-xs flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 ${className || ''}`}
    >
      {/* Icono Ilustrativo */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-inner">
          <IconComponent className="w-8 h-8 stroke-[2]" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>

      {/* Textos */}
      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-2">
        {defaultTitle}
      </h3>
      <p className="text-xs font-semibold text-slate-500 max-w-md leading-relaxed mb-6">
        {defaultDescription}
      </p>

      {/* Botón de Acción Directo */}
      {onAction && (
        <Button
          type="button"
          variant="primary"
          onClick={onAction}
          leftIcon={<Plus className="w-4 h-4 stroke-[2.8]" />}
          className="bg-[#009ee3] hover:bg-[#0284c7] text-white font-black text-xs px-6 py-3 rounded-2xl shadow-lg shadow-sky-500/25 transition-all cursor-pointer h-auto hover:scale-105 active:scale-95"
        >
          {actionLabel || defaultActionLabel}
        </Button>
      )}
    </div>
  );
};

export default SubjectEmptyState;
