import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import SecurityProvider from '@/components/SecurityProvider';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

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
    <html lang="es" className={outfit.variable}>
      <body>
        <SecurityProvider>
          {children}
        </SecurityProvider>
      </body>
    </html>
  );
}
