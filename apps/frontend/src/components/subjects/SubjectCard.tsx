'use client';

import React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SubjectItem, getSubjectVisuals } from './subjectUtils';

export interface SubjectCardProps {
  subject: SubjectItem;
  index?: number;
  basePath?: string;
  tasksCount?: number;
  onEdit?: (subject: SubjectItem) => void;
  onDelete?: (subject: SubjectItem) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  index = 0,
  basePath = '/subjects',
  tasksCount,
  onEdit,
  onDelete,
}) => {
  const visuals = getSubjectVisuals(subject, index);
  const IconComp = visuals.IconComponent;
  const count = tasksCount ?? subject.activeTasksCount ?? 0;
  const href = `${basePath}/${subject._id}`;

  return (
    <Link
      href={href}
      className="group block cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40"
      aria-label={`Abrir materia ${subject.name}`}
    >
      <Card
        bgColor={visuals.cardBg}
        className="p-5 sm:p-6 flex flex-col justify-between h-full border border-transparent group-hover:border-black/5 rounded-3xl shadow-xs transition-shadow relative"
      >
        {/* Cabecera de la Tarjeta */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-white/95 shadow-2xs border border-white/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <IconComp className={`w-5 h-5 ${visuals.textColor}`} strokeWidth={2.3} />
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              className={`${visuals.badgeBg} ${visuals.badgeText} text-[11px] font-black px-2.5 py-0.5 rounded-full`}
            >
              {count} {count === 1 ? 'tarea' : 'tareas'}
            </Badge>

            {onEdit && (
              <Button
                variant="icon"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(subject);
                }}
                className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-sky-600 shadow-2xs transition-colors cursor-pointer"
                title="Editar materia"
                aria-label={`Editar ${subject.name}`}
              >
                <Pencil size={13} strokeWidth={2.3} />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="icon"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(subject);
                }}
                className="w-7 h-7 rounded-lg bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                title="Eliminar materia"
                aria-label={`Eliminar ${subject.name}`}
              >
                <Trash2 size={13} strokeWidth={2.3} />
              </Button>
            )}
          </div>
        </div>

        {/* Contenido Central */}
        <div className="space-y-1.5 my-1">
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-sky-900 transition-colors">
            {subject.name}
          </h3>
          <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-2">
            {subject.description || 'Espacio de trabajo y registro de tareas evaluativas'}
          </p>
        </div>

        {/* Pie de la Tarjeta con Efecto Interactivo */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-black/5">
          <span className="text-xs font-black text-slate-800">
            {subject.code || 'Educación Básica'}
          </span>
          <div className="flex items-center gap-1 text-slate-700 group-hover:text-sky-700 font-extrabold text-xs transition-colors">
            <span>Entrar</span>
            <ArrowRight
              size={15}
              className="text-slate-800 group-hover:text-sky-700 group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default SubjectCard;
