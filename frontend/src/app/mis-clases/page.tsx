'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LevelChip from '@/components/LevelChip';
import { ChevronUp, ChevronDown } from '@/components/icons';

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

interface MyClass {
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
}

interface DebtDetail {
  id: number;
  tipo: string;
  mes: string | null;
  monto: number;
  monto_pagado: number;
  saldo: number;
  status: string;
}

interface PaymentRecord {
  id: number;
  deuda_id: number | null;
  monto: number;
  fecha: string;
  nota: string | null;
}

// ¿Se puede darme de baja? Solo hasta 24h antes del inicio (UTC-3).
function canDropSelf(instance_date: string, start_hour: string, status: string): boolean {
  if (status !== 'programada') return false;
  const dateStr = instance_date.split('T')[0];
  const startMs = Date.parse(`${dateStr}T${start_hour.slice(0, 8)}-03:00`);
  if (Number.isNaN(startMs)) return false;
  return Date.now() < startMs - 24 * 60 * 60 * 1000;
}

const MODALITY_CHIP: Record<string, string> = {
  fija: 'bg-primary-50 text-primary-700',
  abierta: 'bg-cal text-muted border border-line',
  extra: 'bg-red-50 text-red-700'
};

const MODALITY_LABEL: Record<string, string> = {
  fija: 'Clase fija',
  abierta: 'Clase abierta',
  extra: 'Clase extra'
};

