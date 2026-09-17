import type { Metadata } from 'next';
import Image from 'next/image';
import { QrCode, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | EducaQR',
  description: 'Ingresa a tu panel de control escolar y gestión académica con escaneo QR.',
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#f8fafc] flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 overflow-x-hidden select-none">
      {/* Luces decorativas de fondo (ambient glow) */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-1/4 -right-40 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl opacity-70" />

      {/* CONTENEDOR CENTRAL: TARJETA DE LOGIN */}
      <section className="relative z-10 w-full flex justify-center items-center py-6 my-auto">
        <Card className="w-full max-w-md p-8 sm:p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center">
          {/* Logotipo Oficial Optimizado */}
          <div className="mb-4 flex items-center justify-center">
            <Image
              src="/logo-circle.png"
              alt="EducaQR Logo"
              width={80}
              height={80}
              priority
              className="w-20 h-20 rounded-full object-contain shadow-xs border border-slate-100"
            />
          </div>

          {/* Pill superior con símbolos matemáticos y glifo QR */}
          <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-100 rounded-full mb-6">
            <Badge
              isCircle
              color="bg-rose-100 text-rose-700 text-xs font-bold w-6 h-6 min-w-[1.5rem] min-h-[1.5rem]"
            >
              +
            </Badge>
            <Badge
              isCircle
              color="bg-amber-100 text-amber-800 text-xs font-bold w-6 h-6 min-w-[1.5rem] min-h-[1.5rem]"
            >
              −
            </Badge>
            <Badge
              isCircle
              color="bg-emerald-100 text-emerald-800 text-xs font-bold w-6 h-6 min-w-[1.5rem] min-h-[1.5rem]"
            >
              ×
            </Badge>
            <Badge
              isCircle
              color="bg-sky-100 text-sky-800 text-xs font-bold w-6 h-6 min-w-[1.5rem] min-h-[1.5rem]"
            >
              ÷
            </Badge>
            <div className="w-[1px] h-3.5 bg-slate-200 mx-1" />
            <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
          </div>

          {/* Logotipo y Título de Bienvenida */}
          <div className="text-center mb-7">
            <h2 className="text-2xl font-black text-sky-500 tracking-tight flex items-center justify-center gap-1">
              Educa<span className="text-sky-600 font-extrabold">QR</span>
            </h2>
            <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              ¡Hola de nuevo!
            </h1>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Ingresa a tu panel de gestión escolar.
            </p>
          </div>

          {/* Formulario Cliente */}
          <LoginForm />
        </Card>
      </section>

      {/* FOOTER INFERIOR */}
      <footer className="relative z-10 w-full py-3 flex items-center justify-center gap-2 text-xs text-slate-600 font-medium text-center flex-wrap">
        <Headphones className="w-4 h-4 text-slate-500" />
        <span>Soporte Técnico EducaQR</span>
        <span>•</span>
        <span>v2.4</span>
      </footer>
    </main>
  );
}
