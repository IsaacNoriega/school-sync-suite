'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Pencil,
  User,
  Hash,
  Users,
  Sun,
  Moon,
  UserCheck,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export interface StudentDataForEdit {
  _id: string;
  name: string;
  enrollmentNumber: string;
  group: string;
  shift: string;
  tutor: string;
  tutorPhone?: string;
}

export interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDataForEdit | null;
  onSubmit: (
    id: string,
    updatedData: {
      name: string;
      enrollmentNumber: string;
      group: string;
      shift: string;
      tutor: string;
      tutorPhone: string;
    }
  ) => Promise<void> | void;
}

export default function EditStudentModal({
  isOpen,
  onClose,
  student,
  onSubmit,
}: EditStudentModalProps) {
  const [name, setName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [group, setGroup] = useState('');
  const [shift, setShift] = useState('Matutino');
  const [tutor, setTutor] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setName(student.name || '');
      setEnrollmentNumber(student.enrollmentNumber || '');
      setGroup(student.group || '');
      setShift(student.shift || 'Matutino');
      setTutor(student.tutor || '');
      setTutorPhone(student.tutorPhone || '');
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Por favor ingresa el nombre del alumno');
      return;
    }
    if (!enrollmentNumber.trim()) {
      toast.error('Por favor ingresa la matrícula');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(student._id, {
        name: name.trim(),
        enrollmentNumber: enrollmentNumber.trim(),
        group: group.trim(),
        shift,
        tutor: tutor.trim(),
        tutorPhone: tutorPhone.trim(),
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar información del estudiante');
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
              <Pencil className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Editar Información del Alumno
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Matrícula: <span className="font-bold text-sky-600">{student.enrollmentNumber}</span>
              </p>
            </div>
          </div>

          {/* Botón Cerrar */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer p-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Nombre Completo */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-500" />
              Nombre Completo del Alumno
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Isaac Abdiel Noriega Villalobos"
              className="text-xs font-semibold py-2 rounded-xl border-slate-200 focus:ring-sky-500"
            />
          </div>

          {/* Fila: Matrícula y Grupo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-sky-500" />
                Matrícula / ID
              </label>
              <Input
                type="text"
                required
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                placeholder="Ej. #K-001"
                className="text-xs font-semibold py-2 rounded-xl border-slate-200 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                Grupo / Grado
              </label>
              <Input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="Ej. Grupo 3º B"
                className="text-xs font-semibold py-2 rounded-xl border-slate-200 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Turno */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Turno
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setShift('Matutino')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  shift === 'Matutino'
                    ? 'bg-white text-sky-700 shadow-2xs border border-sky-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Matutino
              </button>
              <button
                type="button"
                onClick={() => setShift('Vespertino')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  shift === 'Vespertino'
                    ? 'bg-white text-sky-700 shadow-2xs border border-sky-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                Vespertino
              </button>
            </div>
          </div>

          {/* Fila: Nombre Tutor y Teléfono Tutor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                Nombre del Tutor
              </label>
              <Input
                type="text"
                value={tutor}
                onChange={(e) => setTutor(e.target.value)}
                placeholder="Ej. María Villalobos"
                className="text-xs font-semibold py-2 rounded-xl border-slate-200 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-500" />
                Teléfono del Tutor
              </label>
              <Input
                type="tel"
                value={tutorPhone}
                onChange={(e) => setTutorPhone(e.target.value)}
                placeholder="Ej. 6691234567"
                className="text-xs font-semibold py-2 rounded-xl border-slate-200 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Acciones del Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-1">
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
              className="px-5 py-2 font-black shadow-md text-xs bg-sky-600 hover:bg-sky-700 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
