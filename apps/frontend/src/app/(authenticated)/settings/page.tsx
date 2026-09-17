import type { Metadata } from 'next';
import EducaNavbar from '@/components/EducaNavbar';
import SettingsClientView from '@/components/settings/SettingsClientView';

export const metadata: Metadata = {
  title: 'Configuración y Ajustes | EducaQR',
  description: 'Gestiona tu perfil docente, contraseña y preferencias del escáner QR.',
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 select-none font-sans">
      {/* 1. Header de Navegación Principal */}
      <EducaNavbar activeTab="settings" />

      {/* 2. Vista de Configuración */}
      <SettingsClientView />
    </div>
  );
}
