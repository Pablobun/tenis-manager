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

interface DetailItem {
  instancia_id: number;
  instance_date: string;
  start_hour: string;
  price: number;
}

interface PreviewItem {
  alumno_id: number;
  full_name: string;
  clases: number;
  monto: number;
  precio_por_clase: number;
  detalle: DetailItem[];
  inscripcion_fecha: string | null;
  generated: boolean;
}

interface Debtor {
  alumno_id: number;
  full_name: string;
  monto_total: number;
  pagado: number;
  balance: number;
  balance_favor: number;
}

const currentMonth = new Date().toISOString().slice(0, 7);

export default function FacturacionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [totales, setTotales] = useState<{ total_a_cobrar: number; alumnos_con_deuda: number; total_pagado: number } | null>(null);
  const [ciclo, setCiclo] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
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
        setTotales(previewData.totales || null);
        setCiclo(previewData.ciclo || '');
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

  const cicloLabel = ciclo === 'abierto' ? 'Mes abierto' : ciclo === 'cerrado' ? 'Mes cerrado' : 'Mes no abierto';

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Facturación" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold">Facturación Mensual</h2>
              <p className="text-sm text-gray-500">Generación semi-automática de deudas para clases fijas</p>
            </div>
            {ciclo && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                ciclo === 'abierto' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {cicloLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                loadAll(e.target.value);
              }}
              className="input"
            />
            <button
              onClick={handleGenerate}
              className="btn-primary text-sm"
            >
              Generar deudas
            </button>
            <button
              onClick={handleOpenMonth}
              className="btn-secondary text-sm"
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
          <div className="card mb-8">
            {items.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No hay alumnos inscriptos en clases fijas para este mes.</p>
            ) : (
              <>
                {totales && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b border-gray-100 bg-canvas">
                    <div>
                      <p className="text-xs text-gray-500">Total a cobrar</p>
                      <p className="font-bold text-primary-700">${totales.total_a_cobrar.toLocaleString('es-AR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ya pagado</p>
                      <p className="font-semibold text-green-700">${totales.total_pagado.toLocaleString('es-AR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Alumnos con deuda</p>
                      <p className="font-semibold text-gray-700">{totales.alumnos_con_deuda}</p>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-head">Alumno</th>
                        <th className="table-head">Clases × Precio</th>
                        <th className="table-head">Total</th>
                        <th className="table-head">Detalle</th>
                        <th className="table-head">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((it) => (
                        <>
                          <tr key={it.alumno_id}>
                            <td className="px-4 py-3 text-sm font-medium">
                              {it.full_name}
                              {it.inscripcion_fecha && (
                                <p className="text-xs text-gray-400">
                                  Inscripción: {it.inscripcion_fecha.slice(0, 10)}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {it.clases} × ${Number(it.precio_por_clase).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold">${Number(it.monto).toLocaleString('es-AR')}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => setExpanded((prev) => ({ ...prev, [it.alumno_id]: !prev[it.alumno_id] }))}
                                className="text-primary-600 hover:text-primary-800 text-sm font-semibold"
                              >
                                {expanded[it.alumno_id] ? 'Ocultar' : 'Ver clases'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {it.generated ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Generada</span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">Pendiente</span>
                              )}
                            </td>
                          </tr>
                          {expanded[it.alumno_id] && (
                            <tr key={`${it.alumno_id}-detalle`}>
                              <td colSpan={5} className="px-4 py-2 bg-gray-50">
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {it.detalle.map((dd) => (
                                    <li key={dd.instancia_id}>
                                      {dd.instance_date.slice(0, 10)} · {dd.start_hour.slice(0, 5)} — ${Number(dd.price).toLocaleString('es-AR')}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        <h3 className="text-md font-semibold mb-3">Apertura de mes — alumnos con deuda sin pagar</h3>
        {debtors.length === 0 ? (
          <p className="text-gray-500">No hay alumnos con deuda pendiente para este mes.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-head">Alumno</th>
                  <th className="table-head">Monto</th>
                  <th className="table-head">Pagado</th>
                  <th className="table-head">Saldo restante</th>
                  <th className="table-head">Saldo a favor</th>
                  <th className="table-head">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debtors.map((d) => (
                  <tr key={d.alumno_id}>
                    <td className="px-4 py-3 text-sm font-medium">{d.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${Number(d.monto_total).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-sm text-green-700">${Number(d.pagado).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">${Number(d.balance).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {Number(d.balance_favor) > 0 ? `$${Number(d.balance_favor).toLocaleString('es-AR')}` : '—'}
                    </td>
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