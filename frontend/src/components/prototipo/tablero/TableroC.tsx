'use client';

// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Mundo C (premium editorial): fecha como titular serif, navegación texto
// ← ayer · hoy · mañana →, timeline con filete vertical y semana en secciones.

import LevelChip from '@/components/LevelChip';
import { ChevronLeft, ChevronRight } from '@/components/icons';
import {
  type Instance,
  type TableroVistaProps,
  MODALITIES,
  cupoBadge,
  cupoColor,
  formatDayLabel,
  isInProgress,
  pendingCount,
  todayISO,
  weekdayOf
} from './comun';

function CeldaC({
  instance,
  openSheet,
  isToday,
  selectedDate
}: {
  instance: Instance;
  openSheet: (i: Instance) => void;
  isToday: boolean;
  selectedDate: string;
}) {
  const names = instance.students.map((s) => s.full_name.toUpperCase()).join(' / ');
  const badge = cupoBadge(instance);
  const live = isInProgress(instance, isToday, selectedDate);
  return (
    <button
      onClick={() => openSheet(instance)}
      className={`w-full text-left rounded-xl border p-4 transition ${
        instance.status !== 'cancelada' && instance.modality === 'extra'
          ? 'border-green-500 bg-green-50'
          : 'bg-ficha border-line'
      } ${instance.status === 'cancelada' ? 'opacity-60' : ''} hover:border-ink/40`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg font-semibold tabular-nums">
          {instance.start_hour.slice(0, 5)} – {instance.end_hour.slice(0, 5)}
        </p>
        <span className="flex items-center gap-1.5">
          {live && <span className="chip bg-polvo text-white">Ahora</span>}
          <span className={`chip whitespace-nowrap ${badge.className}`}>{badge.text}</span>
        </span>
      </div>
      <p className="text-sm mt-1">{names || <span className="text-muted">Sin alumnos</span>}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span
          className={`chip capitalize ${
            instance.modality === 'extra'
              ? 'bg-green-100 text-green-800'
              : 'bg-cal text-muted border border-line'
          }`}
        >
          {MODALITIES[instance.modality] || instance.modality}
        </span>
        <LevelChip level={instance.level} />
        {pendingCount(instance) > 0 && instance.status !== 'cancelada' && (
          <span className="chip bg-primary-50 text-primary-700 font-semibold">
            {pendingCount(instance)} postulante{pendingCount(instance) > 1 ? 's' : ''}
          </span>
        )}
        {instance.professor_name && (
          <span className="text-xs text-muted">· {instance.professor_name}</span>
        )}
      </div>
    </button>
  );
}

export default function TableroC(props: TableroVistaProps) {
  const {
    view,
    setView,
    selectedDate,
    setSelectedDate,
    changeDay,
    dayData,
    weekData,
    loading,
    error,
    isToday,
    openSheet,
    onTouchStart,
    onTouchEnd,
    dayRows,
    instancesByHour
  } = props;

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Conmutador editorial: enlaces con filete, no píldoras */}
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3 mb-6">
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => setView('day')}
            className={`transition ${
              view === 'day'
                ? 'text-ink font-semibold underline underline-offset-4 decoration-2'
                : 'text-muted hover:text-ink'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setView('week')}
            className={`transition ${
              view === 'week'
                ? 'text-ink font-semibold underline underline-offset-4 decoration-2'
                : 'text-muted hover:text-ink'
            }`}
          >
            Semana
          </button>
        </div>
        <div className="flex items-center gap-3">
          {view === 'week' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              aria-label="Ir a la semana de una fecha"
              className="bg-ficha border border-line rounded-lg px-3 py-1.5 text-sm font-medium text-ink tabular-nums"
            />
          )}
          {isToday && <span className="chip bg-polvo text-white">Hoy</span>}
        </div>
      </div>

      {/* Titular de fecha + navegación texto */}
      <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
        {formatDayLabel(selectedDate)}
      </h1>
      <div className="flex items-center gap-3 text-sm mb-6 flex-wrap">
        <button
          onClick={() => changeDay(-1)}
          className="flex items-center gap-1 text-ink hover:underline underline-offset-4"
        >
          <ChevronLeft className="w-4 h-4" />
          {view === 'week' ? 'Anterior' : 'Ayer'}
        </button>
        <span aria-hidden="true" className="text-muted">
          ·
        </span>
        <button
          onClick={() => setSelectedDate(todayISO())}
          className={`hover:underline underline-offset-4 ${
            isToday ? 'text-ink font-semibold' : 'text-muted hover:text-ink'
          }`}
        >
          Hoy
        </button>
        <span aria-hidden="true" className="text-muted">
          ·
        </span>
        <button
          onClick={() => changeDay(1)}
          className="flex items-center gap-1 text-ink hover:underline underline-offset-4"
        >
          {view === 'week' ? 'Siguiente' : 'Mañana'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>
      )}

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
            className="border-l border-line pl-6 space-y-6 day-in"
          >
            {dayRows.map((hour) => (
              <div key={hour} className="relative min-w-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.7rem] top-1.5 w-2 h-2 rounded-full bg-muted"
                />
                <p className="text-sm font-semibold text-muted tabular-nums">
                  {hour.slice(0, 5)}
                </p>
                <div className="mt-2 space-y-3">
                  {(instancesByHour[hour] || []).map((instance) => (
                    <CeldaC
                      key={instance.id}
                      instance={instance}
                      openSheet={openSheet}
                      isToday={isToday}
                      selectedDate={selectedDate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : weekData.length === 0 ? (
        <p className="text-muted">Cargando semana...</p>
      ) : (
        <div key={selectedDate} className="space-y-8 day-in">
          {weekData.map((day) => (
            <section key={day.date} className="border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="font-display text-xl font-semibold">
                  {weekdayOf(day.date)}{' '}
                  <span className="font-normal text-muted">{Number(day.date.slice(8, 10))}</span>
                </h2>
                {day.date === todayISO() && <span className="chip bg-polvo text-white">Hoy</span>}
              </div>
              {day.instances.length === 0 ? (
                <p className="text-sm text-muted">Sin clases</p>
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {day.instances.map((instance) => {
                    const badge = cupoBadge(instance);
                    return (
                      <li key={instance.id}>
                        <button
                          onClick={() => openSheet(instance)}
                          className={`w-full text-left py-3 flex items-center gap-4 min-w-0 transition hover:bg-cal ${
                            instance.status === 'cancelada' ? 'opacity-60' : ''
                          } ${
                            instance.modality === 'extra' && instance.status !== 'cancelada'
                              ? 'bg-green-50'
                              : ''
                          }`}
                        >
                          <span className="font-display font-semibold text-sm tabular-nums shrink-0">
                            {instance.start_hour.slice(0, 5)}
                          </span>
                          <span className="text-sm truncate flex-1 min-w-0">
                            {instance.students.map((s) => s.full_name.toUpperCase()).join(' / ') ||
                              'Sin alumnos'}
                          </span>
                          <span className={`chip whitespace-nowrap shrink-0 ${badge.className}`}>
                            {badge.text}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