export default function MisClasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [openClasses, setOpenClasses] = useState<OpenClass[]>([]);
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [debts, setDebts] = useState<DebtDetail[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showDebtDetail, setShowDebtDetail] = useState(false);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMine, setLoadingMine] = useState(true);

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
      fetchMyClasses();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include'
      });
      if (res.ok) {
        await res.json();
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

  const fetchMyClasses = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/board/mine`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMyClasses(data.classes || []);
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Error fetching my classes:', err);
    } finally {
      setLoadingMine(false);
    }
  };

  const fetchDebtDetail = async () => {
    if (!user) return;
    setLoadingDebt(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/pagos/student/${user.id}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setDebts(data.debts || []);
        setPayments(data.payments || []);
        if (data.total !== undefined) setBalance(data.total);
      }
    } catch (err) {
      console.error('Error fetching debt detail:', err);
    } finally {
      setLoadingDebt(false);
    }
  };

  const toggleDebtDetail = async () => {
    const next = !showDebtDetail;
    setShowDebtDetail(next);
    if (next && debts.length === 0) {
      await fetchDebtDetail();
    }
  };

  const handlePostulate = async (classId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open/${classId}/postulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ force: false })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al postularse');
        return;
      }
      alert(data.message || '¡Postulación enviada correctamente!');
      fetchOpenClasses();
      fetchMyClasses();
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleCancelPostulation = async (classId: number) => {
    if (!confirm('¿Cancelar tu postulación a esta clase?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open/${classId}/postulate`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al cancelar la postulación');
        return;
      }
      alert(data.message || 'Postulación cancelada');
      fetchOpenClasses();
      fetchMyClasses();
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // Baja propia (items 1/2 de cambios.txt): válida hasta 24h antes del inicio,
  // y siempre de la instancia puntual (una fija no pierde la mensualidad).
  const handleDrop = async (classId: number, label: string) => {
    if (!confirm(`¿Darte de baja de la clase del ${label}?\n\nSolo podés darte de baja hasta 24 horas antes del inicio.`)) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/board/drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instance_id: classId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al darte de baja');
        return;
      }
      alert(data.message || 'Baja registrada');
      fetchMyClasses();
      fetchOpenClasses();
    } catch (err) {
      alert('Error de conexión');
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Mis Clases" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Mis Clases</h2>

          {loadingMine ? (
            <p className="text-muted">Cargando tus clases...</p>
          ) : myClasses.length === 0 ? (
            <div className="card text-center">
              <p className="text-muted">Todavía no estás inscripto en ninguna clase.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myClasses.map((c) => {
                const dateStr = c.instance_date.split('T')[0];
                const d = new Date(`${dateStr}T12:00:00`);
                const label = d.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                });
                const capitalizedLabel = `${label[0].toUpperCase()}${label.slice(1)}`;
                const dropOk = canDropSelf(c.instance_date, c.start_hour, c.status);

                return (
                  <div key={c.id} className={`card card-accent ${c.modality === 'extra' ? 'border-l-red-500' : 'border-l-polvo'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-lg">{capitalizedLabel}</h4>
                      <span className={`chip whitespace-nowrap ${MODALITY_CHIP[c.modality] || 'bg-cal text-muted'}`}>
                        {MODALITY_LABEL[c.modality] || c.modality}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted">
                        {c.start_hour.slice(0, 5)} - {c.end_hour.slice(0, 5)}
                      </p>
                      <LevelChip level={c.level} />
                    </div>
                    <p className="text-sm text-muted mt-1">Profesor/a: {c.professor_name}</p>
                    <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-xs text-muted">
                        {c.modality === 'fija' ? 'La baja es solo de esta fecha' : 'Inscripto'}
                      </span>
                      {dropOk ? (
                        <button
                          onClick={() => handleDrop(c.id, capitalizedLabel)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition"
                        >
                          Darme de baja
                        </button>
                      ) : (
                        <span className="text-xs text-muted text-right">
                          Baja solo hasta 24h antes
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-2">Clases Disponibles</h2>
          <p className="text-sm text-muted mb-4">
            Clases extras se inscriben al instante; las abiertas pasan por la profesora.
          </p>

          {loadingClasses ? (
            <p className="text-muted">Cargando clases disponibles...</p>
          ) : openClasses.length === 0 ? (
            <div className="card text-center">
              <p className="text-muted">No hay clases abiertas disponibles por ahora.</p>
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
                const enrolled = c.postulation_status === 'aceptada';
                const waitlisted = c.postulation_status === 'lista_espera';
                const isExtra = c.modality === 'extra';

                return (
                  <div
                    key={c.id}
                    className={`card card-accent ${
                      full ? 'border-l-red-500' : 'border-l-polvo'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-lg">{capitalizedLabel}</h4>
                      <span className={`chip whitespace-nowrap ${MODALITY_CHIP[c.modality] || 'bg-cal text-muted'}`}>
                        {MODALITY_LABEL[c.modality] || c.modality}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted">
                        {c.start_hour.slice(0, 5)} - {c.end_hour.slice(0, 5)}
                      </p>
                      <LevelChip level={c.level} />
                    </div>
                    <p className="text-sm text-muted">Profesor/a: {c.professor_name}</p>
                    <p className="text-sm text-muted">Precio: ${c.price}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-line gap-2">
                      <span className={`text-sm font-semibold ${full ? 'text-red-600' : 'text-ink'}`}>
                        Cupo: {c.enrolled_count}/{c.max_students}
                      </span>
                      {pending ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 flex items-center gap-2">
                          Postulado (Pendiente)
                          <button
                            onClick={() => handleCancelPostulation(c.id)}
                            className="underline hover:no-underline"
                          >
                            Cancelar
                          </button>
                        </span>
                      ) : enrolled ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700">
                          Inscripto
                        </span>
                      ) : waitlisted ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-700 flex items-center gap-2">
                          Lista de espera
                          <button
                            onClick={() => handleCancelPostulation(c.id)}
                            className="underline hover:no-underline"
                          >
                            Salir
                          </button>
                        </span>
                      ) : full && !isExtra ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cal text-muted border border-line">
                          Lleno
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePostulate(c.id)}
                          className="btn-primary text-sm px-4 py-1.5"
                        >
                          {isExtra ? (full ? 'Anotarme en lista' : 'Inscribirme') : 'Postularme'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 mb-8">
          <h2 className="text-xl font-bold mb-4">Mi Deuda</h2>
          {loadingMine ? (
            <div className="card">
              <p className="text-muted">Calculando saldo...</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between cursor-pointer" onClick={toggleDebtDetail}>
                <p className="text-muted">Saldo pendiente</p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${(balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {(balance ?? 0) < 0
                      ? `A favor: $${Math.abs(balance ?? 0).toLocaleString('es-AR')}`
                      : `$${Number(balance ?? 0).toLocaleString('es-AR')}`}
                  </span>
                  <span className="text-sm text-muted">
                    {showDebtDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>
              {showDebtDetail && (
                <div className="px-6 pb-6 pt-6 mt-4 border-t border-line">
                  {loadingDebt ? (
                    <p className="text-muted text-sm">Cargando detalle...</p>
                  ) : (
                    <>
                      <h5 className="text-sm font-semibold text-ink mb-3">Desglose por mes</h5>
                      {debts.length === 0 ? (
                        <p className="text-sm text-muted">No tenés deudas registradas.</p>
                      ) : (
                        <ul className="space-y-2 mb-4">
                          {debts.map((d) => (
                            <li key={d.id} className="flex justify-between text-sm border-t border-line pt-2 gap-3">
                              <span>
                                {d.mes || 'Sin mes'} ·{' '}
                                {d.tipo === 'mensualidad'
                                  ? 'Mensualidad'
                                  : d.tipo === 'clase_extra'
                                  ? 'Clase extra'
                                  : d.tipo === 'clase_abierta'
                                  ? 'Clase abierta'
                                  : d.tipo}
                              </span>
                              <span className="text-muted text-right">
                                ${Number(d.monto).toLocaleString('es-AR')} - pagado ${Number(d.monto_pagado).toLocaleString('es-AR')} ={' '}
                                <strong className={Number(d.saldo) > 0 ? 'text-red-600' : 'text-green-600'}>
                                  ${Number(d.saldo).toLocaleString('es-AR')}
                                </strong>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <h5 className="text-sm font-semibold text-ink mb-3">Historial de pagos</h5>
                      {payments.length === 0 ? (
                        <p className="text-sm text-muted">Aún no hay pagos registrados.</p>
                      ) : (
                        <ul className="space-y-2">
                          {payments.map((p) => (
                            <li key={p.id} className="flex justify-between text-sm border-t border-line pt-2">
                              <span>
                                {p.fecha}
                                {p.nota ? ` · ${p.nota}` : ''}
                              </span>
                              <span className="text-green-600 font-semibold">
                                ${Number(p.monto).toLocaleString('es-AR')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
