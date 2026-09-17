import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import StudentsDirectoryClientView from '@/components/students/StudentsDirectoryClientView';

export const metadata: Metadata = {
  title: 'Directorio de Alumnos | EducaQR',
  description: 'Directorio general de alumnos, emisión de credenciales y gestión de expedientes escolares.',
};

export default function StudentsDirectoryPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 select-none font-sans">
      {/* 1. Header de Navegación Principal */}
      <EducaNavbar activeTab="students" />

      {/* 2. Vista Cliente de Directorio con Filtros y Paginación */}
      <StudentsDirectoryClientView />
    </div>
  );
}
