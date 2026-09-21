import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import AttendanceHistoryView from '@/components/attendance/AttendanceHistoryView';

export const metadata: Metadata = {
  title: 'Historial y Sábana de Asistencias | EducaQR',
  description:
    'Control y auditoría del pase de lista diario, reporte de asistencia mensual y exportación a Excel.',
};

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 select-none font-sans">
      {/* 1. Header de Navegación Principal */}
      <EducaNavbar activeTab="attendance" />

      {/* 2. Contenedor Principal de la Vista de Historial */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 mt-6">
        <AttendanceHistoryView isModal={false} />
      </main>
    </div>
  );
}
