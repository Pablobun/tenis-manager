const db = require('../db');

// Agrega students[] a filas ya armadas (sin tocar sus otros campos).
// Fuente: grupos/grupo_alumnos por instancia (mismo criterio que el tablero).
async function attachStudents(rows) {
  if (rows.length === 0) return rows;

  const instanceIds = rows.map((r) => r.id);
  const placeholders = instanceIds.map(() => '?').join(',');

  const [links] = await db.query(
    `SELECT g.instancia_id, p.id as student_id, p.nombre_completo as full_name, p.nivel as level
    FROM grupos g
    JOIN grupo_alumnos ga ON g.id = ga.grupo_id
    JOIN perfiles p ON ga.alumno_id = p.id
    WHERE g.instancia_id IN (${placeholders})`,
    instanceIds
  );

  const studentsByInstance = {};
  for (const link of links) {
    if (!studentsByInstance[link.instancia_id]) {
      studentsByInstance[link.instancia_id] = [];
    }
    studentsByInstance[link.instancia_id].push({
      id: link.student_id,
      full_name: link.full_name,
      level: link.level
    });
  }

  for (const row of rows) {
    row.students = studentsByInstance[row.id] || [];
  }
  return rows;
}

// Postulaciones pendientes por instancia (issue 17): el tablero le muestra al profe
// que hay postulantes esperando confirmación y puede aceptarlos desde el calendario.
// Va solo en enrichInstancesWithStudents (NO en attachStudents, para no pisar el
// contador pending_candidates que /open calcula en su propio SELECT).
async function attachPendingCandidates(rows) {
  if (rows.length === 0) return rows;

  const instanceIds = rows.map((r) => r.id);
  const placeholders = instanceIds.map(() => '?').join(',');

  const [links] = await db.query(
    `SELECT p.instancia_id, p.id as postulation_id, a.id as student_id, a.nombre_completo as full_name
     FROM postulaciones p
     JOIN perfiles a ON p.alumno_id = a.id
     WHERE p.instancia_id IN (${placeholders}) AND p.estado = 'pendiente'
     ORDER BY p.postulada_en ASC`,
    instanceIds
  );

  const pendingByInstance = {};
  for (const link of links) {
    if (!pendingByInstance[link.instancia_id]) {
      pendingByInstance[link.instancia_id] = [];
    }
    pendingByInstance[link.instancia_id].push({
      postulation_id: link.postulation_id,
      student_id: link.student_id,
      full_name: link.full_name
    });
  }

  for (const row of rows) {
    row.pending = pendingByInstance[row.id] || [];
  }
  return rows;
}

// Enriquecer instancias con sus alumnos (y profesor). Reutilizado por tablero e instancias.
async function enrichInstancesWithStudents(instances) {
  if (instances.length === 0) return [];

  const mapped = instances.map((inst) => ({
    id: inst.id,
    template_id: inst.template_id,
    profesor_id: inst.profesor_id,
    professor_name: inst.professor_name,
    instance_date: inst.instance_date,
    start_hour: inst.start_hour,
    end_hour: inst.end_hour,
    level: inst.level,
    modality: inst.modality,
    max_students: inst.max_students,
    price: inst.price,
    status: inst.status
  }));

  await attachStudents(mapped);
  return attachPendingCandidates(mapped);
}

// Genera instancias para un mes dado (YYYY-MM) basándose en las plantillas activas.
// includePast: si es false, no genera fechas anteriores a hoy (item 14).
async function generateInstancesForMonth(yearMonth, { includePast = true } = {}) {
  const [year, month] = yearMonth.split('-').map(Number);
  if (!year || !month) throw new Error('Formato de mes inválido (YYYY-MM)');

  // Obtener todas las plantillas activas
  const [templates] = await db.query(
    'SELECT * FROM plantillas_clases WHERE activa = 1'
  );

  let generatedCount = 0;

  // Calcular días del mes
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  for (const t of templates) {
    // Item 5 (cambios.txt): las fijas se replican con su roster (plantilla_alumnos);
    // extras y abiertas se generan sin alumnos.
    let roster = [];
    if (t.modalidad === 'fija') {
      const [rosterRows] = await db.query(
        'SELECT alumno_id FROM plantilla_alumnos WHERE plantilla_id = ?',
        [t.id]
      );
      roster = rosterRows.map((r) => r.alumno_id);
    }

    // dia_semana: 0 = Lunes, ..., 6 = Domingo en nuestra convención (ver dayOfweek)
    // En JS Date: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    // Mapeo JS day to nuestra convención (0=Lunes..6=Domingo): (jsDay + 6) % 7
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const jsDay = dateObj.getDay();
      const ourDay = (jsDay + 6) % 7;

      if (ourDay === t.dia_semana) {
        const yyyy = year;
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // item 14: omitir fechas ya pasadas del mes en curso cuando se pide solo futuras
        if (!includePast && dateStr < today) continue;

        try {
          const [res] = await db.query(
            `INSERT IGNORE INTO instancias_clases 
            (plantilla_id, profesor_id, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada')`,
            [
              t.id,
              t.profesor_id,
              dateStr,
              t.hora_inicio,
              t.hora_fin,
              t.nivel || 'intermedio',
              t.modalidad,
              t.cupo_maximo,
              t.precio_por_clase
            ]
          );
          if (res.affectedRows > 0) {
            generatedCount++;
            // Inscribir roster en la instancia recién creada (solo fijas nuevas)
            if (roster.length > 0) {
              try {
                const [groups] = await db.query('SELECT id FROM grupos WHERE instancia_id = ? LIMIT 1', [res.insertId]);
                let groupId;
                if (groups.length === 0) {
                  const [gRes] = await db.query('INSERT INTO grupos (instancia_id, nombre) VALUES (?, ?)', [res.insertId, 'Grupo Principal']);
                  groupId = gRes.insertId;
                } else {
                  groupId = groups[0].id;
                }
                for (const alumnoId of roster) {
                  await db.query('INSERT IGNORE INTO grupo_alumnos (grupo_id, alumno_id) VALUES (?, ?)', [groupId, alumnoId]);
                }
              } catch (errRoster) {
                console.error(`Error inscribiendo roster de plantilla ${t.id} en instancia ${res.insertId}:`, errRoster);
              }
            }
          }
        } catch (err) {
          console.error(`Error generando instancia para plantilla ${t.id} en fecha ${dateStr}:`, err);
        }
      }
    }
  }

  return generatedCount;
}

// Archivar las instancias futuras de una plantilla desactivada (issue 15):
// la serie se guarda como 'archivada' → no se ve en el calendario, no factura.
async function cancelFutureInstances(templateId) {
  const today = new Date().toISOString().split('T')[0];
  await db.query(
    "UPDATE instancias_clases SET estado = 'archivada' WHERE plantilla_id = ? AND fecha >= ? AND estado = 'programada'",
    [templateId, today]
  );
}

// Reactivar la serie archivada de una plantilla (issue 15): desde HOY en adelante,
// todas las filas ya generadas (todos los meses) vuelven a 'programada'.
// No toca fechas canceladas puntualmente (esas son estado 'cancelada').
async function reactivateFutureInstances(templateId) {
  const today = new Date().toISOString().split('T')[0];
  const [result] = await db.query(
    "UPDATE instancias_clases SET estado = 'programada' WHERE plantilla_id = ? AND fecha >= ? AND estado = 'archivada'",
    [templateId, today]
  );
  return result.affectedRows;
}

module.exports = {
  generateInstancesForMonth,
  cancelFutureInstances,
  reactivateFutureInstances,
  enrichInstancesWithStudents,
  attachStudents
};
