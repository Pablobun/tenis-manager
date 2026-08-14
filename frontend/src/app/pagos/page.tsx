'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Student {
  id: number;
  full_name: string;
}

interface StudentBalance {
  total: number;
  saldo_a_favor: number;
}

interface PaymentSummary {
  total: number;
  payments: Array<{
    fecha: string;
    full_name: string;
    alumno_id: number;
    monto: number;
    nota: string | null;
  }>;
}

const today = new Date().toISOString().slice(0, 10);

export default function PagosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({ alumno_id: '', monto: '', fecha: today, nota: '' });
  const [batch, setBatch] = useState({ monto_global: '', fecha: today, nota: '' });
  const [selectedBatch, setSelectedBatch] = useState<Record<number, boolean>>({});
  const [summary, setSummary] = useState<Record<string, PaymentSummary>>({});
  const [selectedInfo, setSelectedInfo] = useState<StudentBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const [studentsRes, summaryRes] = await Promise.all([
        fetch(`${apiUrl}/api/students`, { credentials: 'include' }),
        fetch(`${apiUrl}/api/pagos/summary`, { credentials: 'include' })
      ]);
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data);
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchStudentInfo = async (studentId: string) => {
    setSelectedInfo(null);
    if (!studentId) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/pagos/student/${studentId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedInfo({ total: Number(data.total), saldo_a_favor: Number(data.saldo_a_favor) });
      }
    } catch (err) {
      console.error('Error fetching student info:', err);
    }
  };

  const handleIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!form.alumno_id || !form.monto || Number(form.monto) <= 0) {
      setError('Seleccioná alumno y monto mayor a 0');
      return;
    }
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          alumno_id: Number(form.alumno_id),
          monto: Number(form.monto),
          fecha: form.fecha,
          nota: form.nota || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar el pago');
        return;
      }
      setInfo('Pago registrado correctamente');
      setForm({ alumno_id: '', monto: '', fecha: today, nota: '' });
      fetchData();
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const toggleBatch = (id: number) => {
    setSelectedBatch((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const ids = Object.keys(selectedBatch)
      .filter((k) => selectedBatch[Number(k)])
      .map(Number);
    if (ids.length === 0 || !batch.monto_global || Number(batch.monto_global) <= 0) {
      setError('Seleccioná al menos un alumno y un monto');
      return;
    }
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/pagos/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fecha: batch.fecha,
          nota: batch.nota || null,
          monto_global: Number(batch.monto_global),
          alumno_ids: ids
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar pagos');
        return;
      }
      setInfo(data.message || 'Pagos por lote registrados');
      setBatch({ monto_global: '', fecha: today, nota: '' });
      setSelectedBatch({});
      fetchData();
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  const summaryEntries = Object.keys(summary).sort().reverse();

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Pagos" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-6">Registro de Pagos</h2>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>}
        {info && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{info}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pago individual */}
          <div className="card">
            <h3 className="font-semibold mb-4">Pago individual</h3>
            <form onSubmit={handleIndividual} className="space-y-4">
              <div>
                <label className="label">Alumno</label>
                <select
                  value={form.alumno_id}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, alumno_id: v });
                    fetchStudentInfo(v);
                  }}
                  className="input"
                  required
                >
                  <option value="">Seleccionar alumno</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
                {selectedInfo && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {selectedInfo.total > 0 ? (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Deuda neta: ${selectedInfo.total.toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Sin deuda pendiente
                      </span>
                    )}
                    {selectedInfo.saldo_a_favor > 0 && (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        Saldo a favor: ${selectedInfo.saldo_a_favor.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Nota</label>
                <input
                  type="text"
                  value={form.nota}
                  onChange={(e) => setForm({ ...form, nota: e.target.value })}
                  className="input"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Registrar pago'}
              </button>
            </form>
          </div>

          {/* Pago por lote */}
          <div className="card">
            <h3 className="font-semibold mb-4">Pago por lote</h3>
            <form onSubmit={handleBatch} className="space-y-4">
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedBatch[s.id]}
                      onChange={() => toggleBatch(s.id)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm">{s.full_name}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="label">Monto (por alumno)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={batch.monto_global}
                  onChange={(e) => setBatch({ ...batch, monto_global: e.target.value })}
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  value={batch.fecha}
                  onChange={(e) => setBatch({ ...batch, fecha: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Nota</label>
                <input
                  type="text"
                  value={batch.nota}
                  onChange={(e) => setBatch({ ...batch, nota: e.target.value })}
                  className="input"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Registrar pagos'}
              </button>
            </form>
          </div>
        </div>

        <h3 className="text-md font-semibold mb-3">Resumen global de pagos por fecha</h3>
        {loading ? (
          <p className="text-gray-500">Cargando pagos...</p>
        ) : summaryEntries.length === 0 ? (
          <p className="text-gray-500">No hay pagos registrados aún.</p>
        ) : (
          <div className="space-y-4">
            {summaryEntries.map((date) => {
              const d = new Date(`${date}T12:00:00`);
              const label = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              const capitalized = `${label[0].toUpperCase()}${label.slice(1)}`;
              const entry = summary[date];
              return (
                <div key={date} className="card">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800">{capitalized}</h4>
                    <span className="text-lg font-bold text-green-600">${entry.total.toLocaleString('es-AR')}</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.payments.map((p, idx) => (
                      <li key={idx} className="text-sm flex justify-between border-t border-gray-100 pt-1">
                        <span>{p.full_name}</span>
                        <span className="text-gray-600">${Number(p.monto).toLocaleString('es-AR')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}