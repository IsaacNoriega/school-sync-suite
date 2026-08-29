import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EducaQR - Control Académico Inteligente',
  description: 'Control académico en tiempo real con escaneo QR',
  icons: {
    icon: '/logo-circle.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
