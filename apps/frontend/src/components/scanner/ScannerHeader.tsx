import React from 'react';
import { SlidersHorizontal, ClipboardCheck } from 'lucide-react';
import { ScanMode } from './types';

interface ScannerHeaderProps {
  scanMode: ScanMode;
  onScanModeChange: (mode: ScanMode) => void;
}

export const ScannerHeader: React.FC<ScannerHeaderProps> = ({
  scanMode,
  onScanModeChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Escáner QR
        </h1>

        {/* Selector de Modo: Pase de Lista vs Calificar Tarea */}
        <div className="inline-flex bg-slate-100 p-1 rounded-full border border-slate-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => onScanModeChange('attendance')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              scanMode === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-slate-900 bg-transparent'
            }`}
          >
            <SlidersHorizontal
              size={15}
              className={scanMode === 'attendance' ? 'text-sky-600' : 'text-slate-400'}
            />
            <span>Pase de Lista</span>
          </button>

          <button
            type="button"
            onClick={() => onScanModeChange('grades')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              scanMode === 'grades'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-slate-900 bg-transparent'
            }`}
          >
            <ClipboardCheck
              size={15}
              className={scanMode === 'grades' ? 'text-amber-500' : 'text-slate-400'}
            />
            <span>Calificar Tarea</span>
          </button>
        </div>
      </div>

      {/* Badges de Hardware Status */}
      <div className="flex items-center gap-2.5">
        <div className="bg-white border border-slate-200/80 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span>Cámara HD • Lector USB Listo</span>
        </div>
      </div>
    </div>
  );
};

export default ScannerHeader;
