'use client';

// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Mundo B (maximalista deportivo): chips de 7 días con swipe + bloques de hora
// con la hora en gigante. Semana tipo marcador en 7 columnas con scroll-x.

import LevelChip from '@/components/LevelChip';
import { ChevronLeft, ChevronRight } from '@/components/icons';
import {
  type Instance,
  type TableroVistaProps,
  MODALITIES,
  cupoBadge,
  cupoColor,
  isInProgress,
  pendingCount,
  shiftDate,
  startOfWeek,
  todayISO,
  weekdayOf
} from './comun';

const DOW_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function CeldaB({
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
      className={`w-full text-left rounded-2xl border shadow-md p-4 transition hover:shadow-lg hover:-translate-y-0.5 ${
        instance.status !== 'cancelada' && instance.modality === 'extra'
          ? 'border-green-500 bg-green-50'
          : 'bg-ficha border-line border-l-px'
      } ${cupoColor(instance)} ${live ? 'ring-2 ring-[#ff006e]' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <p className="font-display font-bold text-lg tabular-nums">
          {instance.start_hour.slice(0, 5)} - {instance.end_hour.slice(0, 5)}
        </p>
        <div className="flex items-center gap-1.5">
          {live && <span className="chip bg-polvo text-white">Ahora</span>}
          <span className={`chip whitespace-nowrap ${badge.className}`}>{badge.text}</span>
        </div>
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
            {pendingCount(instance)} post.
          </span>
        )}
        {instance.professor_name && (
          <span className="text-xs text-muted">· {instance.professor_name}</span>
        )}
      </div>
    </button>
  );
}

export default function TableroB(props: TableroVistaProps) {
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

  const lunes = startOfWeek(selectedDate);
  const chips = Array.from({ length: 7 }, (_, i) => shiftDate(lunes, i));

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-6"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <div className="flex bg-ficha border border-line rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              view === 'day' ? 'bg-polvo text-white' : 'text-ink hover:bg-cal'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              view === 'week' ? 'bg-polvo text-white' : 'text-ink hover:bg-cal'
            }`}
          >
            Semana
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDay(-1)}
            aria-label={view === 'week' ? 'Semana anterior' : 'Día anterior'}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-ink hover:bg-cal transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeDay(1)}
            aria-label={view === 'week' ? 'Semana siguiente' : 'Día siguiente'}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-ink hover:bg-cal transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <p className="text-muted">Cargando tablero...</p>
      ) : view === 'day' ? (
        <>
          {/* Chips de 7 días (swipe cambia de día) */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
            {chips.map((fecha, i) => {
              const activo = fecha === selectedDate;
              const hoy = fecha === todayISO();
              return (
                <button
                  key={fecha}
                  onClick={() => setSelectedDate(fecha)}
                  className={`shrink-0 min-w-[3.5rem] px-3 py-2 rounded-2xl border text-center transition ${
                    activo
                      ? 'bg-polvo text-white border-transparent shadow-md'
                      : 'bg-ficha text-ink border-line hover:shadow'
                  }`}
                >
                  <span className={`block text-[11px] uppercase ${activo ? 'text-white/80' : 'text-muted'}`}>
                    {DOW_SHORT[i]}
                  </span>
                  <span className="block font-display font-bold text-lg tabular-nums">
                    {Number(fecha.slice(8, 10))}
                  </span>
                  {hoy && (
                    <span className={`block text-[10px] font-semibold ${activo ? 'text-white' : 'text-polvo'}`}>
                      hoy
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {dayData.length === 0 ? (
            <div className="card text-center">
              <p className="text-muted">No hay clases para este día.</p>
            </div>
          ) : (
            <div key={selectedDate} className="day-in">
              {dayRows.map((hour) => (
                <div key={hour} className="mb-6 min-w-0">
                  <p className="font-display font-extrabold text-4xl leading-none tabular-nums mb-3">
                    {hour.slice(0, 5)}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(instancesByHour[hour] || []).map((instance) => (
                      <CeldaB
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
          )}
        </>
      ) : weekData.length === 0 ? (
        <p className="text-muted">Cargando semana...</p>
      ) : (
        <div key={selectedDate} className="overflow-x-auto pb-1 day-in">
          <div className="grid grid-cols-7 gap-3 min-w-[54rem]">
            {weekData.map((day) => {
              const hoy = day.date === todayISO();
              return (
                <div
                  key={day.date}
                  className={`rounded-2xl border p-3 min-h-[12rem] ${
                    hoy ? 'bg-ficha border-[#ff006e] shadow-md' : 'bg-ficha border-line'
                  }`}
                >
                  <p className="text-center mb-3 pb-2 border-b border-line">
                    <span className="block text-[11px] uppercase tracking-wide text-muted">
                      {weekdayOf(day.date).slice(0, 3)}
                    </span>
                    <span className="block font-display font-extrabold text-2xl tabular-nums">
                      {Number(day.date.slice(8, 10))}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {day.instances.length === 0 ? (
                      <p className="text-xs text-muted text-center">Sin clases</p>
                    ) : (
                      day.instances.map((instance) => {
                        const badge = cupoBadge(instance);
                        return (
                          <button
                            key={instance.id}
                            onClick={() => openSheet(instance)}
                            className={`w-full text-left text-xs rounded-xl border p-2 transition hover:shadow ${
                              instance.status !== 'cancelada' && instance.modality === 'extra'
                                ? 'border-green-500 bg-green-50'
                                : 'border-line bg-cal'
                            } ${cupoColor(instance)}`}
                          >
                            <span className="block font-bold tabular-nums text-sm">
                              {instance.start_hour.slice(0, 5)}
                            </span>
                            <span className={`chip ${badge.className}`}>{badge.text}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
