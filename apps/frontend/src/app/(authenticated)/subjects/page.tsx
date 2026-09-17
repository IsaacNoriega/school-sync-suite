import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import SubjectsClientView from '@/components/subjects/SubjectsClientView';

export const metadata: Metadata = {
  title: 'Gestión de Materias y Tareas | EducaQR',
  description: 'Planifica tus lecciones, administra hojas de examen y califica con códigos QR al instante.',
};

export default function SubjectsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 select-none font-sans">
      {/* 1. Header de Navegación Principal */}
      <EducaNavbar activeTab="subjects" />

      {/* 2. Vista interactiva de materias y tareas */}
      <SubjectsClientView />
    </div>
  );
}
