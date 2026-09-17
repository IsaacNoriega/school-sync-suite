import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import DashboardClientView from '@/components/dashboard/DashboardClientView';

export const metadata: Metadata = {
  title: 'Pase de Lista y Dashboard | EducaQR',
  description: 'Control y seguimiento académico en tiempo real con escaneo QR',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16 select-none font-sans">
      {/* 1. Header de navegación */}
      <EducaNavbar activeTab="dashboard" />

      {/* 2. Vista interactiva cliente */}
      <DashboardClientView />
    </div>
  );
}
