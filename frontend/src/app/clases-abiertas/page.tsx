'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
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
}

const LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' }
];

const EMPTY_FORM = {
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  nivel: 'intermedio',
  cupo_maximo: '4',
  price: ''
};

export default function ClasesAbiertasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<OpenClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<OpenClass | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin' && parsed.role !== 'profesor') {
      router.push('/dashboard');
      return;
    }
    setUser(parsed);
  }, [router]);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al cargar clases abiertas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchClasses();
  }, [user, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (form.hora_inicio >= form.hora_fin) {
      setError('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    const body = {
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      nivel: form.nivel,
      cupo_maximo: Number(form.cupo_maximo),
      precio: Number(form.price)
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const url = editingClass
        ? `${apiUrl}/api/instances/open/${editingClass.id}`
        : `${apiUrl}/api/instances/open`;
      const method = editingClass ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        return;
      }

      setInfo(editingClass ? 'Clase actualizada con éxito' : 'Clase creada con éxito');
      setShowForm(false);
      setEditingClass(null);
      setForm(EMPTY_FORM);
      fetchClasses();
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleEdit = (c: OpenClass) => {
    setEditingClass(c);
    // YYYY-MM-DD
    const dateStr = c.instance_date.split('T')[0];
    setForm({
      fecha: dateStr,
      hora_inicio: c.start_hour.slice(0, 5),
      hora_fin: c.end_hour.slice(0, 5),
      nivel: c.level,
      cupo_maximo: String(c.max_students),
      price: c.price
    });
    setShowForm(true);
  };

  const handleDelete = async (classId: number) => {
    if (!confirm('¿Seguro que querés eliminar esta clase abierta?')) return;
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open/${classId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al eliminar');
        return;
      }
      setInfo('Clase abierta eliminada correctamente');
      fetchClasses();
    } catch (err) {
      setError('Error de conexión');
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
          <h1 className="text-xl font-bold text-primary-600">Riverside Tenis</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">Clases Abiertas / Rotativas</h2>
            <p className="text-sm text-gray-500">Clases de una sola fecha donde los alumnos se postulan libremente</p>
          </div>
          <button
            onClick={() => {
              setEditingClass(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
          >
            + Nueva Clase Abierta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{info}</div>
        )}

        {showForm && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">
              {editingClass ? 'Editar Clase Abierta' : 'Nueva Clase Abierta'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel sugerido</label>
                  <select
                    value={form.nivel}
                    onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                  <input
                    type="time"
                    value={form.hora_fin}
                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cupo máximo de alumnos</label>
                  <input
                    type="number"
                    min="1"
                    value={form.cupo_maximo}
                    onChange={(e) => setForm({ ...form, cupo_maximo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  {editingClass ? 'Guardar Cambios' : 'Crear Clase Abierta'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClass(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando clases abiertas...</p>
        ) : classes.length === 0 ? (
          <p className="text-gray-500">No hay clases abiertas registradas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map((c) => {
              const d = new Date(`${c.instance_date.split('T')[0]}T12:00:00`);
              const label = d.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              });
              const capitalizedLabel = `${label[0].toUpperCase()}${label.slice(1)}`;

              return (
                <div key={c.id} className="bg-white shadow-md rounded-lg p-5 border-l-4 border-primary-500 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 capitalize">{capitalizedLabel}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.status === 'cancelada' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                        {c.status === 'cancelada' ? 'Cancelada' : 'Programada'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Horario: {c.start_hour.slice(0, 5)} - {c.end_hour.slice(0, 5)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">Nivel: {c.level}</p>
                    <p className="text-sm text-gray-600">Precio: ${c.price}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-2">
                      Cupo: {c.enrolled_count}/{c.max_students} alumnos inscriptos
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 justify-end">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-semibold px-3 py-1 rounded hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1 rounded hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
