'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface PreviewItem {
  alumno_id: number;
  full_name: string;
  clases: number;
  monto: number;
  generated: boolean;
}

interface Debtor {
  alumno_id: number;
  full_name: string;
  balance: number;
}

const currentMonth = new Date().toISOString().slice(0, 7);

export default function FacturacionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(false);
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

  const loadAll = async (m: string) => {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const [previewRes, debtorsRes] = await Promise.all([
        fetch(`${apiUrl}/api/billing/preview?month=${m}`, { credentials: 'include' }),
        fetch(`${apiUrl}/api/billing/debtors?month=${m}`, { credentials: 'include' })
      ]);
      if (previewRes.ok) {
        const previewData = await previewRes.json();
        setItems(previewData.items || []);
      } else {
        setError('Error cargando preview de facturación');
      }
      if (debtorsRes.ok) {
        const debtorsData = await debtorsRes.json();
        setDebtors(debtorsData.debtors || []);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAll(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGenerate = async () => {
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/billing/generate?month=${month}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error generando facturación');
        return;
      }
      setInfo(data.message || 'Facturación generada');
      loadAll(month);
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleOpenMonth = async () => {
    if (!confirm(`¿Abrir el mes ${month} y cerrar los anteriores?`)) return;
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/billing/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ month })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error abriendo el mes');
        return;
      }
      setDebtors(data.debtors || []);
      setInfo(data.message || 'Mes abierto');
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleReleaseSlots = async (alumnoId: number) => {
    if (!confirm('¿Liberar los cupos de este alumno en todas las clases fijas del mes?')) return;
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/billing/release-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ month, alumno_id: alumnoId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error liberando cupos');
        return;
      }
      setInfo(data.message || 'Cupos liberados');
      setDebtors((prev) => prev.filter((d) => d.alumno_id !== alumnoId));
    } catch (err) {
      setError('Error de conexión');
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
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Facturación Mensual</h2>
            <p className="text-sm text-gray-500">Generación semi-automática de deudas para clases fijas</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                loadAll(e.target.value);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleGenerate}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
            >
              Generar deudas
            </button>
            <button
              onClick={handleOpenMonth}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm"
            >
              Abrir mes
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>}
        {info && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{info}</div>}

        <h3 className="text-md font-semibold mb-3">Deuda propuesta (revisá antes de generar)</h3>
        {loading ? (
          <p className="text-gray-500">Calculando deuda del mes...</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            {items.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No hay alumnos inscriptos en clases fijas para este mes.</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Alumno</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clases</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Monto</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((it) => (
                    <tr key={it.alumno_id}>
                      <td className="px-4 py-3 text-sm font-medium">{it.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{it.clases}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${Number(it.monto).toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm">
                        {it.generated ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Generada</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <h3 className="text-md font-semibold mb-3">Apertura de mes — alumnos con deuda sin pagar</h3>
        {debtors.length === 0 ? (
          <p className="text-gray-500">No hay alumnos con deuda pendiente para este mes.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Alumno</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Saldo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debtors.map((d) => (
                  <tr key={d.alumno_id}>
                    <td className="px-4 py-3 text-sm font-medium">{d.full_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">${Number(d.balance).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleReleaseSlots(d.alumno_id)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Liberar cupos
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