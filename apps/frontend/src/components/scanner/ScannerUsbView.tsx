import React from 'react';
import {
  ScanLine,
  MoreHorizontal,
  User,
  QrCode,
  Barcode,
  Clock,
  Check,
} from 'lucide-react';
import { ScanMode, AttendanceFeedback, GradeFeedback } from './types';
import ScanFeedbackBanner from './ScanFeedbackBanner';

interface ScannerUsbViewProps {
  isCooldown: boolean;
  cooldownRemaining: number;
  lastScannedCode: string;
  lastScannedSecondsAgo: number | null;
  onCodeChange: (code: string) => void;
  onSubmitScan: (code: string) => void;
  scanMode: ScanMode;
  attendanceFeedback: AttendanceFeedback | null;
  gradeFeedback: GradeFeedback | null;
  onOpenDetail: () => void;
}

export const ScannerUsbView: React.FC<ScannerUsbViewProps> = ({
  isCooldown,
  cooldownRemaining,
  lastScannedCode,
  lastScannedSecondsAgo,
  onCodeChange,
  onSubmitScan,
  scanMode,
  attendanceFeedback,
  gradeFeedback,
  onOpenDetail,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Encabezado del Lector USB */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] border border-emerald-200/80 text-[#15803d] flex items-center justify-center shrink-0 shadow-2xs">
              <ScanLine size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Lector Óptico USB Conectado y Listo
                </h2>
                <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                  Plug & Play Reconocido
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Modo HID Emulación Teclado USB • Entrada continua sin retraso
              </p>
            </div>
          </div>

          <button
            type="button"
            className="text-slate-300 hover:text-slate-600 p-1 cursor-pointer"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Cuerpo en Dos Columnas: Ilustración + Zona de Entrada Continua */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Columna Izquierda: Ilustración de Credencial y Pistola Escáner */}
          <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
            {/* Ilustración Gráfica */}
            <div className="relative flex items-center justify-center w-full py-3">
              {/* Tarjeta / Credencial */}
              <div className="w-24 h-32 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-2 flex flex-col items-center justify-between relative">
                {/* Avatar del Alumno en la credencial */}
                <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mt-1">
                  <User size={18} className="stroke-[2.5]" />
                </div>

                {/* Líneas de datos */}
                <div className="w-full space-y-1 px-1">
                  <div className="w-full h-1 bg-slate-200 rounded-full" />
                  <div className="w-2/3 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Código QR en credencial */}
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center p-1 mb-1">
                  <QrCode size={20} />
                </div>

                {/* Haz de Láser Rojo que escanea la credencial */}
                <div className="absolute -left-8 right-0 top-1/2 -translate-y-1/2 h-1 bg-rose-500 shadow-[0_0_12px_#f43f5e] z-10" />
              </div>

              {/* Pistola Escáner USB */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-12 h-10 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center text-sky-400 shadow-md">
                  <Barcode size={22} className="stroke-[2.2]" />
                </div>
              </div>
            </div>

            {/* Texto de instrucción bajo la ilustración */}
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                Apunta el lector a la credencial física
              </h3>
              <p className="text-[11px] text-slate-500 font-medium max-w-[240px] mx-auto mt-0.5 leading-tight">
                Reconocimiento instantáneo por disparo o gatillo óptico
              </p>
            </div>
          </div>

          {/* Columna Derecha: Zona de Entrada Continua con Autofocus */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 tracking-wider uppercase">
                Zona de Entrada Continua (Autofocus Activo)
              </span>
              {isCooldown ? (
                <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-600 animate-spin" />
                  Pausa activa ({cooldownRemaining}s)
                </span>
              ) : (
                <span className="text-xs font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Listo para disparar
                </span>
              )}
            </div>

            {/* Input Box Grande con Borde Neón Sky */}
            <div className="w-full bg-white border-2 border-sky-400 rounded-2xl p-3.5 px-4 flex items-center justify-between shadow-[0_0_15px_rgba(56,189,248,0.2)] focus-within:ring-2 focus-within:ring-sky-400/40 transition-all">
              <div className="text-sky-500 shrink-0">
                <ScanLine size={20} className="stroke-[2.5]" />
              </div>

              <input
                type="text"
                autoFocus
                value={lastScannedCode}
                onChange={(e) => onCodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && lastScannedCode.trim()) {
                    onSubmitScan(lastScannedCode);
                  }
                }}
                placeholder="Esperando lectura de credencial..."
                className="w-full bg-transparent font-mono font-black text-sm sm:text-base text-slate-800 tracking-wider px-3 focus:outline-none placeholder:text-slate-300"
              />

              <div className="w-7 h-7 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={16} strokeWidth={3} />
              </div>
            </div>

            {/* Indicador de último código decodificado */}
            {lastScannedCode && lastScannedSecondsAgo !== null && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#15803d] pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                <span>
                  Último código decodificado hace {lastScannedSecondsAgo} segundos • Registro sincronizado con éxito
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Banner Inferior: Solo visible cuando hay un escaneo activo en la sesión */}
        <ScanFeedbackBanner
          scanMode={scanMode}
          attendanceFeedback={attendanceFeedback}
          gradeFeedback={gradeFeedback}
          theme="light"
          onOpenDetail={onOpenDetail}
        />
      </div>
    </div>
  );
};

export default ScannerUsbView;
