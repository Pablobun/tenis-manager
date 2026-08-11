'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.role === 'admin') router.push('/admin');
        else if (user.role === 'profesor') router.push('/tablero');
        else router.push('/mis-clases');
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary-600 mb-2">Riverside Tenis</h1>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </main>
  );
}
