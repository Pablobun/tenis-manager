// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Tipos y helpers puros compartidos entre el tablero real (page.tsx) y las
// variantes estructurales TableroA/B/C. Misma lógica, cero duplicación.

import type { Dispatch, SetStateAction, TouchEvent } from 'react';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface Student {
  id: number;
  email: string;
  full_name: string;
  level: string | null;
}

export interface PendingCandidate {
  postulation_id: number;
  student_id: number;
  full_name: string;
}

export interface Instance {
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
  pending?: PendingCandidate[];
}

export interface WeekDay {
  date: string;
  instances: Instance[];
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const MODALITIES: Record<string, string> = {
  fija: 'Fija',
  abierta: 'Abierta',
  extra: 'Extra'
};

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return formatDate(new Date());
}

export function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return formatDate(date);
}

export function weekdayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
}

export function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  return `${label[0].toUpperCase()}${label.slice(1)}`;
}

/** Lunes de la semana que contiene dateStr. */
export function startOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const offset = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return shiftDate(dateStr, -offset);
}

/** 'YYYY-MM' ± delta → 'YYYY-MM' (para el mini-calendario). */
export function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric'
  });
  return `${label[0].toUpperCase()}${label.slice(1)}`;
}

/** Celdas del mes: null (huecos iniciales) + días 1..N. Lunes primero. */
export function monthDays(monthStr: string): (number | null)[] {
  const [y, m] = monthStr.split('-').map(Number);
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const total = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

export function pendingCount(instance: Instance): number {
  return instance.pending?.length ?? 0;
}

// Borde de tarjeta = cupo. Extras (lote 3): contorno verde uniforme por rama
// propia en el render; acá solo cupo/cancelada.
export function cupoColor(instance: Instance): string {
  const used = instance.students.length;
  if (instance.status === 'cancelada') return 'border-l-gray-300 opacity-60';
  if (instance.modality === 'extra') return '';
  if (used >= instance.max_students) return 'border-l-red-500';
  return 'border-l-polvo';
}

export function cupoBadge(instance: Instance): { text: string; className: string } {
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
}

export function isInProgress(instance: Instance, isToday: boolean, selectedDate: string): boolean {
  if (!isToday || instance.status !== 'programada') return false;
  const nowMs = Date.now();
  const s = Date.parse(`${selectedDate}T${instance.start_hour.slice(0, 8)}-03:00`);
  const e = Date.parse(`${selectedDate}T${instance.end_hour.slice(0, 8)}-03:00`);
  if (Number.isNaN(s) || Number.isNaN(e)) return false;
  return nowMs >= s && nowMs < e;
}

export function classNamesNames(instance: Instance): string {
  return instance.students.map((s) => s.full_name.toUpperCase()).join(' / ');
}

/** Props del bloque de vista que comparten page.tsx con TableroA/B/C. */
export interface TableroVistaProps {
  view: 'day' | 'week';
  setView: Dispatch<SetStateAction<'day' | 'week'>>;
  selectedDate: string;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  changeDay: (delta: number) => void;
  dayData: Instance[];
  weekData: WeekDay[];
  loading: boolean;
  error: string;
  isToday: boolean;
  openSheet: (instance: Instance) => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  dayRows: string[];
  instancesByHour: Record<string, Instance[]>;
}
