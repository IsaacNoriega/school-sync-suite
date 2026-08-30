import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
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
          <Toaster 
            position="top-center" 
            reverseOrder={false}
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-outfit), sans-serif',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)'
              }
            }}
          />
        </SecurityProvider>
      </body>
    </html>
  );
}
