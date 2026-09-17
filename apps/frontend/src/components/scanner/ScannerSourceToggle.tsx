import React from 'react';
import { Camera, ScanLine } from 'lucide-react';
import { InputSource } from './types';

interface ScannerSourceToggleProps {
  inputSource: InputSource;
  onSourceChange: (source: InputSource) => void;
}

export const ScannerSourceToggle: React.FC<ScannerSourceToggleProps> = ({
  inputSource,
  onSourceChange,
}) => {
  return (
    <div className="flex justify-center my-2">
      <div className="inline-flex items-center bg-white p-1.5 rounded-full border border-slate-200/90 shadow-2xs gap-1.5">
        {/* Botón Cámara Web HD */}
        <button
          type="button"
          onClick={() => onSourceChange('camera')}
          className={`px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            inputSource === 'camera'
              ? 'bg-[#0284c7] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-transparent'
          }`}
        >
          <Camera size={16} className="stroke-[2.5]" />
          <span>Cámara Web HD</span>
          {inputSource === 'camera' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
          )}
        </button>

        {/* Botón Lector USB Físico */}
        <button
          type="button"
          onClick={() => onSourceChange('external')}
          className={`px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            inputSource === 'external'
              ? 'bg-[#0284c7] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-transparent'
          }`}
        >
          <ScanLine size={16} className="stroke-[2.5]" />
          <span>Lector USB Físico</span>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              inputSource === 'external'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            Plug & Play
          </span>
        </button>
      </div>
    </div>
  );
};

export default ScannerSourceToggle;
