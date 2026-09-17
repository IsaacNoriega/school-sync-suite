'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { COLOR_OPTIONS, ICON_OPTIONS } from './CreateAssignmentModal';

export interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    _id: string;
    title: string;
    description?: string;
    maxScore: number;
    dueDate?: string;
    color?: string;
    iconKey?: string;
    subject?: {
      _id: string;
      name: string;
    };
  } | null;
  onSubmit?: (id: string, updatedData: {
    title: string;
    maxScore: number;
    dueDate: string;
    color: string;
    iconKey: string;
  }) => Promise<void> | void;
}

export default function EditAssignmentModal({
  isOpen,
  onClose,
  assignment,
  onSubmit,
}: EditAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [dueDate, setDueDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('sky');
  const [selectedIcon, setSelectedIcon] = useState('clipboard');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && assignment) {
      setTitle(assignment.title || '');
      setMaxScore(assignment.maxScore || 100);
      if (assignment.dueDate) {
        const d = new Date(assignment.dueDate);
        if (!isNaN(d.getTime())) {
          setDueDate(d.toISOString().split('T')[0]);
        } else {
          setDueDate(assignment.dueDate);
        }
      } else {
        setDueDate('');
      }
      setSelectedColor(assignment.color || 'sky');
      setSelectedIcon(assignment.iconKey || 'clipboard');
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Por favor escribe el título de la tarea');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Actualizando tarea...');

    try {
      if (onSubmit) {
        await onSubmit(assignment._id, {
          title,
          maxScore,
          dueDate,
          color: selectedColor,
          iconKey: selectedIcon,
        });
      }
      toast.success('¡Tarea actualizada con éxito!', { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la tarea', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      {/* Tarjeta Principal del Modal sin scroll */}
      <Card className="w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Editar Tarea
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                {assignment.subject?.name ? `Materia: ${assignment.subject.name}` : 'Actualiza los datos de la actividad'}
              </p>
            </div>
          </div>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Formulario en 2 columnas compacto */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Fila 1: Título de la Tarea (Full width) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600">
              Título de la Tarea
            </label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Taller de Fracciones"
              className="text-xs font-semibold text-slate-800 placeholder:text-slate-300 py-2"
            />
          </div>

          {/* Fila 2: Puntaje Máximo y Fecha de Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">
                Puntaje Máximo
              </label>
              <Input
                type="number"
                min={1}
                required
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                placeholder="100"
                rightIcon={
                  <span className="text-[10px] font-black text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    PTS
                  </span>
                }
                className="text-xs font-bold text-slate-800 py-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">
                Fecha de Entrega
              </label>
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs font-semibold text-slate-800 py-2"
              />
            </div>
          </div>

          {/* Fila 3: Color de Tarjeta e Ícono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">
                Color de Tarjeta
              </label>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex items-center justify-between">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = selectedColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all flex items-center justify-center border-2 cursor-pointer',
                        c.bgClass,
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-100 shadow-xs scale-105'
                          : 'border-transparent hover:scale-105'
                      )}
                      title={c.label}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-sky-700 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">
                Ícono de la Tarea
              </label>
              <div className="grid grid-cols-6 gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-1.5">
                {ICON_OPTIONS.map((item) => {
                  const isSelected = selectedIcon === item.id;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      className={cn(
                        'h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer',
                        isSelected
                          ? 'bg-sky-100 text-sky-700 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                      )}
                      title={item.label}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Acciones del Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-1">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
              className="text-slate-500 font-bold hover:text-slate-800 px-4 text-xs"
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={loading}
              leftIcon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
              className="px-5 py-2 font-black shadow-md text-xs"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
