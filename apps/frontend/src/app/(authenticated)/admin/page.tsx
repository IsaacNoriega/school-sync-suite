import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import AdminClientView from '@/components/admin/AdminClientView';

export const metadata: Metadata = {
  title: 'Panel Administrativo de Maestros | EducaQR',
  description: 'Gestión centralizada de cuentas docentes, ciclo escolar, asignaturas y credenciales institucionales.',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16 select-none font-sans">
      {/* 1. Header de Navegación Principal */}
      <EducaNavbar activeTab="admin" />

      {/* 2. Vista Cliente de Administración */}
      <AdminClientView />
    </div>
  );
}
