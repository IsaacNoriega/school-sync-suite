'use client';

import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-7 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5 shadow-sm shadow-rose-100/50">
          <LogOut size={28} className="translate-x-0.5" />
        </div>

        {/* Header Title & Description */}
        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
          ¿Deseas cerrar sesión?
        </h3>
        <p className="text-sm font-semibold text-slate-500 max-w-xs mb-6 leading-relaxed">
          {userName ? (
            <>
              Hola <span className="text-slate-700 font-bold">{userName}</span>, al salir finalizará tu sesión en EducaQR y deberás ingresar tus credenciales para volver a entrar.
            </>
          ) : (
            'Se cerrará tu sesión activa en EducaQR. Deberás ingresar tus credenciales nuevamente para acceder.'
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-red-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Sí, Salir</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLogoutModal;
