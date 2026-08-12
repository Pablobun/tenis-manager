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

interface OpenClass {
  id: number;
  template_id: number;
  profesor_id: number;
  instance_date: string;
  start_hour: string;
  end_hour: string;
  level: string;
  modality: string;
  max_students: number;
  price: string;
  status: string;
  professor_name: string;
  enrolled_count: number;
  postulation_status: string | null;
}

export default function MisClasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [openClasses, setOpenClasses] = useState<OpenClass[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
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
    if (user) {
      fetchProfile();
      fetchOpenClasses();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
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

  const fetchOpenClasses = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setOpenClasses(data);
      }
    } catch (err) {
      console.error('Error fetching open classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handlePostulate = async (classId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open/${classId}/postulate`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al postularse');
        return;
      }
      alert('¡Postulación enviada correctamente!');
      fetchOpenClasses();
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
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
                  <p className="mt-1 capitalize">{profile.level || 'Sin nivel asignado'}</p>
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

        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Clases Disponibles</h2>
          <p className="text-sm text-gray-500 mb-4">
            Clases abiertas y rotativas para las que podés postularte.
          </p>

          {loadingClasses ? (
            <p className="text-gray-500">Cargando clases disponibles...</p>
          ) : openClasses.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <p className="text-gray-500">No hay clases abiertas disponibles por ahora.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {openClasses.map((c) => {
                const dateStr = c.instance_date.split('T')[0];
                const d = new Date(`${dateStr}T12:00:00`);
                const label = d.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                });
                const capitalizedLabel = `${label[0].toUpperCase()}${label.slice(1)}`;
                const full = c.enrolled_count >= c.max_students;
                const pending = c.postulation_status === 'pendiente';
                const enrolled = c.postulation_status === 'aceptada' || c.postulation_status === 'lista_espera';

                return (
                  <div
                    key={c.id}
                    className={`bg-white shadow-md rounded-lg p-5 border-l-4 ${
                      full ? 'border-red-500' : 'border-primary-500'
                    }`}
                  >
                    <h4 className="font-bold text-gray-800 capitalize">{capitalizedLabel}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {c.start_hour.slice(0, 5)} - {c.end_hour.slice(0, 5)} · Nivel{' '}
                      <span className="capitalize">{c.level}</span>
                    </p>
                    <p className="text-sm text-gray-600">Profesor: {c.professor_name}</p>
                    <p className="text-sm text-gray-600">Precio: ${c.price}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-sm font-medium ${full ? 'text-red-600' : 'text-gray-700'}`}>
                        Cupo: {c.enrolled_count}/{c.max_students}
                      </span>
                      {pending ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800">
                          Postulado (Pendiente)
                        </span>
                      ) : enrolled ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800">
                          Inscripto
                        </span>
                      ) : full ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                          Lleno
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePostulate(c.id)}
                          className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700"
                        >
                          Postularme
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
