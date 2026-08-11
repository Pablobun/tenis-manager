'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Student {
  id: number;
  full_name: string;
  level: string | null;
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
  students: Student[];
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MODALITIES: Record<string, string> = {
  fixed: 'Fija',
  open: 'Abierta',
  extra: 'Extra'
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayISO(): string {
  return formatDate(new Date());
}

function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return formatDate(date);
}

function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return formatDate(date);
}

function weekdayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  return `${label[0].toUpperCase()}${label.slice(1)}`;
}

export default function TableroPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [dayData, setDayData] = useState<Instance[]>([]);
  const [weekData, setWeekData] = useState<{ date: string; instances: Instance[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [sheetView, setSheetView] = useState<'options' | 'students'>('options');
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin' && parsed.role !== 'profesor') {
      router.push('/mis-clases');
      return;
    }
    setUser(parsed);
  }, [router]);

  const fetchData = useCallback(
    async (date: string, mode: 'day' | 'week') => {
      setLoading(true);
      setError('');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(
          mode === 'day'
            ? `${apiUrl}/api/board/day?date=${date}`
            : `${apiUrl}/api/board/week?date=${date}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Error al cargar el tablero');
          return;
        }
        if (mode === 'day') {
          setDayData(data.instances);
        } else {
          setWeekData(data.week);
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user) fetchData(selectedDate, view);
  }, [user, selectedDate, view, fetchData]);

  const openSheet = (instance: Instance) => {
    setSelectedInstance(instance);
    setSheetView('options');
  };

  const closeSheet = () => {
    setSelectedInstance(null);
    setSheetView('options');
  };

  const changeDay = (delta: number) => {
    setSelectedDate((d) => shiftDate(d, delta));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 60) {
      changeDay(delta < 0 ? 1 : -1);
    }
    touchStartX.current = null;
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

  const isToday = selectedDate === todayISO();

  const dayRows = Array.from(new Set(dayData.map((i) => i.start_hour))).sort();
  const instancesByHour: Record<string, Instance[]> = {};
  for (const instance of dayData) {
    if (!instancesByHour[instance.start_hour]) instancesByHour[instance.start_hour] = [];
    instancesByHour[instance.start_hour].push(instance);
  }

  const cupoColor = (instance: Instance) => {
    const used = instance.students.length;
    if (instance.status === 'cancelled') return 'border-gray-300 opacity-60';
    if (used >= instance.max_students) return 'border-red-500';
    return 'border-primary-500';
  };

  const cupoBadge = (instance: Instance) => {
    const used = instance.students.length;
    if (instance.status === 'cancelled') {
      return { text: 'Cancelada', className: 'bg-gray-100 text-gray-600' };
    }
    if (used >= instance.max_students) {
      return { text: `${used}/${instance.max_students} Lleno`, className: 'bg-red-100 text-red-700' };
    }
    if (used === 0) {
      return { text: `${used}/${instance.max_students}`, className: 'bg-gray-100 text-gray-600' };
    }
    return { text: `${used}/${instance.max_students}`, className: 'bg-green-100 text-green-700' };
  };

  const renderInstanceCell = (instance: Instance) => {
    const names = instance.students.map((s) => s.full_name.toUpperCase()).join(' / ');
    const badge = cupoBadge(instance);
    return (
      <button
        key={instance.id}
        onClick={() => openSheet(instance)}
        className={`w-full text-left bg-white shadow-md rounded-lg p-4 border-l-4 ${cupoColor(instance)} hover:shadow-lg transition`}
      >
        <div className="flex justify-between items-start gap-2">
          <p className="font-semibold text-sm">
            {instance.start_hour} - {instance.end_hour}
          </p>
          <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${badge.className}`}>
            {badge.text}
          </span>
        </div>
        <p className="text-sm mt-1">
          {names || <span className="text-gray-400">Sin alumnos</span>}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {MODALITIES[instance.modality] || instance.modality}
          {instance.level ? ` · ${instance.level}` : ''}
        </p>
      </button>
    );
  };

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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 text-sm font-medium ${view === 'day' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Día
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium ${view === 'week' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Semana
            </button>
          </div>
          {isToday && <span className="text-xs text-gray-500">Hoy</span>}
        </div>

        <div
          className="bg-white shadow-md rounded-lg px-4 py-3 mb-4 flex items-center justify-between"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => changeDay(-1)}
            className="text-primary-600 font-semibold px-3 py-1 hover:bg-gray-100 rounded-lg"
          >
            ◀
          </button>
          <div className="text-center">
            <p className="font-semibold capitalize">{formatDayLabel(selectedDate)}</p>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayISO())}
                className="text-xs text-primary-600 hover:underline"
              >
                Volver a hoy
              </button>
            )}
          </div>
          <button
            onClick={() => changeDay(1)}
            className="text-primary-600 font-semibold px-3 py-1 hover:bg-gray-100 rounded-lg"
          >
            ▶
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>}

        {loading ? (
          <p className="text-gray-500">Cargando tablero...</p>
        ) : view === 'day' ? (
          dayData.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <p className="text-gray-500">No hay clases para este día.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dayRows.flatMap((hour) =>
                (instancesByHour[hour] || []).map((instance) => renderInstanceCell(instance))
              )}
            </div>
          )
        ) : weekData.length === 0 ? (
          <p className="text-gray-500">Cargando semana...</p>
        ) : (
          <div className="space-y-4">
            {weekData.map((day) => (
              <div key={day.date} className="bg-white shadow-md rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm capitalize">
                    {weekdayOf(day.date)} {Number(day.date.slice(8, 10))}
                  </p>
                  {day.date === todayISO() && (
                    <span className="text-xs text-primary-600 font-medium">Hoy</span>
                  )}
                </div>
                {day.instances.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin clases</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {day.instances.map((instance) => {
                      const badge = cupoBadge(instance);
                      return (
                        <button
                          key={instance.id}
                          onClick={() => openSheet(instance)}
                          className={`px-3 py-1.5 rounded-lg border-l-4 bg-gray-50 text-sm hover:shadow transition ${cupoColor(instance)}`}
                        >
                          {instance.start_hour}
                          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${badge.className}`}>
                            {badge.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInstance && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeSheet}>
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-6 pb-8 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">
                  {selectedInstance.start_hour} - {selectedInstance.end_hour}
                </h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">
                  {weekdayOf(selectedInstance.instance_date)}{' '}
                  {selectedInstance.instance_date.slice(8, 10)} ·{' '}
                  {MODALITIES[selectedInstance.modality] || selectedInstance.modality}
                  {selectedInstance.level ? ` · ${selectedInstance.level}` : ''}
                </p>
              </div>
              <button onClick={closeSheet} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            {sheetView === 'students' ? (
              <div>
                <button
                  onClick={() => setSheetView('options')}
                  className="text-sm text-primary-600 mb-3 hover:underline"
                >
                  ← Volver
                </button>
                <p className="font-semibold mb-2">
                  Alumnos ({selectedInstance.students.length}/{selectedInstance.max_students})
                </p>
                {selectedInstance.students.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay alumnos en este grupo.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {selectedInstance.students.map((student) => (
                      <li key={student.id} className="py-2 flex justify-between">
                        <span className="text-sm">{student.full_name}</span>
                        <span className="text-sm text-gray-500">
                          {student.level || 'Sin nivel'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setSheetView('students')}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium"
                >
                  Ver alumnos
                </button>
                <button
                  disabled
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed"
                  title="Disponible en la próxima actualización"
                >
                  Agregar alumno
                </button>
                <button
                  disabled
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed"
                  title="Disponible en la próxima actualización"
                >
                  Mover a...
                </button>
                <button
                  disabled
                  className="w-full text-left px-4 py-3 rounded-lg bg-red-50 text-sm font-medium text-red-300 cursor-not-allowed"
                  title="Disponible en la próxima actualización"
                >
                  Borrar alumno
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
