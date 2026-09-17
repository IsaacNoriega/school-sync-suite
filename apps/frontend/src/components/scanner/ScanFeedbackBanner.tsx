import React from 'react';
import { Check, History, User, ClipboardCheck } from 'lucide-react';
import { ScanMode, AttendanceFeedback, GradeFeedback } from './types';

interface ScanFeedbackBannerProps {
  scanMode: ScanMode;
  attendanceFeedback: AttendanceFeedback | null;
  gradeFeedback: GradeFeedback | null;
  theme?: 'dark' | 'light';
  onOpenDetail: () => void;
}

export const ScanFeedbackBanner: React.FC<ScanFeedbackBannerProps> = ({
  scanMode,
  attendanceFeedback,
  gradeFeedback,
  theme = 'dark',
  onOpenDetail,
}) => {
  const isDark = theme === 'dark';

  if (scanMode === 'attendance' && attendanceFeedback) {
    if (isDark) {
      return (
        <div className="w-full bg-[#131E3A]/95 border border-slate-700/90 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-xl animate-fade-in">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
              <Check size={20} strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm sm:text-base truncate">
                  ¡Pase de Lista Exitoso!
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2 py-0.5 rounded-md shrink-0">
                  +{attendanceFeedback.points} Pts
                </span>
              </div>
              <div className="text-slate-300 text-xs font-semibold truncate mt-0.5">
                <strong className="text-white font-bold">{attendanceFeedback.name}</strong> • #{attendanceFeedback.enrollment} • {attendanceFeedback.time}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDetail}
            className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <History size={15} />
            <span>Ver Detalle</span>
          </button>
        </div>
      );
    }

    // Light theme for USB View
    return (
      <div className="w-full bg-[#ecfdf5] border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-2xs animate-fade-in">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
            <User size={22} className="stroke-[2.5]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-900 font-black text-sm sm:text-base truncate">
                {attendanceFeedback.name}
              </span>
              <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                • {attendanceFeedback.statusText}
              </span>
              <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                +{attendanceFeedback.points} Pts
              </span>
            </div>
            <div className="text-slate-600 text-xs font-bold truncate mt-0.5">
              Matrícula: <strong className="text-slate-800">#{attendanceFeedback.enrollment}</strong> • Hora de entrada: <strong className="text-slate-800">{attendanceFeedback.time}</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDetail}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs transition-all shrink-0 cursor-pointer"
        >
          <History size={15} />
          <span>Ver Detalle</span>
        </button>
      </div>
    );
  }

  if (scanMode === 'grades' && gradeFeedback) {
    if (isDark) {
      return (
        <div className="w-full bg-[#131E3A]/95 border border-slate-700/90 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-xl animate-fade-in">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
              <Check size={20} strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm sm:text-base truncate">
                  ¡Calificación Guardada!
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2 py-0.5 rounded-md shrink-0">
                  {gradeFeedback.score} Pts
                </span>
              </div>
              <div className="text-slate-300 text-xs font-semibold truncate mt-0.5">
                <strong className="text-white font-bold">{gradeFeedback.name}</strong> • #{gradeFeedback.enrollment} • {gradeFeedback.time}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDetail}
            className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <History size={15} />
            <span>Ver Detalle</span>
          </button>
        </div>
      );
    }

    // Light theme for USB View
    return (
      <div className="w-full bg-[#ecfdf5] border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-2xs animate-fade-in">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ClipboardCheck size={22} className="stroke-[2.5]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-900 font-black text-sm sm:text-base truncate">
                {gradeFeedback.name}
              </span>
              <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                • {gradeFeedback.action}
              </span>
              <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                Nota: {gradeFeedback.score} pts
              </span>
            </div>
            <div className="text-slate-600 text-xs font-bold truncate mt-0.5">
              Matrícula: <strong className="text-slate-800">#{gradeFeedback.enrollment}</strong> • Hora: <strong className="text-slate-800">{gradeFeedback.time}</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDetail}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs transition-all shrink-0 cursor-pointer"
        >
          <History size={15} />
          <span>Ver Detalle</span>
        </button>
      </div>
    );
  }

  return null;
};

export default ScanFeedbackBanner;
