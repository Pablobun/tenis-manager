'use client';

// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Mundo A (glass/oscuro): riel izquierdo con mini-calendario mensual + agenda de
// columna única por hora. Semana en grid de 7 columnas con scroll-x contenido.

import { useEffect, useState } from 'react';
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
  monthDays,
  monthLabel,
  pendingCount,
  shiftDate,
  shiftMonth,
  todayISO,
  weekdayOf
} from './comun';

const DOW_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function MiniCal({
  selectedDate,
  setSelectedDate
}: {
  selectedDate: string;
  setSelectedDate: TableroVistaProps['setSelectedDate'];
}) {
  const [mes, setMes] = useState(selectedDate.slice(0, 7));

  useEffect(() => {
    setMes(selectedDate.slice(0, 7));
  }, [selectedDate]);

  const cells = monthDays(mes);

  return (
    <div className="bg-ficha border border-line rounded-2xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setMes(shiftMonth(mes, -1))}
          aria-label="Mes anterior"
          className="p-2 rounded-lg text-ink hover:bg-cal transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold">{monthLabel(mes)}</p>
        <button
          onClick={() => setMes(shiftMonth(mes, 1))}
          aria-label="Mes siguiente"
          className="p-2 rounded-lg text-ink hover:bg-cal transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW_SHORT.map((d) => (
          <span key={d} className="text-[11px] text-muted py-1">
            {d}
          </span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={`hueco-${i}`} />
          ) : (
            <button
              key={d}
              onClick={() => setSelectedDate(`${mes}-${String(d).padStart(2, '0')}`)}
              className={`text-xs py-2 rounded-lg transition ${
                selectedDate === `${mes}-${String(d).padStart(2, '0')}`
                  ? 'bg-polvo text-white font-semibold'
                  : 'text-ink hover:bg-cal'
              }`}
            >
              {d}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function CeldaA({
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
      className={`w-full text-left rounded-xl border shadow-sm p-3 transition hover:shadow-md ${
        instance.status !== 'cancelada' && instance.modality === 'extra'
          ? 'border-green-500 bg-green-50'
          : 'bg-ficha border-line border-l-px'
      } ${cupoColor(instance)} ${live ? 'ring-2 ring-white shadow-lg' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <p className="font-semibold text-sm tabular-nums">
          {instance.start_hour.slice(0, 5)} - {instance.end_hour.slice(0, 5)}
        </p>
        <div className="flex items-center gap-1.5">
          {live && <span className="chip bg-polvo text-white">Ahora</span>}
          <span className={`chip whitespace-nowrap ${badge.className}`}>{badge.text}</span>
        </div>
      </div>
      <p className="text-sm mt-1">{names || <span className="text-muted">Sin alumnos</span>}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
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

export default function TableroA(props: TableroVistaProps) {
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
    <div className="max-w-6xl mx-auto px-4 py-6 flex items-start gap-6">
      {/* Riel izquierdo: mini-calendario (md+; en mobile manda la columna) */}
      <aside className="hidden md:block w-56 shrink-0">
        <MiniCal selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <div className="mt-4 bg-ficha border border-line rounded-2xl p-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted mb-2">Vista</p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                view === 'day' ? 'bg-polvo text-white' : 'text-ink hover:bg-cal'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                view === 'week' ? 'bg-polvo text-white' : 'text-ink hover:bg-cal'
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          {/* En mobile el toggle vive acá (sin riel) */}
          <div className="md:hidden flex bg-ficha border border-line rounded-xl shadow-sm overflow-hidden">
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

          <div className="flex items-center gap-1">
            <button
              onClick={() => changeDay(-1)}
              aria-label={view === 'week' ? 'Semana anterior' : 'Día anterior'}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-ink hover:bg-cal transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold px-1">{formatDayLabel(selectedDate)}</span>
            <button
              onClick={() => changeDay(1)}
              aria-label={view === 'week' ? 'Semana siguiente' : 'Día siguiente'}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-ink hover:bg-cal transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayISO())}
                className="text-xs text-polvo font-semibold px-2 py-1.5 hover:underline"
              >
                Hoy
              </button>
            )}
            {view === 'week' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                aria-label="Ir a la semana de una fecha"
                className="bg-ficha border border-line rounded-xl px-3 py-2 text-sm font-medium text-ink tabular-nums shadow-sm ml-1"
              />
            )}
            {isToday && <span className="chip bg-polvo text-white ml-1">Hoy</span>}
          </div>
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
              className="day-in"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {dayRows.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[3.5rem_1fr] gap-3 border-t border-line first:border-t-0 py-3"
                >
                  <span className="text-sm font-semibold text-muted tabular-nums pt-1 text-right">
                    {hour.slice(0, 5)}
                  </span>
                  <div className="grid grid-cols-1 gap-3 min-w-0">
                    {(instancesByHour[hour] || []).map((instance) => (
                      <CeldaA
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
          <div key={selectedDate} className="overflow-x-auto pb-1 day-in">
            <div className="grid grid-cols-7 gap-2 min-w-[46rem]">
              {weekData.map((day) => (
                <div key={day.date} className="bg-ficha border border-line rounded-xl p-2 min-h-[9rem]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                    {weekdayOf(day.date).slice(0, 3)} {Number(day.date.slice(8, 10))}
                    {day.date === todayISO() && ' · Hoy'}
                  </p>
                  <div className="space-y-2">
                    {day.instances.length === 0 ? (
                      <p className="text-[11px] text-muted">Sin clases</p>
                    ) : (
                      day.instances.map((instance) => {
                        const badge = cupoBadge(instance);
                        return (
                          <button
                            key={instance.id}
                            onClick={() => openSheet(instance)}
                            className={`w-full text-left text-xs rounded-lg border px-2 py-2 transition hover:shadow ${
                              instance.status !== 'cancelada' && instance.modality === 'extra'
                                ? 'border-green-500 bg-green-50'
                                : 'border-line bg-cal'
                            } ${cupoColor(instance)}`}
                          >
                            <span className="font-semibold tabular-nums">
                              {instance.start_hour.slice(0, 5)}
                            </span>
                            <span className={`ml-1 chip ${badge.className}`}>{badge.text}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
