import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import SubjectWorkspaceView from '@/components/subjects/SubjectWorkspaceView';

export interface DashboardSubjectDetailPageProps {
  params: {
    subjectId: string;
  };
}

export const metadata: Metadata = {
  title: 'Espacio de Trabajo de Materia | EducaQR',
  description: 'Gestión y calificación de tareas evaluativas de la asignatura.',
};

export default function DashboardSubjectDetailPage({
  params,
}: DashboardSubjectDetailPageProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 select-none font-sans">
      {/* Header de Navegación Principal */}
      <EducaNavbar activeTab="subjects" />

      {/* Nivel 2: Espacio de Trabajo Aislado de la Materia */}
      <main>
        <SubjectWorkspaceView
          subjectId={params.subjectId}
          basePath="/dashboard/subjects"
        />
      </main>
    </div>
  );
}
