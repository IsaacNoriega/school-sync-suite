import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import StudentsClientView from '@/components/students/StudentsClientView';

export const metadata: Metadata = {
  title: 'Registro de Alumnos y Credenciales QR | EducaQR',
  description: 'Alta rápida de expediente escolar y emisión de credencial QR en tiempo real.',
};

export default function StudentsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 select-none font-sans print:bg-white print:p-0 print:m-0 print:pb-0">
      {/* 1. Header de Navegación Principal */}
      <EducaNavbar activeTab="students" />

      {/* 2. Contenedor Interactivo de Alumnos */}
      <StudentsClientView />
    </div>
  );
}
