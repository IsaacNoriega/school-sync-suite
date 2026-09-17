import React from 'react';
import { Camera, Zap, RotateCcw } from 'lucide-react';
import { ScanMode, AttendanceFeedback, GradeFeedback } from './types';
import ScanFeedbackBanner from './ScanFeedbackBanner';

interface ScannerCameraViewProps {
  cameraContainerRef?: React.Ref<HTMLDivElement>;
  cameraReady: boolean;
  isCooldown: boolean;
  cooldownRemaining: number;
  isTorchOn: boolean;
  onToggleTorch: () => void;
  onSwitchCamera: () => void;
  scanMode: ScanMode;
  attendanceFeedback: AttendanceFeedback | null;
  gradeFeedback: GradeFeedback | null;
  onOpenDetail: () => void;
}

export const ScannerCameraView: React.FC<ScannerCameraViewProps> = ({
  cameraContainerRef,
  cameraReady,
  isCooldown,
  cooldownRemaining,
  isTorchOn,
  onToggleTorch,
  onSwitchCamera,
  scanMode,
  attendanceFeedback,
  gradeFeedback,
  onOpenDetail,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div
        ref={cameraContainerRef}
        className="bg-black rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden w-full"
      >
        {/* VIDEO DE LA CÁMARA: Dicta la altura exacta del contenedor sin espacio sobrante */}
        <div
          id="html5-reader"
          className={`w-full overflow-hidden rounded-[32px] [&_video]:!w-full [&_video]:!h-auto [&_video]:!block [&_video]:object-cover [&_span]:hidden [&_img]:hidden [&_button]:hidden [&_div]:!border-0 [&_#qr-shaded-region]:!hidden ${
            !cameraReady ? 'aspect-video bg-slate-950' : ''
          }`}
        />

        {/* Loading overlay si la cámara aún está iniciando */}
        {!cameraReady && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-500 z-20 pointer-events-none">
            <Camera className="w-10 h-10 stroke-[1.5] animate-pulse text-sky-400" />
            <span className="text-xs font-semibold text-slate-400">Iniciando cámara HD...</span>
          </div>
        )}

        {/* Capa de interfaz superpuesta directamente sobre el video */}
        <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-10">
          {/* Fila Superior interna del Visor */}
          <div className="w-full flex items-center justify-between pointer-events-auto">
            {/* Badge Escáner Activo */}
            <div className="bg-slate-900/85 border border-slate-700/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCooldown ? 'bg-amber-400' : 'bg-[#84cc16] animate-pulse'
                }`}
              />
              <span className="text-[11px] sm:text-xs">
                {isCooldown
                  ? `Pausa activa (${cooldownRemaining}s)`
                  : 'Escáner Activo • Detección Automática de QR'}
              </span>
            </div>

            {/* Botones de Control de Cámara */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleTorch}
                title="Linterna"
                className={`w-9 h-9 rounded-full border border-slate-700/80 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                  isTorchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-white'
                }`}
              >
                <Zap size={16} className={isTorchOn ? 'fill-current' : ''} />
              </button>

              <button
                type="button"
                onClick={onSwitchCamera}
                title="Cambiar Cámara"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Recuadro / Framer de captura dentro de la cámara (Centrado dinámico) */}
          <div className="flex-1 flex items-center justify-center my-2 pointer-events-none">
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 flex items-center justify-center">
              <div className="w-full h-full rounded-3xl border-2 border-white/40 relative">
                {/* 4 Esquinas destacadas del framer */}
                <div className="absolute -top-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-l-4 border-sky-400 rounded-tl-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                <div className="absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-r-4 border-sky-400 rounded-tr-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                <div className="absolute -bottom-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-l-4 border-sky-400 rounded-bl-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-r-4 border-sky-400 rounded-br-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
              </div>
            </div>
          </div>

          {/* Banner Inferior: Solo visible cuando hay un escaneo activo en la sesión */}
          <div className="w-full pointer-events-auto">
            <ScanFeedbackBanner
              scanMode={scanMode}
              attendanceFeedback={attendanceFeedback}
              gradeFeedback={gradeFeedback}
              theme="dark"
              onOpenDetail={onOpenDetail}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerCameraView;
