'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Profile {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  level: string | null;
}

export default function MisClasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tenis-manager.onrender.com';
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({ full_name: data.full_name, phone: data.phone || '' });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tenis-manager.onrender.com';
      const res = await fetch(`${apiUrl}/api/students/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setMessage('Perfil actualizado correctamente');
        setEditing(false);
        fetchProfile();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Error al actualizar');
      }
    } catch (err) {
      setMessage('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-xl font-bold text-primary-600">Mis Clases</h1>
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
        <h2 className="text-lg font-semibold mb-4">Mi Perfil</h2>
        
        {loading ? (
          <p className="text-gray-500">Cargando perfil...</p>
        ) : profile ? (
          <div className="bg-white shadow-md rounded-lg p-6">
            {message && (
              <div className={`p-3 rounded text-sm mb-4 ${message.includes('correctamente') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {message}
              </div>
            )}
            
            {!editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="mt-1">{profile.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="mt-1">{profile.phone || 'No registrado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nivel</label>
                  <p className="mt-1">{profile.level || 'Sin nivel asignado'}</p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Editar Perfil
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setForm({ full_name: profile.full_name, phone: profile.phone || '' });
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No se pudo cargar el perfil</p>
        )}
      </div>
    </main>
  );
}
