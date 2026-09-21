'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName?: string;
  teacherRole?: string;
  teacherGrade?: string;
  avatarUrl?: string;
  isAdminReset?: boolean;
  onSubmit?: (passwords: {
    current: string;
    newPass: string;
    confirmPass: string;
  }) => Promise<void> | void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  teacherName = 'Maestra Ana Martínez',
  teacherRole = 'Docente Titular',
  teacherGrade = 'Titular 3° Grado • Colegio San Patricio',
  avatarUrl = '/teacher-avatar.jpg',
  isAdminReset = false,
  onSubmit,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  // Manejo de cierre accesible mediante tecla Escape con cleanup estricto
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!isAdminReset && !currentPassword) || !newPassword || !confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('La nueva contraseña y su confirmación no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Actualizando contraseña...');

    try {
      if (onSubmit) {
        await onSubmit({
          current: currentPassword,
          newPass: newPassword,
          confirmPass: confirmPassword,
        });
      }
      toast.success('¡Contraseña actualizada con éxito!', { id: toastId });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la contraseña', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      {/* Tarjeta Principal del Modal */}
      <Card className="w-full max-w-sm bg-white rounded-[2.5rem] p-7 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 flex flex-col items-center">
        {/* Botón Cerrar Superior Derecho */}
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de cambio de contraseña"
          className="w-8 h-8 !p-0 rounded-full bg-slate-100/90 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors absolute top-5 right-5"
          title="Cerrar modal"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </Button>

        {/* Avatar Circular con Imagen */}
        <div className="relative mt-1">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-slate-100 shadow-sm bg-amber-100 flex items-center justify-center font-black text-amber-700 text-xl border border-amber-200">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={teacherName}
                onError={(e) => {
                  // Fallback to stylized initials if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-full h-full object-cover"
              />
            ) : null}
            <span className="select-none">AM</span>
          </div>
        </div>

        {/* Badge de Rol */}
        <Badge
          color="bg-emerald-100 text-emerald-700 font-bold text-xs px-3.5 py-1 rounded-full mt-3"
          size="sm"
        >
          {teacherRole}
        </Badge>

        {/* Nombre y Asignación */}
        <div className="text-center mt-2 mb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {teacherName}
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            {teacherGrade}
          </p>
        </div>

        {/* Sección: Cambiar Contraseña */}
        <div className="w-full flex items-center gap-2 mb-4">
          <RotateCcw className="w-4 h-4 text-sky-500 stroke-[2.5]" />
          <h3
            id="change-password-modal-title"
            className="font-extrabold text-sm text-slate-800 tracking-tight"
          >
            Cambiar Contraseña
          </h3>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          {/* Campo 1: Contraseña Actual (solo si no es reset de admin) */}
          {!isAdminReset && (
            <div className="flex flex-col gap-1 text-left">
              <label
                htmlFor="current-password-input"
                className="text-xs font-bold text-slate-600"
              >
                Contraseña Actual
              </label>
              <Input
                id="current-password-input"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                rightIcon={
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    aria-label={showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                    className="w-7 h-7 !p-0 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                }
                className="text-sm font-semibold tracking-wider placeholder:text-slate-300"
              />
            </div>
          )}

          {/* Campo 2: Nueva Contraseña */}
          <div className="flex flex-col gap-1 text-left">
            <label
              htmlFor="new-password-input"
              className="text-xs font-bold text-slate-600"
            >
              Nueva Contraseña
            </label>
            <Input
              id="new-password-input"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              rightIcon={
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  className="w-7 h-7 !p-0 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              }
              className="text-sm font-semibold tracking-wider placeholder:text-slate-300"
            />
          </div>

          {/* Campo 3: Confirmar Nueva Contraseña */}
          <div className="flex flex-col gap-1 text-left">
            <label
              htmlFor="confirm-password-input"
              className="text-xs font-bold text-slate-600"
            >
              Confirmar Nueva Contraseña
            </label>
            <Input
              id="confirm-password-input"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              rightIcon={
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                  className="w-7 h-7 !p-0 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              }
              className="text-sm font-semibold tracking-wider placeholder:text-slate-300"
            />
          </div>

          {/* Botones de Acción (Grid 2 cols) */}
          <div className="grid grid-cols-2 gap-3 pt-3 mt-1">
            <Button
              variant="secondary"
              size="lg"
              type="button"
              onClick={onClose}
              className="w-full py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200"
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
              className="w-full py-3 font-black shadow-lg shadow-sky-400/25 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

