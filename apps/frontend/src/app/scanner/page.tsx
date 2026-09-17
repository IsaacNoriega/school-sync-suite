import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Escaner QR en Tiempo Real | EducaQR',
  description: 'Control de asistencia y registro de calificaciones mediante escaneo de credenciales QR y lector USB en tiempo real.',
};

const ScannerClientView = dynamic(
  () => import('@/components/scanner/ScannerClientView'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
        <div className="w-full bg-slate-800/95 sticky top-0 z-50 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="h-10 w-36 bg-slate-700 rounded-2xl animate-pulse" />
            <div className="flex items-center gap-1.5 bg-slate-700/60 p-1.5 rounded-full">
              <div className="h-8 w-24 bg-slate-700 rounded-full animate-pulse" />
              <div className="h-8 w-20 bg-slate-700 rounded-full animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse" />
          </div>
        </div>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
              <div className="h-10 w-36 bg-slate-700 rounded-2xl animate-pulse" />
              <div className="h-10 w-36 bg-slate-700 rounded-2xl animate-pulse" />
            </div>
            <div className="bg-slate-800 rounded-3xl aspect-video animate-pulse relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-sky-500/40 rounded-tl-xl" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-sky-500/40 rounded-tr-xl" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-sky-500/40 rounded-bl-xl" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-sky-500/40 rounded-br-xl" />
            </div>
            <div className="h-14 w-full bg-slate-700 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-40 bg-slate-700 rounded-full animate-pulse" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-slate-700 rounded-full animate-pulse" />
                  <div className="h-3 w-20 bg-slate-700 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    ),
  }
);

export default function ScannerPage() {
  return (
    <Suspense>
      <ScannerClientView />
    </Suspense>
  );
}