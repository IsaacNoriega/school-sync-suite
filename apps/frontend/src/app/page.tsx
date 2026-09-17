import type { Metadata } from 'next';
import AuthRedirect from '@/components/auth/AuthRedirect';

export const metadata: Metadata = {
  title: 'EducaQR - Control Académico Inteligente',
  description: 'Control y seguimiento académico en tiempo real con escaneo QR',
};

export default function RootPage() {
  return <AuthRedirect />;
}
