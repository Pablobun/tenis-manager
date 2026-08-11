'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Template {
  id: number;
  professor_id: number;
  day_of_week: number;
  start_hour: string;
  end_hour: string;
  level: string | null;
  modality: string;
  max_students: number;
  price_per_class: string;
  frequency: number;
  is_active: number;
  created_at: string;
}

const DAYS: { value: number; label: string }[] = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' }
];

const MODALITIES = [
  { value: 'fixed', label: 'Fija' },
  { value: 'extra', label: 'Extra' },
  { value: 'open', label: 'Abierta' }
];

const LEVELS = [
  { value: '', label: 'Sin nivel' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' }
];

const EMPTY_FORM = {
  day_of_week: '0',
  start_hour: '',
  end_hour: '',
  level: '',
  modality: 'fixed',
  max_students: '4',
  price_per_class: '',
  frequency: '1'
};

export default function PlantillasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (user) fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/templates`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const body = {
      day_of_week: Number(form.day_of_week),
      start_hour: form.start_hour,
      end_hour: form.end_hour,
      level: form.level || null,
      modality: form.modality,
      max_students: Number(form.max_students),
      price_per_class: Number(form.price_per_class),
      frequency: Number(form.frequency)
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const url = editingTemplate
        ? `${apiUrl}/api/templates/${editingTemplate.id}`
        : `${apiUrl}/api/templates`;
      const method = editingTemplate ? 'PUT' : 'POST';

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

      setShowForm(false);
      setEditingTemplate(null);
      setForm(EMPTY_FORM);
      fetchTemplates();
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setForm({
      day_of_week: String(template.day_of_week),
      start_hour: template.start_hour,
      end_hour: template.end_hour,
      level: template.level || '',
      modality: template.modality,
      max_students: String(template.max_students),
      price_per_class: template.price_per_class,
      frequency: String(template.frequency)
    });
    setShowForm(true);
  };

  const handleToggleActive = async (template: Template) => {
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: template.is_active ? 0 : 1 })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al actualizar');
        return;
      }
      fetchTemplates();
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">Plantillas de Clases</h2>
            <p className="text-sm text-gray-500">Clases recurrentes que generan instancias del mes</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
          >
            + Nueva Plantilla
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>
        )}

        {showForm && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
                  <select
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {DAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                  <select
                    value={form.modality}
                    onChange={(e) => setForm({ ...form, modality: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {MODALITIES.map((modal) => (
                      <option key={modal.value} value={modal.value}>
                        {modal.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                  <input
                    type="time"
                    value={form.start_hour}
                    onChange={(e) => setForm({ ...form, start_hour: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                  <input
                    type="time"
                    value={form.end_hour}
                    onChange={(e) => setForm({ ...form, end_hour: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cupo máximo</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_students}
                    onChange={(e) => setForm({ ...form, max_students: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por clase</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_per_class}
                    onChange={(e) => setForm({ ...form, price_per_class: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia (veces por semana)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
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
          <p className="text-gray-500">Cargando plantillas...</p>
        ) : templates.length === 0 ? (
          <p className="text-gray-500">No hay plantillas registradas.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Día</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Horario</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nivel</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Modalidad</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cupo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Precio</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Frecuencia</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {DAYS.find((d) => d.value === template.day_of_week)?.label || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {template.start_hour} - {template.end_hour}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{template.level || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {MODALITIES.find((m) => m.value === template.modality)?.label || template.modality}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{template.max_students}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${template.price_per_class}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{template.frequency}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {template.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-primary-600 hover:text-primary-800 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={template.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                      >
                        {template.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
