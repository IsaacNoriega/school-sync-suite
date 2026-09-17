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
import { SUBJECT_COLOR_OPTIONS, SUBJECT_ICON_OPTIONS } from './CreateSubjectModal';

export interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: {
    _id: string;
    name: string;
    description?: string;
    code?: string;
    color?: string;
    iconKey?: string;
  } | null;
  onSubmit?: (id: string, updatedData: {
    name: string;
    description: string;
    iconKey: string;
    color: string;
  }) => Promise<void> | void;
}

export default function EditSubjectModal({
  isOpen,
  onClose,
  subject,
  onSubmit,
}: EditSubjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('sky');
  const [selectedIcon, setSelectedIcon] = useState('book');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && subject) {
      setName(subject.name || '');
      setDescription(subject.description || '');
      setSelectedColor(subject.color || 'sky');
      setSelectedIcon(subject.iconKey || 'book');
    }
  }, [isOpen, subject]);

  if (!isOpen || !subject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Por favor escribe el nombre de la asignatura');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Actualizando materia...');

    try {
      if (onSubmit) {
        await onSubmit(subject._id, {
          name,
          description,
          iconKey: selectedIcon,
          color: selectedColor,
        });
      }
      toast.success('¡Materia actualizada con éxito!', { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la materia', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      {/* Tarjeta Principal del Modal */}
      <Card className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Editar Asignatura
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                {subject.code ? `Código: ${subject.code}` : 'Modifica los datos de la asignatura'}
              </p>
            </div>
          </div>

          {/* Botón Cerrar */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer p-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Nombre de la Asignatura */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600">
              Nombre de la Asignatura
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Educación Artística & Música"
              className="text-xs font-semibold placeholder:text-slate-300 py-2"
            />
          </div>

          {/* Descripción Breve */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600">
              Descripción Breve
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Técnicas plásticas y solfeo rítmico"
              className="text-xs font-semibold placeholder:text-slate-300 py-2"
            />
          </div>

          {/* Fila: Color de Tarjeta e Ícono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">
                Color de Tarjeta
              </label>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex items-center justify-between">
                {SUBJECT_COLOR_OPTIONS.map((c) => {
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
                Ícono Representativo
              </label>
              <div className="grid grid-cols-6 gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-1.5">
                {SUBJECT_ICON_OPTIONS.map((item) => {
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
