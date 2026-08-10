'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Student {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  level: string | null;
  is_active: number;
  created_at: string;
}

export default function AlumnosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', level: '' });
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
    if (user) fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tenis-manager.onrender.com';
      const res = await fetch(`${apiUrl}/api/students`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tenis-manager.onrender.com';
      const url = editingStudent
        ? `${apiUrl}/api/students/${editingStudent.id}`
        : `${apiUrl}/api/students`;
      const method = editingStudent ? 'PUT' : 'POST';

      const body = editingStudent
        ? { full_name: form.full_name, phone: form.phone, level: form.level }
        : form;

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
      setEditingStudent(null);
      setForm({ email: '', password: '', full_name: '', phone: '', level: '' });
      fetchStudents();
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setForm({
      email: student.email,
      password: '',
      full_name: student.full_name,
      phone: student.phone || '',
      level: student.level || ''
    });
    setShowForm(true);
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Alumnos</h2>
          <button
            onClick={() => {
              setEditingStudent(null);
              setForm({ email: '', password: '', full_name: '', phone: '', level: '' });
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
          >
            + Nuevo Alumno
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">
              {editingStudent ? 'Editar Alumno' : 'Nuevo Alumno'}
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingStudent && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sin nivel</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  {editingStudent ? 'Guardar Cambios' : 'Crear Alumno'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingStudent(null);
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
          <p className="text-gray-500">Cargando alumnos...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-500">No hay alumnos registrados.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Teléfono</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nivel</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{student.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.level || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {student.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        Editar
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
