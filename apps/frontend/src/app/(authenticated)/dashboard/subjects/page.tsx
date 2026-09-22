import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import SubjectsGridView from '@/components/subjects/SubjectsGridView';

export const metadata: Metadata = {
  title: 'Mis Asignaturas | EducaQR',
  description: 'Vista general y gestión de asignaturas escolares.',
};

export default function DashboardSubjectsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 select-none font-sans">
      {/* Header de Navegación Principal */}
      <EducaNavbar activeTab="subjects" />

      {/* Nivel 1: Cuadrícula interactiva de materias */}
      <main>
        <SubjectsGridView basePath="/dashboard/subjects" />
      </main>
    </div>
  );
}
