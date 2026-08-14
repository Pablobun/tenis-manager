'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LevelChip from '@/components/LevelChip';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Template {
  id: number;
  professor_id: number;
  professor_name?: string;
  day_of_week: number;
  start_hour: string;
  end_hour: string;
  level: string | null;
  modality: string;
  max_students: number;
  price_per_class: string;
  is_active: number;
  created_at: string;
}

interface Profesor {
  id: number;
  full_name: string;
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
  { value: 'fija', label: 'Fija' },
  { value: 'extra', label: 'Extra' },
  { value: 'abierta', label: 'Abierta' }
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
  modality: 'fija',
  max_students: '4',
  price_per_class: '',
  profesor_id: ''
};

export default function PlantillasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
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
    if (user) {
      fetchTemplates();
      fetchProfesores();
      if (user.role === 'profesor') {
        setForm((f) => ({ ...f, profesor_id: String(user.id) }));
      }
    }
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

  const fetchProfesores = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/students/profesores`, {
        credentials: 'include'
      });
      if (res.ok) {
        setProfesores(await res.json());
      }
    } catch (err) {
      console.error('Error fetching profesores:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // item 14: al crear una plantilla en el mes en curso, preguntar si generar fechas pasadas
    let includePast = true;
    if (!editingTemplate) {
      const now = new Date();
      const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      // Solo preguntar si ya pasaron días de este mes (no es el día 1)
      if (now.getDate() > 1) {
        includePast = window.confirm(
          '¿Generar también las fechas ya pasadas de este mes?\n\nAceptar = generar TODO el mes (incluye días ya pasados)\nCancelar = generar solo las fechas futuras de este mes'
        );
      }
      void mesActual;
      void hoy;
    }

    const body = {
      day_of_week: Number(form.day_of_week),
      start_hour: form.start_hour,
      end_hour: form.end_hour,
      level: form.level || null,
      modality: form.modality,
      max_students: Number(form.max_students),
      price_per_class: Number(form.price_per_class),
      profesor_id: form.profesor_id ? Number(form.profesor_id) : undefined,
      include_past: includePast
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
      setForm({ ...EMPTY_FORM, profesor_id: user && user.role === 'profesor' ? String(user.id) : '' });
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
      profesor_id: template.professor_id ? String(template.professor_id) : ''
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

  if (!user) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Plantillas" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Plantillas de Clases</h2>
            <p className="text-sm text-gray-500">Clases recurrentes que generan instancias del mes</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setForm({ ...EMPTY_FORM, profesor_id: user.role === 'profesor' ? String(user.id) : '' });
              setShowForm(true);
            }}
            className="btn-primary text-sm"
          >
            + Nueva Plantilla
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>
        )}

        {showForm && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Día de la semana</label>
                  <select
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                    className="input"
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
                  <label className="label">Modalidad</label>
                  <select
                    value={form.modality}
                    onChange={(e) => setForm({ ...form, modality: e.target.value })}
                    className="input"
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
                  <label className="label">Hora inicio</label>
                  <input
                    type="time"
                    value={form.start_hour}
                    onChange={(e) => setForm({ ...form, start_hour: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Hora fin</label>
                  <input
                    type="time"
                    value={form.end_hour}
                    onChange={(e) => setForm({ ...form, end_hour: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Nivel</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="input"
                  >
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Cupo máximo</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_students}
                    onChange={(e) => setForm({ ...form, max_students: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Profesor/a</label>
                  <select
                    value={form.profesor_id}
                    onChange={(e) => setForm({ ...form, profesor_id: e.target.value })}
                    className="input"
                  >
                    <option value="">{user.role === 'profesor' ? 'Yo (profesor/a)' : '— Seleccionar —'}</option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Precio por clase</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_per_class}
                    onChange={(e) => setForm({ ...form, price_per_class: e.target.value })}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La mensualidad mensual = este precio × cantidad de clases del mes.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
                  }}
                  className="btn-secondary"
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
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-head">Día</th>
                  <th className="table-head">Horario</th>
                  <th className="table-head">Nivel</th>
                  <th className="table-head">Modalidad</th>
                  <th className="table-head">Cupo</th>
                  <th className="table-head">Precio</th>
                  <th className="table-head">Profesor/a</th>
                  <th className="table-head">Estado</th>
                  <th className="table-head">Acciones</th>
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
                    <td className="px-4 py-3 text-sm">
                      <LevelChip level={template.level} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {MODALITIES.find((m) => m.value === template.modality)?.label || template.modality}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{template.max_students}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${template.price_per_class}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{template.professor_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`chip ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
