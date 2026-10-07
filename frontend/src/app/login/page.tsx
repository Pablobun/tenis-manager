'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));

      switch (data.user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'profesor':
          router.push('/tablero');
          break;
        case 'alumno':
          router.push('/mis-clases');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cal">
      {/* Placa polvo a sangre con wordmark condensado */}
      <div className="bg-polvo court-line px-4 pt-12 pb-14 text-center">
        <div className="inline-flex mb-4">
          <Image
            src="/logo.jpeg"
            alt="Riverside Tenis"
            width={64}
            height={64}
            priority
            className="w-16 h-16 rounded-2xl object-cover"
          />
        </div>
        <h1 className="font-display text-white text-4xl font-bold uppercase tracking-wide">
          Riverside Tenis
        </h1>
        <p className="text-white text-sm mt-2">Sistema de gestión de clases</p>
      </div>

      <div className="w-full max-w-sm mx-auto px-4 -mt-8">
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 shadow-md">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold">Iniciar sesión</h2>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
