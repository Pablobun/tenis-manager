const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { ensureDebtForEnrollment } = require('../services/billing');
const { enrichInstancesWithStudents } = require('../services/instances');
const { notifyClassChange } = require('../services/mailer');

const router = express.Router();

// Datos de una clase + alumno + profe, con la forma que espera notifyClassChange
async function getClassParticipants(instanceId, studentId) {
  const [instRows] = await db.query(
    `SELECT i.fecha, i.hora_inicio, i.hora_fin, i.modalidad,
            p.email as profe_email, p.nombre_completo as profe_nombre
     FROM instancias_clases i
     JOIN perfiles p ON i.profesor_id = p.id
     WHERE i.id = ?`,
    [instanceId]
  );
  if (instRows.length === 0) return null;
  const inst = instRows[0];
  const [stRows] = await db.query('SELECT email, nombre_completo FROM perfiles WHERE id = ?', [studentId]);
  return {
    instance: {
      instance_date: inst.fecha,
      start_hour: inst.hora_inicio,
      end_hour: inst.hora_fin,
      modality: inst.modalidad,
      professor_name: inst.profe_nombre
    },
    student: stRows.length ? { email: stRows[0].email, nombre: stRows[0].nombre_completo } : null,
    profe: { email: inst.profe_email, nombre: inst.profe_nombre }
  };
}

