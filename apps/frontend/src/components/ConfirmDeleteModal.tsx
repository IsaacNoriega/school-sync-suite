'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  itemName?: string;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  loading = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <Card className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
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

        <div className="space-y-1.5 mb-5">
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            {description}
          </p>
          {itemName && (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-bold text-slate-800 truncate mt-2">
              {itemName}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-500 font-bold hover:text-slate-800 px-4 text-xs"
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            size="sm"
            type="button"
            onClick={onConfirm}
            disabled={loading}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2 text-xs shadow-md"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
