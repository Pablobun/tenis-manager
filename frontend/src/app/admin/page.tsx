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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tenis-manager.onrender.com';
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
          <h1 className="text-xl font-bold text-primary-600">Panel Admin</h1>
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
        <h2 className="text-lg font-semibold mb-4">Panel de Administración</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/alumnos"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-lg mb-2">Alumnos</h3>
            <p className="text-sm text-gray-500">Gestionar perfiles de alumnos</p>
          </a>
          <a
            href="/plantillas"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-lg mb-2">Plantillas de Clases</h3>
            <p className="text-sm text-gray-500">Crear y gestionar clases recurrentes</p>
          </a>
        </div>
      </div>
    </main>
  );
}
