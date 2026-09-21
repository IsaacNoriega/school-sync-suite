'use client';

import React, { useState } from 'react';
import {
  X,
  ClipboardList,
  Check,
  CheckCircle2,
  DraftingCompass,
  ChevronsUpDown,
  Palette,
  BookOpen,
  FlaskConical,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects?: Array<{ _id: string; name: string; code?: string; color?: string; iconKey?: string }>;
  defaultSubjectId?: string;
  onSubmit?: (assignment: {
    subjectId: string;
    title: string;
    maxScore: number;
    dueDate: string;
    color: string;
    iconKey: string;
  }) => Promise<void> | void;
}

export const COLOR_OPTIONS = [
  { id: 'sky', bgClass: 'bg-[#bae6fd]', hex: '#38bdf8', label: 'Cielo' },
  { id: 'emerald', bgClass: 'bg-[#bbf7d0]', hex: '#4ade80', label: 'Menta' },
  { id: 'amber', bgClass: 'bg-[#fef08a]', hex: '#facc15', label: 'Ámbar' },
  { id: 'rose', bgClass: 'bg-[#fecdd3]', hex: '#fb7185', label: 'Rosa' },
  { id: 'purple', bgClass: 'bg-[#e9d5ff]', hex: '#c084fc', label: 'Lavanda' },
];

export const ICON_OPTIONS = [
  { id: 'clipboard', label: 'Tarea', icon: ClipboardList },
  { id: 'math', label: 'Matemática', icon: DraftingCompass },
  { id: 'book', label: 'Lectura', icon: BookOpen },
  { id: 'science', label: 'Ciencia', icon: FlaskConical },
  { id: 'art', label: 'Arte', icon: Palette },
  { id: 'sport', label: 'Deporte', icon: Trophy },
];

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  subjects = [],
  defaultSubjectId,
  onSubmit,
}: CreateAssignmentModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [dueDate, setDueDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('sky');
  const [selectedIcon, setSelectedIcon] = useState('clipboard');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      let rawId = defaultSubjectId;
      if (!rawId || rawId === 'all' || rawId === '[object Object]') {
        const first = subjects.length > 0 ? subjects[0]._id : '';
        rawId = typeof first === 'object' && first !== null ? (first as any)._id || String(first) : String(first || '');
      }
      const initialSubjectId = typeof rawId === 'object' && rawId !== null ? (rawId as any)._id || String(rawId) : String(rawId || '');
      setSelectedSubjectId(initialSubjectId);
      setTitle('');
      setMaxScore(100);
      
      const foundSub = subjects.find((s: any) => {
        const sId = typeof s._id === 'object' && s._id !== null ? (s._id as any)._id || String(s._id) : String(s._id);
        return sId === initialSubjectId;
      });
      if (foundSub?.color) {
        setSelectedColor(foundSub.color);
      } else {
        setSelectedColor('sky');
      }

      if (foundSub?.iconKey) {
        setSelectedIcon(foundSub.iconKey);
      } else {
        setSelectedIcon('clipboard');
      }

      // Default due date: in 7 days formatted as YYYY-MM-DD
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setDueDate(nextWeek.toISOString().split('T')[0]);
    }
  }, [isOpen, defaultSubjectId, subjects]);

  const handleSubjectChange = (newSubjectId: any) => {
    const cleanId = typeof newSubjectId === 'object' && newSubjectId !== null
      ? (newSubjectId as any)._id || String(newSubjectId)
      : String(newSubjectId || '');
    setSelectedSubjectId(cleanId);
    const foundSub = subjects.find((s: any) => {
      const sId = typeof s._id === 'object' && s._id !== null ? (s._id as any)._id || String(s._id) : String(s._id);
      return sId === cleanId;
    });
    if (foundSub?.color) {
      setSelectedColor(foundSub.color);
    }
    if (foundSub?.iconKey) {
      setSelectedIcon(foundSub.iconKey);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubjectId = typeof selectedSubjectId === 'object' && selectedSubjectId !== null
      ? (selectedSubjectId as any)._id || String(selectedSubjectId)
      : String(selectedSubjectId || '').trim();

    if (!cleanSubjectId || cleanSubjectId === '[object Object]' || cleanSubjectId === 'all') {
      toast.error('Por favor selecciona una asignatura válida');
      return;
    }
    if (!title.trim()) {
      toast.error('Por favor escribe el título de la tarea');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creando tarea...');

    try {
      if (onSubmit) {
        await onSubmit({
          subjectId: cleanSubjectId,
          title,
          maxScore,
          dueDate,
          color: selectedColor,
          iconKey: selectedIcon,
        });
      }
      toast.success('¡Tarea creada con éxito!', { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la tarea', { id: toastId });
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Crear Nueva Tarea
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Personaliza la actividad, color e ícono de la tarjeta
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

        {/* Formulario en 2 columnas compacto */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Fila 1: Asignatura y Título */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">
                Asignatura Vinculada
              </label>
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                  required
                >
                  {subjects.length === 0 ? (
                    <option value="" disabled>No hay materias disponibles</option>
                  ) : (
                    subjects.map((sub: any) => {
                      const subId = typeof sub._id === 'object' && sub._id !== null ? (sub._id as any)._id || String(sub._id) : String(sub._id);
                      return (
                        <option key={subId} value={subId}>
                          {sub.name} {sub.code ? `(${sub.code})` : ''}
                        </option>
                      );
                    })
                  )}
                </select>
                <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

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
              {loading ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
