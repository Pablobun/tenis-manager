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

export default function MisClasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [openClasses, setOpenClasses] = useState<OpenClass[]>([]);
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [debts, setDebts] = useState<DebtDetail[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showDebtDetail, setShowDebtDetail] = useState(false);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMine, setLoadingMine] = useState(true);
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

  if (!user) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Mis Clases" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Mi Deuda</h2>
          {loadingMine ? (
            <div className="card">
              <p className="text-gray-500">Calculando saldo...</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="p-6 flex items-center justify-between cursor-pointer" onClick={toggleDebtDetail}>
                <p className="text-gray-700">Saldo pendiente</p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${(balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {(balance ?? 0) < 0
                      ? `A favor: $${Math.abs(balance ?? 0).toLocaleString('es-AR')}`
                      : `$${Number(balance ?? 0).toLocaleString('es-AR')}`}
                  </span>
                  <span className="text-sm text-gray-400">{showDebtDetail ? '▲' : '▼'}</span>
                </div>
              </div>
              {showDebtDetail && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                  {loadingDebt ? (
                    <p className="text-gray-500 text-sm">Cargando detalle...</p>
                  ) : (
                    <>
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Desglose por mes</h5>
                      {debts.length === 0 ? (
                        <p className="text-sm text-gray-500">No tenés deudas registradas.</p>
                      ) : (
                        <ul className="space-y-2 mb-4">
                          {debts.map((d) => (
                            <li key={d.id} className="flex justify-between text-sm border-t border-gray-100 pt-2">
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
                              <span className="text-gray-600">
                                ${Number(d.monto).toLocaleString('es-AR')} - pagado ${Number(d.monto_pagado).toLocaleString('es-AR')} ={' '}
                                <strong className={Number(d.saldo) > 0 ? 'text-red-600' : 'text-green-600'}>
                                  ${Number(d.saldo).toLocaleString('es-AR')}
                                </strong>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Historial de pagos</h5>
                      {payments.length === 0 ? (
                        <p className="text-sm text-gray-500">Aún no hay pagos registrados.</p>
                      ) : (
                        <ul className="space-y-2">
                          {payments.map((p) => (
                            <li key={p.id} className="flex justify-between text-sm border-t border-gray-100 pt-2">
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

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Mis Clases</h2>

          {loadingMine ? (
            <p className="text-gray-500">Cargando tus clases...</p>
          ) : myClasses.length === 0 ? (
            <div className="card text-center">
              <p className="text-gray-500">Todavía no estás inscripto en ninguna clase.</p>
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
                const modalityLabel =
                  c.modality === 'fija' ? 'Clase fija' : c.modality === 'abierta' ? 'Clase abierta' : 'Clase extra';

                return (
                  <div key={c.id} className="card card-accent border-l-primary-500">
                    <h4 className="font-bold text-gray-800 capitalize">{capitalizedLabel}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-600">
                        {c.start_hour.slice(0, 5)} - {c.end_hour.slice(0, 5)}
                      </p>
                      <LevelChip level={c.level} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Profesor: {c.professor_name}</p>
                    <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary-700">
                      {modalityLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Clases Disponibles</h2>
          <p className="text-sm text-gray-500 mb-4">
            Clases abiertas y rotativas para las que podés postularte.
          </p>

          {loadingClasses ? (
            <p className="text-gray-500">Cargando clases disponibles...</p>
          ) : openClasses.length === 0 ? (
            <div className="card text-center">
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
                const enrolled = c.postulation_status === 'aceptada';
                const waitlisted = c.postulation_status === 'lista_espera';

                return (
                  <div
                    key={c.id}
                    className={`card card-accent ${
                      full ? 'border-l-red-500' : 'border-l-primary-500'
                    }`}
                  >
                    <h4 className="font-bold text-gray-800 capitalize">{capitalizedLabel}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-600">
                        {c.start_hour.slice(0, 5)} - {c.end_hour.slice(0, 5)}
                      </p>
                      <LevelChip level={c.level} />
                    </div>
                    <p className="text-sm text-gray-600">Profesor: {c.professor_name}</p>
                    <p className="text-sm text-gray-600">Precio: ${c.price}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-sm font-medium ${full ? 'text-red-600' : 'text-gray-700'}`}>
                        Cupo: {c.enrolled_count}/{c.max_students}
                      </span>
                      {pending ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-2">
                          Postulado (Pendiente)
                          <button
                            onClick={() => handleCancelPostulation(c.id)}
                            className="text-yellow-800 underline hover:text-yellow-900"
                          >
                            Cancelar
                          </button>
                        </span>
                      ) : enrolled ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800">
                          Inscripto
                        </span>
                      ) : waitlisted ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-100 text-orange-800">
                          Lista de espera
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
