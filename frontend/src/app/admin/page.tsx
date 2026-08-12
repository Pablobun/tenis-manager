'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">Riverside Tenis - Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Panel de Administración</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <a
            href="/tablero"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Tablero</h3>
            <p className="text-sm text-gray-500">Vista diaria y semanal de clases y alumnos</p>
          </a>

          <a
            href="/plantillas"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Plantillas</h3>
            <p className="text-sm text-gray-500">Gestión de clases recurrentes</p>
          </a>

          <a
            href="/instancias"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Instancias</h3>
            <p className="text-sm text-gray-500">Generación y control mensual</p>
          </a>

          <a
            href="/clases-abiertas"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Clases Abiertas</h3>
            <p className="text-sm text-gray-500">Creación y control de clases rotativas</p>
          </a>

          <a
            href="/alumnos"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-primary-500"
          >
            <h3 className="font-bold text-lg mb-1">Alumnos</h3>
            <p className="text-sm text-gray-500">Gestión de alumnos y perfiles</p>
          </a>
        </div>
      </div>
    </main>
  );
}
