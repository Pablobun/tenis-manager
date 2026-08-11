'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Instance {
  id: number;
  template_id: number;
  instance_date: string;
  start_hour: string;
  end_hour: string;
  level: string;
  modality: string;
  max_students: number;
  price: string;
  status: string;
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MODALITIES: Record<string, string> = {
  fixed: 'Fija',
  open: 'Abierta',
  extra: 'Extra'
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

export default function InstanciasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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

  useEffect(() => {
    if (user) fetchInstances(month);
  }, [user, month]);

  const fetchInstances = async (targetMonth: string) => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tenis-manager.onrender.com';
      const res = await fetch(`${apiUrl}/api/instances?month=${targetMonth}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al cargar instancias');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tenis-manager.onrender.com';
      const res = await fetch(`${apiUrl}/api/instances/generate?month=${month}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al generar instancias');
        return;
      }
      setInfo(data.message || 'Instancias generadas');
      fetchInstances(month);
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setGenerating(false);
    }
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

  const grouped: Record<string, Instance[]> = {};
  for (const instance of instances) {
    if (!grouped[instance.instance_date]) grouped[instance.instance_date] = [];
    grouped[instance.instance_date].push(instance);
  }
  const dates = Object.keys(grouped).sort();

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
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold">Instancias del Mes</h2>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
          >
            {generating ? 'Generando...' : 'Generar mes'}
          </button>
        </div>

        <div className="flex items-center justify-between bg-white shadow-md rounded-lg px-4 py-3 mb-6">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="text-primary-600 font-semibold px-3 py-1 hover:bg-gray-100 rounded-lg"
          >
            ◀
          </button>
          <span className="text-base font-semibold capitalize">
            {formatMonthLabel(month)}
          </span>
          <button
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="text-primary-600 font-semibold px-3 py-1 hover:bg-gray-100 rounded-lg"
          >
            ▶
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{info}</div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando instancias...</p>
        ) : dates.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No hay instancias para este mes.</p>
            <p className="text-sm text-gray-400">
              {month === currentMonth()
                ? 'Creá plantillas de clases fijas o tocá "Generar mes".'
                : 'Probá con "Generar mes" o navegá a otro mes.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => {
              const d = new Date(`${date}T12:00:00`);
              const weekday = WEEKDAYS[(d.getDay() + 6) % 7];
              return (
                <div key={date}>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2 capitalize">
                    {weekday} {d.getDate()}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {grouped[date].map((instance) => (
                      <div
                        key={instance.id}
                        className={`bg-white shadow-md rounded-lg p-4 border-l-4 ${
                          instance.status === 'cancelled'
                            ? 'border-gray-300 opacity-60'
                            : 'border-primary-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {instance.start_hour} - {instance.end_hour}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {MODALITIES[instance.modality] || instance.modality}
                              {instance.level ? ` · ${instance.level}` : ''}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              instance.status === 'cancelled'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {instance.status === 'cancelled' ? 'Cancelada' : 'Programada'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Cupo: {instance.max_students} · Precio: ${instance.price}
                        </p>
                      </div>
                    ))}
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
