'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LevelChip from '@/components/LevelChip';
import { suggestExtraPrice } from '@/lib/extraPrice';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Profesor {
  id: number;
  full_name: string;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
}

interface StudentRef {
  id: number;
  full_name: string;
  level: string | null;
}

interface Template {
  id: number;
  modality: string;
  level: string | null;
  price_per_class: string;
  is_active: number;
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
  pending_candidates: number;
  students?: StudentRef[];
}

interface Candidate {
  postulation_id: number;
  status: string;
  posted_at: string;
  student_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  level: string | null;
  balance: number;
  balance_favor: number;
}

interface AttendanceItem {
  student_id: number;
  full_name: string;
  asistio: number;
}

const LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' }
];

const EMPTY_FORM = {
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  nivel: 'intermedio',
  cupo_maximo: '4',
  price: '',
  modalidad: 'abierta',
  profesor_id: ''
};

const MODALITIES = [
  { value: 'abierta', label: 'Abierta / Rotativa' },
  { value: 'extra', label: 'Extra' }
];

export default function ClasesAbiertasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<OpenClass[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<OpenClass | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [candidates, setCandidates] = useState<Record<number, Candidate[]>>({});
  const [loadingCandidates, setLoadingCandidates] = useState<Record<number, boolean>>({});
  const [expandedCandidates, setExpandedCandidates] = useState<Record<number, boolean>>({});
  const [attendance, setAttendance] = useState<Record<number, AttendanceItem[]>>({});
  const [loadingAttendance, setLoadingAttendance] = useState<Record<number, boolean>>({});
  const [expandedAttendance, setExpandedAttendance] = useState<Record<number, boolean>>({});
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedInscriptos, setExpandedInscriptos] = useState<Record<number, boolean>>({});
  const [addStudentSel, setAddStudentSel] = useState<Record<number, string>>({});

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

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al cargar clases abiertas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchProfesores();
      fetchStudents();
      fetchTemplates();
      if (user.role === 'profesor') {
        setForm((f) => ({ ...f, profesor_id: String(user.id) }));
      }
    }
  }, [user, fetchClasses]);

  const fetchProfesores = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/students/profesores`, {
        credentials: 'include'
      });
      if (res.ok) {
        setProfesores(await res.json());
      }
    } catch (err) {
      console.error('Error fetching profesores:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/students`, { credentials: 'include' });
      if (res.ok) {
        setAllStudents(await res.json());
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/templates`, { credentials: 'include' });
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  // F4b (lote 3): quitar un inscripto desde la vista de Clases Abiertas
  const handleQuitarInscripto = async (classId: number, studentId: number, name: string) => {
    if (!confirm(`¿Quitar a ${name} de esta clase?`)) return;
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/board/enroll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instance_id: classId, student_id: studentId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al quitar al alumno');
        return;
      }
      setInfo('Alumno quitado de la clase');
      fetchClasses();
      setCandidates((prev) => { const next = { ...prev }; delete next[classId]; return next; });
      setAttendance((prev) => { const next = { ...prev }; delete next[classId]; return next; });
    } catch (err) {
      setError('Error de conexión');
    }
  };

  // F4b (lote 3): agregar inscripto (forzar si el cupo está completo)
  const handleAgregarInscripto = async (classId: number, isFull: boolean) => {
    const studentId = Number(addStudentSel[classId] || 0);
    if (!studentId) return;
    if (isFull && !confirm('Cupo completo. ¿Agregar a este alumno igual? (excepción)')) return;
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/board/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instance_id: classId, student_id: studentId, force: isFull })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al agregar al alumno');
        return;
      }
      setInfo(data.message || 'Alumno inscripto');
      setAddStudentSel((prev) => ({ ...prev, [classId]: '' }));
      fetchClasses();
      setCandidates((prev) => { const next = { ...prev }; delete next[classId]; return next; });
      setAttendance((prev) => { const next = { ...prev }; delete next[classId]; return next; });
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (form.hora_inicio >= form.hora_fin) {
      setError('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    const body = {
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      nivel: form.nivel,
      cupo_maximo: Number(form.cupo_maximo),
      precio: Number(form.price),
      modalidad: form.modalidad,
      profesor_id: form.profesor_id ? Number(form.profesor_id) : undefined
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const url = editingClass
        ? `${apiUrl}/api/instances/open/${editingClass.id}`
        : `${apiUrl}/api/instances/open`;
      const method = editingClass ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        return;
      }

      setInfo(editingClass ? 'Clase actualizada con éxito' : 'Clase creada con éxito');
      setShowForm(false);
      setEditingClass(null);
      setForm(EMPTY_FORM);
      fetchClasses();
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleEdit = (c: OpenClass) => {
    setEditingClass(c);
    // YYYY-MM-DD
    const dateStr = c.instance_date.split('T')[0];
    setForm({
      fecha: dateStr,
      hora_inicio: c.start_hour.slice(0, 5),
      hora_fin: c.end_hour.slice(0, 5),
      nivel: c.level,
      cupo_maximo: String(c.max_students),
      price: c.price,
      modalidad: c.modality || 'abierta',
      profesor_id: c.profesor_id ? String(c.profesor_id) : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (classId: number) => {
    if (!confirm('¿Seguro que querés eliminar esta clase abierta?')) return;
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open/${classId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al eliminar');
        return;
      }
      setInfo('Clase abierta eliminada correctamente');
      fetchClasses();
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const toggleCandidates = useCallback(
    async (classId: number) => {
      const next = { ...expandedCandidates, [classId]: !expandedCandidates[classId] };
      setExpandedCandidates(next);
      if (!expandedCandidates[classId] && candidates[classId] === undefined) {
        setLoadingCandidates((prev) => ({ ...prev, [classId]: true }));
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const res = await fetch(`${apiUrl}/api/instances/open/${classId}/candidates`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setCandidates((prev) => ({ ...prev, [classId]: data.candidates || [] }));
          }
        } catch (err) {
          console.error('Error fetching candidates:', err);
        } finally {
          setLoadingCandidates((prev) => ({ ...prev, [classId]: false }));
        }
      }
    },
    [candidates, expandedCandidates]
  );

  const handleCandidateAction = async (classId: number, postulationId: number, action: 'accept' | 'reject' | 'override') => {
    setError('');
    setInfo('');
    if ((action === 'accept' || action === 'override') && !confirm('¿Confirmar la decisión sobre este candidato?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/instances/open/${classId}/candidates/${postulationId}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al procesar el candidato');
        return;
      }
      setInfo(data.message || 'Candidato procesado');
      // Refrescar candidatos y clases (el cupo pudo cambiar)
      toggleCandidates(classId);
      fetchClasses();
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const toggleAttendance = useCallback(
    async (classId: number) => {
      const next = { ...expandedAttendance, [classId]: !expandedAttendance[classId] };
      setExpandedAttendance(next);
      if (!expandedAttendance[classId] && attendance[classId] === undefined) {
        setLoadingAttendance((prev) => ({ ...prev, [classId]: true }));
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const res = await fetch(`${apiUrl}/api/asistencias/${classId}`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setAttendance((prev) => ({ ...prev, [classId]: data.attendance || [] }));
          }
        } catch (err) {
          console.error('Error fetching attendance:', err);
        } finally {
          setLoadingAttendance((prev) => ({ ...prev, [classId]: false }));
        }
      }
    },
    [attendance, expandedAttendance]
  );

  const toggleAsistio = (classId: number, studentId: number) => {
    setAttendance((prev) => {
      const list = prev[classId] || [];
      return {
        ...prev,
        [classId]: list.map((a) =>
          a.student_id === studentId ? { ...a, asistio: a.asistio ? 0 : 1 } : a
        )
      };
    });
  };

  const saveAttendance = async (classId: number) => {
    setError('');
    setInfo('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/asistencias/${classId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          attendance: (attendance[classId] || []).map((a) => ({ student_id: a.student_id, asistio: !!a.asistio }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar asistencia');
        return;
      }
      setInfo(data.message || 'Asistencia guardada correctamente');
    } catch (err) {
      setError('Error de conexión');
    }
  };

  // P7 (lote 3): sugerencia de 50% para extras — pre-carga editable
  const sugeridoExtra = suggestExtraPrice(templates, form.nivel);

  if (!user) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Clases Abiertas" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold">Clases Abiertas / Rotativas y Extras</h2>
            <p className="text-sm text-muted">Abiertas: los alumnos se postulan. Extras: inscripción directa al cupo.</p>
          </div>
          <button
            onClick={() => {
              setEditingClass(null);
              setForm({ ...EMPTY_FORM, profesor_id: user.role === 'profesor' ? String(user.id) : '' });
              setShowForm(true);
            }}
            className={showForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
          >
            + Nueva Clase
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{info}</div>
        )}

        {showForm && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">
              {editingClass ? 'Editar Clase' : 'Nueva Clase'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Modalidad</label>
                  <select
                    value={form.modalidad}
                    onChange={(e) => {
                      const m = e.target.value;
                      setForm((f) => ({
                        ...f,
                        modalidad: m,
                        // P7: al elegir extra en una clase nueva, pre-cargar 50% de la fija del nivel
                        price:
                          m === 'extra' && !editingClass && !f.price
                            ? String(suggestExtraPrice(templates, f.nivel) ?? '')
                            : f.price
                      }));
                    }}
                    className="input"
                    required
                  >
                    {MODALITIES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Nivel sugerido</label>
                  <select
                    value={form.nivel}
                    onChange={(e) => {
                      const lvl = e.target.value;
                      setForm((f) => ({
                        ...f,
                        nivel: lvl,
                        price:
                          f.modalidad === 'extra' && !editingClass && !f.price
                            ? String(suggestExtraPrice(templates, lvl) ?? '')
                            : f.price
                      }));
                    }}
                    className="input"
                    required
                  >
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Profesor/a</label>
                  <select
                    value={form.profesor_id}
                    onChange={(e) => setForm({ ...form, profesor_id: e.target.value })}
                    className="input"
                  >
                    <option value="">{user.role === 'profesor' ? 'Yo (profesor/a)' : '— Seleccionar —'}</option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Hora inicio</label>
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Hora fin</label>
                  <input
                    type="time"
                    value={form.hora_fin}
                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Cupo máximo de alumnos</label>
                  <input
                    type="number"
                    min="1"
                    value={form.cupo_maximo}
                    onChange={(e) => setForm({ ...form, cupo_maximo: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                  {form.modalidad === 'extra' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {sugeridoExtra !== null
                        ? `Sugerido: 50% de la clase habitual = $${sugeridoExtra.toLocaleString('es-AR')} (editable).`
                        : 'Sugerido: 50% de la clase habitual.'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingClass ? 'Guardar Cambios' : 'Crear Clase'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClass(null);
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando clases abiertas...</p>
        ) : classes.length === 0 ? (
          <p className="text-gray-500">No hay clases abiertas registradas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {classes.map((c) => {
              const d = new Date(`${c.instance_date.split('T')[0]}T12:00:00`);
              const label = d.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              });
              const capitalizedLabel = `${label[0].toUpperCase()}${label.slice(1)}`;

              return (
                <div
                  key={c.id}
                  className={`card ${c.modality === 'extra' ? 'card-extra' : 'card-accent border-l-polvo'} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-ink">{capitalizedLabel}</h4>
                      <span className={`chip ${c.status === 'cancelada' ? 'bg-cal text-muted border border-line' : 'bg-green-50 text-green-700'}`}>
                        {c.status === 'cancelada' ? 'Cancelada' : 'Programada'}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      Horario: {c.start_hour.slice(0, 5)} - {c.end_hour.slice(0, 5)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <LevelChip level={c.level} />
                      <span className={`chip ${c.modality === 'extra' ? 'bg-green-100 text-green-800' : 'bg-cal text-muted border border-line'}`}>
                        {c.modality === 'extra' ? 'Extra' : 'Abierta'}
                      </span>
                      {c.professor_name && (
                        <span className="text-xs text-muted">· {c.professor_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted">Precio: ${c.price}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <p className="text-sm font-semibold text-ink">
                        Cupo: {c.enrolled_count}/{c.max_students} alumnos inscriptos
                      </p>
                      {c.pending_candidates > 0 && (
                        <span className="chip bg-primary-50 text-primary-700">
                          {c.pending_candidates} postulante{c.pending_candidates > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line justify-end">
                    <button
                      onClick={() =>
                        setExpandedInscriptos((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                      }
                      className="text-polvo hover:text-polvo-dark text-sm font-semibold px-3 py-1 rounded hover:bg-cal"
                    >
                      {expandedInscriptos[c.id]
                        ? 'Ocultar inscriptos'
                        : `Inscriptos (${(c.students || []).length})`}
                    </button>
                    <button
                      onClick={() => toggleCandidates(c.id)}
                      className="text-polvo hover:text-polvo-dark text-sm font-semibold px-3 py-1 rounded hover:bg-cal"
                    >
                      {expandedCandidates[c.id]
                        ? 'Ocultar'
                        : c.modality === 'extra'
                          ? 'Lista de espera'
                          : 'Candidatos'}
                    </button>
                    <button
                      onClick={() => toggleAttendance(c.id)}
                      className="text-polvo hover:text-polvo-dark text-sm font-semibold px-3 py-1 rounded hover:bg-cal"
                    >
                      {expandedAttendance[c.id] ? 'Ocultar asistencia' : 'Asistencia'}
                    </button>
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-polvo hover:text-polvo-dark text-sm font-semibold px-3 py-1 rounded hover:bg-cal"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold px-3 py-1 rounded hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>

                  {expandedInscriptos[c.id] && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <h5 className="text-sm font-semibold text-ink mb-3">
                        Alumnos inscriptos ({(c.students || []).length})
                      </h5>
                      {(c.students || []).length === 0 ? (
                        <p className="text-sm text-muted">No hay alumnos inscriptos.</p>
                      ) : (
                        <ul className="space-y-2">
                          {(c.students || []).map((s) => (
                            <li
                              key={s.id}
                              className="flex items-center justify-between gap-2 bg-cal rounded-xl p-3 border border-line"
                            >
                              <div>
                                <p className="text-sm font-semibold">{s.full_name}</p>
                                {s.level && <p className="text-xs text-muted">Nivel: {s.level}</p>}
                              </div>
                              <button
                                onClick={() => handleQuitarInscripto(c.id, s.id, s.full_name)}
                                className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded hover:bg-red-600"
                              >
                                Quitar
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2 mt-3">
                        <select
                          value={addStudentSel[c.id] || ''}
                          onChange={(e) =>
                            setAddStudentSel((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          className="input flex-1"
                        >
                          <option value="">— Agregar alumno —</option>
                          {allStudents
                            .filter((s) => !(c.students || []).some((st) => st.id === s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.full_name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() =>
                            handleAgregarInscripto(c.id, c.enrolled_count >= c.max_students)
                          }
                          disabled={!addStudentSel[c.id]}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          Inscribir
                        </button>
                      </div>
                      {c.enrolled_count >= c.max_students && (
                        <p className="text-xs text-muted mt-1">
                          Cupo completo: agregar igualmente queda como excepción.
                        </p>
                      )}
                    </div>
                  )}

                  {expandedCandidates[c.id] && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <h5 className="text-sm font-semibold text-ink mb-3">
                        {c.modality === 'extra' ? 'Alumnos esperando cupo' : 'Postulaciones recibidas'}
                      </h5>
                      {loadingCandidates[c.id] ? (
                        <p className="text-sm text-muted">Cargando...</p>
                      ) : (candidates[c.id] || []).length === 0 ? (
                        <p className="text-sm text-muted">
                          {c.modality === 'extra'
                            ? 'No hay alumnos esperando cupo.'
                            : 'No hay postulaciones para esta clase.'}
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {(candidates[c.id] || []).map((cd) => (
                            <li key={cd.postulation_id} className="bg-cal rounded-xl p-3 border border-line">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="text-sm font-semibold">{cd.full_name}</p>
                                  <p className="text-xs text-muted">
                                    {cd.level ? `Nivel: ${cd.level} · ` : ''}
                                    {(() => {
                                      const net = Number(cd.balance) - Number(cd.balance_favor);
                                      if (net > 0) return `Deuda neta: $${net.toLocaleString('es-AR')}`;
                                      if (net < 0) return `Saldo a favor: $${Math.abs(net).toLocaleString('es-AR')}`;
                                      return 'Sin deuda';
                                    })()}
                                  </p>
                                  <span className={`inline-block mt-1 chip ${
                                    cd.status === 'pendiente' ? 'bg-primary-50 text-primary-700' : 'bg-cal text-muted border border-line'
                                  }`}>
                                    {cd.status === 'pendiente' ? 'Pendiente' : cd.status === 'lista_espera' ? 'Lista de espera' : cd.status}
                                  </span>
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end">
                                  {cd.status === 'pendiente' && (
                                    <>
                                      <button
                                        onClick={() => handleCandidateAction(c.id, cd.postulation_id, 'accept')}
                                        className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded hover:bg-green-700"
                                      >
                                        Aceptar
                                      </button>
                                      <button
                                        onClick={() => handleCandidateAction(c.id, cd.postulation_id, 'reject')}
                                        className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded hover:bg-red-600"
                                      >
                                        Rechazar
                                      </button>
                                      <button
                                        onClick={() => handleCandidateAction(c.id, cd.postulation_id, 'override')}
                                        title="Forzar aceptación a pesar de deuda o cupo"
                                        className="bg-ink text-white text-xs font-semibold px-2 py-1 rounded hover:bg-black"
                                      >
                                        Forzar
                                      </button>
                                    </>
                                  )}
                                  {cd.status === 'lista_espera' && (
                                    <>
                                      {c.modality === 'extra' && (
                                        <button
                                          onClick={() => handleCandidateAction(c.id, cd.postulation_id, 'accept')}
                                          title="Agregar si hay cupo libre"
                                          className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded hover:bg-green-700"
                                        >
                                          Agregar
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleCandidateAction(c.id, cd.postulation_id, 'override')}
                                        className="bg-ink text-white text-xs font-semibold px-2 py-1 rounded hover:bg-black"
                                      >
                                        Forzar ingreso
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {expandedAttendance[c.id] && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <h5 className="text-sm font-semibold text-ink mb-3">Asistencia</h5>
                      {loadingAttendance[c.id] ? (
                        <p className="text-sm text-muted">Cargando asistencia...</p>
                      ) : (attendance[c.id] || []).length === 0 ? (
                        <p className="text-sm text-muted">Aún no hay alumnos inscriptos.</p>
                      ) : (
                        <>
                          <ul className="space-y-2">
                            {(attendance[c.id] || []).map((a) => (
                              <li key={a.student_id} className="flex items-center justify-between">
                                <span className="text-sm">{a.full_name}</span>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!a.asistio}
                                    onChange={() => toggleAsistio(c.id, a.student_id)}
                                    className="w-4 h-4 accent-polvo"
                                  />
                                  <span className="text-sm text-muted">{a.asistio ? 'Asistió' : 'No asistió'}</span>
                                </label>
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => saveAttendance(c.id)}
                            className="mt-4 btn-primary text-sm"
                          >
                            Guardar asistencia
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