// GET /board/day?date=YYYY-MM-DD
router.get('/day', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Parámetro date requerido (YYYY-MM-DD)' });
  }

  try {
    const [rows] = await db.query(
      `SELECT i.id, i.plantilla_id as template_id, i.profesor_id, i.fecha as instance_date, 
      i.hora_inicio as start_hour, i.hora_fin as end_hour, i.nivel, i.modalidad, 
      i.cupo_maximo as max_students, i.precio, i.estado as status,
      p.nombre_completo as professor_name
      FROM instancias_clases i
      JOIN perfiles p ON i.profesor_id = p.id
      WHERE i.fecha = ? 
      ORDER BY i.hora_inicio`,
      [date]
    );

    const enriched = await enrichInstancesWithStudents(rows);
    res.json({ date, instances: enriched });
  } catch (err) {
    console.error('Error en tablero diario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /board/week?date=YYYY-MM-DD (fecha dentro de la semana, calcula lunes a domingo)
router.get('/week', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Parámetro date requerido (YYYY-MM-DD)' });
  }

  try {
    const baseDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = baseDate.getDay(); // 0 = Dom, 1 = Lun...
    const diffToMonday = (dayOfWeek + 6) % 7;

    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - diffToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }

    const startDate = weekDays[0];
    const endDate = weekDays[6];

    const [rows] = await db.query(
      `SELECT i.id, i.plantilla_id as template_id, i.profesor_id, i.fecha as instance_date, 
      i.hora_inicio as start_hour, i.hora_fin as end_hour, i.nivel, i.modalidad, 
      i.cupo_maximo as max_students, i.precio, i.estado as status,
      p.nombre_completo as professor_name
      FROM instancias_clases i
      JOIN perfiles p ON i.profesor_id = p.id
      WHERE i.fecha BETWEEN ? AND ? 
      ORDER BY i.fecha, i.hora_inicio`,
      [startDate, endDate]
    );

    const enriched = await enrichInstancesWithStudents(rows);

    const byDate = {};
    for (const d of weekDays) {
      byDate[d] = [];
    }
    for (const inst of enriched) {
      if (byDate[inst.instance_date]) {
        byDate[inst.instance_date].push(inst);
      }
    }

    const weekResult = weekDays.map((d) => ({
      date: d,
      instances: byDate[d]
    }));

    res.json({ week: weekResult });
  } catch (err) {
    console.error('Error en tablero semanal:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /board/mine — mis clases del alumno (fijas + abiertas asignadas) + saldo de deuda
router.get('/mine', authenticateToken, authorizeRoles('alumno'), async (req, res) => {
  try {
    const [classes] = await db.query(
      `SELECT i.id, i.plantilla_id as template_id, i.profesor_id, i.fecha as instance_date,
             i.hora_inicio as start_hour, i.hora_fin as end_hour, i.nivel as level,
             i.modalidad as modality, i.cupo_maximo as max_students, i.precio as price,
             i.estado as status, p.nombre_completo as professor_name
      FROM grupo_alumnos ga
      JOIN grupos g ON ga.grupo_id = g.id
      JOIN instancias_clases i ON g.instancia_id = i.id
      JOIN perfiles p ON i.profesor_id = p.id
      WHERE ga.alumno_id = ?
      ORDER BY i.fecha, i.hora_inicio`,
      [req.user.id]
    );

    const [debtRows] = await db.query(
      `SELECT COALESCE(SUM(monto - monto_pagado), 0) as balance
       FROM deudas
       WHERE alumno_id = ? AND estado IN ('pendiente', 'parcial')`,
      [req.user.id]
    );

    const [saldoRows] = await db.query(
      'SELECT COALESCE(saldo_a_favor, 0) as saldo FROM perfiles WHERE id = ?',
      [req.user.id]
    );
    const saldoAFavor = Number(saldoRows[0].saldo);
    const balance = Number(debtRows[0].balance) - saldoAFavor;

    res.json({ classes, balance, saldo_a_favor: saldoAFavor });
  } catch (err) {
    console.error('Error obteniendo clases del alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para inscripción / reasignación (Ticket 06 foundation)
// force: la profe/admin agrega a un alumno a pesar de estar el cupo completo (item 3)
router.post('/enroll', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { instance_id, student_id, force } = req.body;
  if (!instance_id || !student_id) {
    return res.status(400).json({ error: 'instance_id y student_id requeridos' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar si ya existe un grupo para esta instancia
    const [groups] = await connection.query('SELECT id FROM grupos WHERE instancia_id = ? LIMIT 1', [instance_id]);
    let groupId;

    if (groups.length === 0) {
      const [gRes] = await connection.query('INSERT INTO grupos (instancia_id, nombre) VALUES (?, ?)', [instance_id, 'Grupo Principal']);
      groupId = gRes.insertId;
    } else {
      groupId = groups[0].id;
    }

    // Verificar cupo (se salta con force)
    if (!force) {
      const [instRows] = await connection.query('SELECT cupo_maximo FROM instancias_clases WHERE id = ?', [instance_id]);
      const maxStudents = instRows[0].cupo_maximo;

      const [countRows] = await connection.query('SELECT COUNT(*) as total FROM grupo_alumnos WHERE grupo_id = ?', [groupId]);
      if (countRows[0].total >= maxStudents) {
        await connection.rollback();
        return res.status(400).json({ error: 'Cupo máximo alcanzado para esta clase' });
      }
    }

    await connection.query('INSERT IGNORE INTO grupo_alumnos (grupo_id, alumno_id) VALUES (?, ?)', [groupId, student_id]);

    // Sincronizar postulación: si existe, pasa a aceptada (evita duplicados en extras)
    await connection.query(
      `INSERT INTO postulaciones (alumno_id, instancia_id, estado, respondida_en)
       VALUES (?, ?, 'aceptada', NOW())
       ON DUPLICATE KEY UPDATE estado = 'aceptada', respondida_en = NOW()`,
      [student_id, instance_id]
    );

    // Si es una clase fija, generar deuda de mensualidad al momento de la inscripción
    await ensureDebtForEnrollment(connection, student_id, instance_id);

    await connection.commit();

    const parts = await getClassParticipants(instance_id, student_id);
    if (parts) {
      notifyClassChange({ action: 'inscripcion', ...parts, actorEmail: req.user.email }).catch(() => {});
    }

    res.json({ message: 'Alumno inscripto exitosamente' });
  } catch (err) {
    await connection.rollback();
    console.error('Error inscribiendo alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Remover alumno de instancia
router.delete('/enroll', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { instance_id, student_id } = req.body;
  if (!instance_id || !student_id) {
    return res.status(400).json({ error: 'instance_id y student_id requeridos' });
  }

  try {
    await db.query(
      `DELETE ga FROM grupo_alumnos ga 
      JOIN grupos g ON ga.grupo_id = g.id 
      WHERE g.instancia_id = ? AND ga.alumno_id = ?`,
      [instance_id, student_id]
    );
    // La baja es solo de la instancia puntual (fija no toca mensualidad).
    // Si tenía postulación aceptada, marcar cancelada para poder re-inscribirse.
    await db.query(
      `UPDATE postulaciones SET estado = 'cancelada', respondida_en = NOW()
       WHERE alumno_id = ? AND instancia_id = ? AND estado IN ('pendiente', 'aceptada', 'lista_espera')`,
      [student_id, instance_id]
    );

    const parts = await getClassParticipants(instance_id, student_id);
    if (parts) {
      notifyClassChange({ action: 'baja', ...parts, actorEmail: req.user.email }).catch(() => {});
    }

    res.json({ message: 'Alumno removido de la clase exitosamente' });
  } catch (err) {
    console.error('Error removiendo alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Baja propia del alumno (items 1/2/4): válida solo hasta 24h antes del inicio.
// Siempre es de la instancia puntual: una baja en clase fija no elimina la
// mensualidad ni saca al alumno del grupo/mes.
router.post('/drop', authenticateToken, authorizeRoles('alumno'), async (req, res) => {
  const { instance_id } = req.body;
  if (!instance_id) {
    return res.status(400).json({ error: 'instance_id requerido' });
  }

  try {
    const [instRows] = await db.query(
      'SELECT fecha, hora_inicio, hora_fin, estado, modalidad FROM instancias_clases WHERE id = ?',
      [instance_id]
    );
    if (instRows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    const inst = instRows[0];

    const [enrolled] = await db.query(
      `SELECT ga.id FROM grupo_alumnos ga
       JOIN grupos g ON ga.grupo_id = g.id
       WHERE g.instancia_id = ? AND ga.alumno_id = ?`,
      [instance_id, req.user.id]
    );
    if (enrolled.length === 0) {
      return res.status(404).json({ error: 'No estás inscripto en esta clase' });
    }

    if (inst.estado !== 'programada') {
      return res.status(400).json({ error: 'Esta clase ya no admite bajas' });
    }

    // Ventana de 24h antes del inicio (Argentina, UTC-3 sin horario de verano)
    const startMs = Date.parse(`${inst.fecha}T${inst.hora_inicio}-03:00`);
    const deadline = startMs - 24 * 60 * 60 * 1000;
    if (Date.now() >= deadline) {
      return res.status(403).json({
        error: 'No podés darte de baja con menos de 24 horas de anticipación. Contactá a la profesora.'
      });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        `DELETE ga FROM grupo_alumnos ga
         JOIN grupos g ON ga.grupo_id = g.id
         WHERE g.instancia_id = ? AND ga.alumno_id = ?`,
        [instance_id, req.user.id]
      );
      await connection.query(
        `UPDATE postulaciones SET estado = 'cancelada', respondida_en = NOW()
         WHERE alumno_id = ? AND instancia_id = ? AND estado IN ('pendiente', 'aceptada', 'lista_espera')`,
        [req.user.id, instance_id]
      );
      await connection.commit();
    } catch (errTx) {
      await connection.rollback();
      throw errTx;
    } finally {
      connection.release();
    }

    const parts = await getClassParticipants(instance_id, req.user.id);
    if (parts) {
      notifyClassChange({ action: 'baja', ...parts, actorEmail: req.user.email }).catch(() => {});
    }

    res.json({ message: 'Baja registrada. Nos vemos en la próxima.' });
  } catch (err) {
    console.error('Error dando de baja al alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
