import React from 'react';
import { UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { ScanMode, AttendanceFeedback, GradeFeedback } from './types';

interface ScanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanMode: ScanMode;
  attendanceFeedback: AttendanceFeedback | null;
  gradeFeedback: GradeFeedback | null;
}

export const ScanDetailModal: React.FC<ScanDetailModalProps> = ({
  isOpen,
  onClose,
  scanMode,
  attendanceFeedback,
  gradeFeedback,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserCheck size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Detalle de Registro
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Sincronizado en tiempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Attendance details */}
        {scanMode === 'attendance' && attendanceFeedback && (
          <div className="space-y-3.5 text-xs font-semibold text-slate-600">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Estudiante:</span>
                <span className="font-black text-slate-900 text-sm">
                  {attendanceFeedback.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Matrícula:</span>
                <span className="font-bold text-slate-800">
                  #{attendanceFeedback.enrollment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Estado:</span>
                <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[11px]">
                  {attendanceFeedback.statusText}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Hora Registrada:</span>
                <span className="font-bold text-slate-800">
                  {attendanceFeedback.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Puntos Obtenidos:</span>
                <span className="font-black text-emerald-600">
                  +{attendanceFeedback.points} Pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Grade details */}
        {scanMode === 'grades' && gradeFeedback && (
          <div className="space-y-3.5 text-xs font-semibold text-slate-600">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Estudiante:</span>
                <span className="font-black text-slate-900 text-sm">
                  {gradeFeedback.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Matrícula:</span>
                <span className="font-bold text-slate-800">
                  #{gradeFeedback.enrollment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Acción:</span>
                <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[11px]">
                  {gradeFeedback.action}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Hora Registrada:</span>
                <span className="font-bold text-slate-800">
                  {gradeFeedback.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Calificación / Nota:</span>
                <span className="font-black text-emerald-600">
                  {gradeFeedback.score} Pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full py-2.5 font-black text-xs rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white cursor-pointer"
          >
            Cerrar Detalle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScanDetailModal;
