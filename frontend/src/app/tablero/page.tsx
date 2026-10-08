'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Modal from '@/components/Modal';
import LevelChip from '@/components/LevelChip';
import { ChevronLeft, ChevronRight, Close } from '@/components/icons';

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
  students: Student[];
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MODALITIES: Record<string, string> = {
  fija: 'Fija',
  abierta: 'Abierta',
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
  const [sheetView, setSheetView] = useState<'options' | 'students' | 'add'>('options');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
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

  const fetchAllStudents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/students`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students list:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData(selectedDate, view);
      fetchAllStudents();
    }
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
    // Issue 15 (punto 5): en vista semana se avanza/retrocede una semana entera
    const step = view === 'week' ? 7 : 1;
    setSelectedDate((d) => shiftDate(d, delta * step));
  };

  // Issue 15 (puntos 2-3): cancelar / reactivar UNA clase desde el calendario
  const handleToggleStatus = async () => {
    if (!selectedInstance) return;
    const target = selectedInstance.status === 'programada' ? 'cancelada' : 'programada';
    const verb = target === 'cancelada' ? '¿Cancelar esta clase?' : '¿Reactivar esta clase?';
    if (!confirm(verb)) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/${selectedInstance.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: target })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al cambiar el estado de la clase');
        return;
      }
      closeSheet();
      fetchData(selectedDate, view);
    } catch (err) {
      alert('Error de conexión');
    }
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance || !selectedStudentToAdd) return;

    // Item 3: con cupo completo la profe puede forzar el alta (excepción)
    const isFull = selectedInstance.students.length >= selectedInstance.max_students;
    if (isFull && !confirm('Cupo completo. ¿Agregar a este alumno igual? (excepción)')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/board/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instance_id: selectedInstance.id,
          student_id: Number(selectedStudentToAdd),
          force: isFull
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al agregar alumno');
        return;
      }
      setSelectedStudentToAdd('');
      setSheetView('students');
      fetchData(selectedDate, view);
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedInstance) return;
    if (!confirm('¿Remover alumno de esta clase?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/board/enroll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instance_id: selectedInstance.id,
          student_id: studentId
        })
      });
      if (res.ok) {
        fetchData(selectedDate, view);
        setSheetView('students');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  if (!user) return null;

  const isToday = selectedDate === todayISO();

  // La clase en curso (hoy, dentro de su franja) va arriba — momento "ahora"
  const nowMs = Date.now();
  const isInProgress = (instance: Instance): boolean => {
    if (!isToday || instance.status !== 'programada') return false;
    const s = Date.parse(`${selectedDate}T${instance.start_hour.slice(0, 8)}-03:00`);
    const e = Date.parse(`${selectedDate}T${instance.end_hour.slice(0, 8)}-03:00`);
    if (Number.isNaN(s) || Number.isNaN(e)) return false;
    return nowMs >= s && nowMs < e;
  };

  let dayRows = Array.from(new Set(dayData.map((i) => i.start_hour))).sort();
  const liveHour = dayData.find((i) => isInProgress(i))?.start_hour;
  if (liveHour) {
    dayRows = [liveHour, ...dayRows.filter((h) => h !== liveHour)];
  }

  const instancesByHour: Record<string, Instance[]> = {};
  for (const instance of dayData) {
    if (!instancesByHour[instance.start_hour]) instancesByHour[instance.start_hour] = [];
    instancesByHour[instance.start_hour].push(instance);
  }

  // Borde de tarjeta = cupo. Extras (lote 3): contorno verde uniforme por rama
  // propia en el render; acá solo cupo/cancelada.
  const cupoColor = (instance: Instance) => {
    const used = instance.students.length;
    if (instance.status === 'cancelada') return 'border-l-gray-300 opacity-60';
    if (instance.modality === 'extra') return '';
    if (used >= instance.max_students) return 'border-l-red-500';
    return 'border-l-polvo';
  };

  const cupoBadge = (instance: Instance) => {
    const used = instance.students.length;
    if (instance.status === 'cancelada') {
      return { text: 'Cancelada', className: 'bg-cal text-muted border border-line' };
    }
    if (used >= instance.max_students) {
      return { text: `${used}/${instance.max_students} Lleno`, className: 'bg-red-50 text-red-700' };
    }
    if (used === 0) {
      return { text: `${used}/${instance.max_students}`, className: 'bg-cal text-muted border border-line' };
    }
    return { text: `${used}/${instance.max_students}`, className: 'bg-green-50 text-green-700' };
  };

  const renderInstanceCell = (instance: Instance) => {
    const names = instance.students.map((s) => s.full_name.toUpperCase()).join(' / ');
    const badge = cupoBadge(instance);
    const live = isInProgress(instance);
    return (
      <button
        key={instance.id}
        onClick={() => openSheet(instance)}
        className={`w-full text-left rounded-2xl border-[1.5px] shadow-sm p-4 transition hover:shadow-md ${
          instance.status !== 'cancelada' && instance.modality === 'extra'
            ? 'border-green-500 bg-green-50'
            : 'bg-ficha border-line border-l-px'
        } ${cupoColor(instance)} ${live ? 'ring-2 ring-white shadow-lg' : ''}`}
      >
        <div className="flex justify-between items-start gap-2">
          <p className="font-display font-bold text-base tabular-nums">
            {instance.start_hour.slice(0, 5)} - {instance.end_hour.slice(0, 5)}
          </p>
          <div className="flex items-center gap-1.5">
            {live && <span className="chip bg-polvo text-white">Ahora</span>}
            <span className={`chip whitespace-nowrap ${badge.className}`}>
              {badge.text}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm">
            {names || <span className="text-muted">Sin alumnos</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`chip capitalize ${instance.modality === 'extra' ? 'bg-green-100 text-green-800' : 'bg-cal text-muted border border-line'}`}>
            {MODALITIES[instance.modality] || instance.modality}
          </span>
          <LevelChip level={instance.level} />
          {instance.professor_name && (
            <span className="text-xs text-muted">· {instance.professor_name}</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Tablero" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex bg-ficha border border-line rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 text-sm font-semibold transition ${view === 'day' ? 'bg-polvo text-white' : 'text-ink hover:bg-cal'}`}
            >
              Día
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-semibold transition ${view === 'week' ? 'bg-polvo text-white' : 'text-ink hover:bg-cal'}`}
            >
              Semana
            </button>
          </div>
          <div className="flex items-center gap-2">
            {view === 'week' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                aria-label="Ir a la semana de una fecha"
                className="bg-ficha border border-line rounded-xl px-3 py-2 text-sm font-medium text-ink tabular-nums shadow-sm"
              />
            )}
            {isToday && <span className="chip bg-polvo text-white">Hoy</span>}
          </div>
        </div>

        {/* Tira de días: línea de base del día (swipe cambia de día) */}
        <div
          className="bg-polvo text-white shadow-md rounded-2xl px-3 py-3 mb-4 flex items-center justify-between"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => changeDay(-1)}
            aria-label="Día anterior"
            className="flex items-center justify-center text-white font-semibold w-9 h-9 hover:bg-white/15 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-display font-bold text-lg">{formatDayLabel(selectedDate)}</p>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayISO())}
                className="text-xs text-white underline underline-offset-2 hover:no-underline"
              >
                Volver a hoy
              </button>
            )}
          </div>
          <button
            onClick={() => changeDay(1)}
            aria-label="Día siguiente"
            className="flex items-center justify-center text-white font-semibold w-9 h-9 hover:bg-white/15 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}

        {loading ? (
          <p className="text-muted">Cargando tablero...</p>
        ) : view === 'day' ? (
          dayData.length === 0 ? (
            <div className="card text-center">
              <p className="text-muted">No hay clases para este día.</p>
            </div>
          ) : (
            <div
              key={selectedDate}
              className="bg-polvo court-line rounded-2xl shadow-md px-4 py-2 day-in"
            >
              {dayRows.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[3.5rem_1fr] gap-3 border-t border-white/40 first:border-t-0 py-3"
                >
                  <span className="font-display font-bold text-sm text-white/90 tabular-nums pt-1 text-right">
                    {hour.slice(0, 5)}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(instancesByHour[hour] || []).map((instance) =>
                      renderInstanceCell(instance)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : weekData.length === 0 ? (
          <p className="text-muted">Cargando semana...</p>
        ) : (
          <div key={selectedDate} className="space-y-4 day-in">
            {weekData.map((day) => (
              <div key={day.date} className="card">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm capitalize">
                    {weekdayOf(day.date)} {Number(day.date.slice(8, 10))}
                  </p>
                  {day.date === todayISO() && (
                    <span className="chip bg-polvo text-white">Hoy</span>
                  )}
                </div>
                {day.instances.length === 0 ? (
                  <p className="text-xs text-muted">Sin clases</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {day.instances.map((instance) => {
                      const badge = cupoBadge(instance);
                      return (
                        <button
                          key={instance.id}
                          onClick={() => openSheet(instance)}
                          className={`px-3 py-1.5 rounded-xl border text-sm hover:shadow transition ${
                            instance.status !== 'cancelada' && instance.modality === 'extra'
                              ? 'border-green-500 bg-green-50'
                              : 'border-line bg-ficha'
                          } ${cupoColor(instance)}`}
                        >
                          {instance.start_hour.slice(0, 5)}
                          <span className={`ml-2 chip ${badge.className}`}>
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
        <Modal onClose={closeSheet} ariaLabel="Detalle de la clase">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">
                  {selectedInstance.start_hour} - {selectedInstance.end_hour}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-sm text-gray-500 capitalize">
                    {weekdayOf(selectedInstance.instance_date)}{' '}
                    {selectedInstance.instance_date.slice(8, 10)} ·{' '}
                    {MODALITIES[selectedInstance.modality] || selectedInstance.modality}
                  </p>
                  <LevelChip level={selectedInstance.level} />
                </div>
                {selectedInstance.professor_name && (
                  <p className="text-xs text-gray-500 mt-1">Profesor/a: {selectedInstance.professor_name}</p>
                )}
              </div>
              <button
                onClick={closeSheet}
                aria-label="Cerrar"
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Close className="w-5 h-5" />
              </button>
            </div>

            {sheetView === 'students' ? (
              <div>
                <button
                  onClick={() => setSheetView('options')}
                  className="flex items-center gap-1 text-sm text-primary-600 mb-3 hover:underline"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Volver
                </button>
                <p className="font-semibold mb-2">
                  Alumnos ({selectedInstance.students.length}/{selectedInstance.max_students})
                </p>
                {selectedInstance.students.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay alumnos en este grupo.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {selectedInstance.students.map((student) => (
                      <li key={student.id} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">{student.full_name}</span>
                          <span className="text-xs text-gray-500 ml-2 capitalize">{student.level || ''}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : sheetView === 'add' ? (
              <div>
                <button
                  onClick={() => setSheetView('options')}
                  className="flex items-center gap-1 text-sm text-polvo font-semibold mb-3 hover:underline"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Volver
                </button>
                <p className="font-semibold mb-2">Agregar alumno a la clase</p>
                {selectedInstance.students.length >= selectedInstance.max_students && (
                  <p className="text-xs font-semibold bg-red-50 text-red-700 border border-red-100 rounded-lg px-3 py-2 mb-3">
                    Cupo completo — se agregaría por excepción (fuerza la profesora).
                  </p>
                )}
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <select
                    value={selectedStudentToAdd}
                    onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Seleccionar alumno...</option>
                    {allStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full btn-primary"
                  >
                    {selectedInstance.students.length >= selectedInstance.max_students
                      ? 'Agregar por excepción'
                      : 'Inscribir Alumno'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setSheetView('students')}
                  className={
                    selectedInstance.status === 'cancelada'
                      ? 'w-full text-left px-4 py-3 rounded-xl bg-cal hover:bg-line/60 text-sm font-medium'
                      : 'w-full btn-primary py-3 text-sm'
                  }
                >
                  Ver alumnos ({selectedInstance.students.length}/{selectedInstance.max_students})
                </button>
                {selectedInstance.status === 'programada' && (
                  <button
                    onClick={() => setSheetView('add')}
                    className="w-full text-left px-4 py-3 rounded-xl bg-cal hover:bg-line/60 text-sm font-medium text-polvo-dark font-semibold"
                  >
                    + Agregar alumno
                  </button>
                )}
                {selectedInstance.status === 'programada' ? (
                  <button
                    onClick={handleToggleStatus}
                    className="w-full text-left px-4 py-3 rounded-xl bg-cal hover:bg-line/60 text-sm font-semibold text-red-700"
                  >
                    Cancelar clase
                  </button>
                ) : selectedInstance.status === 'cancelada' ? (
                  <>
                    <p className="text-xs text-muted bg-cal border border-line rounded-xl px-4 py-2">
                      Clase cancelada. Sigue visible en el calendario y forma parte de la facturación.
                    </p>
                    <button
                      onClick={handleToggleStatus}
                      className="w-full btn-primary py-3 text-sm"
                    >
                      Reactivar clase
                    </button>
                  </>
                ) : null}
              </div>
            )}
        </Modal>
      )}
    </main>
  );
}
