'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(parsed);
  }, [router]);

  if (!user) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Riverside Tenis - Admin" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Panel de Administración</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <a
            href="/tablero"
            className="card card-hover card-accent border-l-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Tablero</h3>
            <p className="text-sm text-gray-500">Vista diaria y semanal de clases y alumnos</p>
          </a>

          <a
            href="/plantillas"
            className="card card-hover card-accent border-l-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Plantillas</h3>
            <p className="text-sm text-gray-500">Gestión de clases recurrentes</p>
          </a>

          <a
            href="/instancias"
            className="card card-hover card-accent border-l-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Instancias</h3>
            <p className="text-sm text-gray-500">Generación y control mensual</p>
          </a>

          <a
            href="/clases-abiertas"
            className="card card-hover card-accent border-l-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Clases Abiertas</h3>
            <p className="text-sm text-gray-500">Creación y control de clases rotativas</p>
          </a>

          <a
            href="/alumnos"
            className="card card-hover card-accent border-l-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Alumnos</h3>
            <p className="text-sm text-gray-500">Gestión de alumnos y perfiles</p>
          </a>

          <a
            href="/facturacion"
            className="card card-hover card-accent border-l-emerald-500"
          >
            <h3 className="font-bold text-lg mb-1">Facturación</h3>
            <p className="text-sm text-gray-500">Deuda mensual de clases fijas</p>
          </a>

          <a
            href="/pagos"
            className="card card-hover card-accent border-l-amber-500"
          >
            <h3 className="font-bold text-lg mb-1">Pagos</h3>
            <p className="text-sm text-gray-500">Registro individual y por lote</p>
          </a>
        </div>
      </div>
    </main>
  );
}
