'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LevelChip from '@/components/LevelChip';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface StudentRef {
  id: number;
  full_name: string;
  level: string | null;
}

interface Instance {
  id: number;
  template_id: number;
  profesor_id?: number;
  professor_name?: string;
  instance_date: string;
  start_hour: string;
  end_hour: string;
  level: string;
  modality: string;
  max_students: number;
  price: string;
  status: string;
  students?: StudentRef[];
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MODALITIES: Record<string, string> = {
  fija: 'Fija',
  abierta: 'Abierta',
  extra: 'Extra'
};

function currentMonthISO(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

function formatMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  const label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return `${label[0].toUpperCase()}${label.slice(1)}`;
}

export default function InstanciasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [month, setMonth] = useState(currentMonthISO());
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

  const fetchInstances = useCallback(async (targetMonth: string) => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
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
  }, []);

  useEffect(() => {
    if (user) fetchInstances(month);
  }, [user, month, fetchInstances]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setInfo('');
    try {
      // item 14: al regenerar el mes en curso, preguntar si incluir fechas pasadas
      let includePast = true;
      if (month === currentMonthISO()) {
        includePast = window.confirm(
          '¿Generar también las fechas ya pasadas de este mes?\n\nAceptar = generar TODO el mes\nCancelar = solo fechas futuras'
        );
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/generate?month=${month}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ include_past: includePast })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al generar mes');
        return;
      }
      setInfo(data.message);
      fetchInstances(month);
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setGenerating(false);
    }
  };

  if (!user) return null;

  const grouped: Record<string, Instance[]> = {};
  for (const inst of instances) {
    if (!grouped[inst.instance_date]) grouped[inst.instance_date] = [];
    grouped[inst.instance_date].push(inst);
  }
  const dates = Object.keys(grouped).sort();

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Instancias" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Instancias de Clases</h2>
            <p className="text-sm text-gray-500">Generación y control de clases del mes</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
          >
            {generating ? 'Generando...' : '⚙ Generar Mes'}
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="text-primary-600 font-semibold px-3 py-1 hover:bg-gray-100 rounded-lg"
          >
            ◀
          </button>
          <span className="font-semibold capitalize text-lg">
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
              {month === currentMonthISO()
                ? 'Creá plantillas de clases o tocá "Generar Mes".'
                : 'Probá con "Generar Mes" o navegá a otro mes.'}
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
                    {grouped[date].map((instance) => {
                      const students = instance.students || [];
                      return (
                        <div
                          key={instance.id}
                          className={`card ${
                            instance.status === 'cancelada'
                              ? 'border-gray-300 opacity-60'
                              : 'card-accent border-l-primary-500'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">
                                {instance.start_hour} - {instance.end_hour}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-sm text-gray-600 capitalize">
                                  {MODALITIES[instance.modality] || instance.modality}
                                </span>
                                <LevelChip level={instance.level} />
                                {instance.professor_name && (
                                  <span className="text-xs text-gray-500">· {instance.professor_name}</span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                instance.status === 'cancelada'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {instance.status === 'cancelada' ? 'Cancelada' : 'Programada'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Cupo: {instance.max_students} · Precio: ${instance.price}
                          </p>
                          <p className="text-sm mt-2">
                            <span className="font-semibold text-gray-700">
                              Alumnos: {students.length}/{instance.max_students}
                            </span>
                          </p>
                          {students.length === 0 ? (
                            <p className="text-xs text-gray-400 mt-1">Sin alumnos</p>
                          ) : (
                            <p className="text-xs text-gray-600 mt-1">
                              {students.map((s) => s.full_name).join(' · ')}
                            </p>
                          )}
                        </div>
                      );
                    })}
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
