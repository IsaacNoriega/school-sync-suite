import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Sync Suite - Automatización Escolar',
  description: 'Control académico en tiempo real con escaneo QR',
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
