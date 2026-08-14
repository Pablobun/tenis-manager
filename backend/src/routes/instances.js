const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateInstancesForMonth, enrichInstancesWithStudents } = require('../services/instances');

const router = express.Router();

// Listar instancias por mes (?month=YYYY-MM) — enriquecidas con alumnos y profesor
router.get('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) {
    return res.status(400).json({ error: 'Parámetro month requerido (YYYY-MM)' });
  }

  try {
    const [rows] = await db.query(
      `SELECT i.id, i.plantilla_id as template_id, i.profesor_id, i.fecha as instance_date, 
      i.hora_inicio as start_hour, i.hora_fin as end_hour, i.nivel as level, i.modalidad, 
      i.cupo_maximo as max_students, i.precio as price, i.estado as status,
      p.nombre_completo as professor_name
      FROM instancias_clases i
      JOIN perfiles p ON i.profesor_id = p.id
      WHERE DATE_FORMAT(i.fecha, '%Y-%m') = ? 
      ORDER BY i.fecha, i.hora_inicio`,
      [month]
    );
    const enriched = await enrichInstancesWithStudents(rows);
    res.json(enriched);
  } catch (err) {
    console.error('Error listando instancias:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generar o regenerar instancias para un mes (?month=YYYY-MM) — item 14: include_past opcional
router.post('/generate', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.query; // YYYY-MM
  const { include_past } = req.body; // false = solo fechas futuras del mes
  if (!month) {
    return res.status(400).json({ error: 'Parámetro month requerido (YYYY-MM)' });
  }

  try {
    const includePast = include_past !== false;
    const count = await generateInstancesForMonth(month, { includePast });
    res.json({ message: `Generación completada. Se generaron ${count} nuevas instancias.`, count });
  } catch (err) {
    console.error('Error generando instancias:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
});

// Listar todas las clases abiertas (disponibles para postularse)
router.get('/open', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT i.id, i.plantilla_id as template_id, i.profesor_id, i.fecha as instance_date, 
             i.hora_inicio as start_hour, i.hora_fin as end_hour, i.nivel as level, i.modalidad as modality, 
             i.cupo_maximo as max_students, i.precio as price, i.estado as status,
             p.nombre_completo as professor_name,
             (SELECT COUNT(*) FROM grupo_alumnos ga JOIN grupos g ON ga.grupo_id = g.id WHERE g.instancia_id = i.id) as enrolled_count,
             (SELECT COUNT(*) FROM postulaciones po WHERE po.instancia_id = i.id AND po.estado = 'pendiente') as pending_candidates,
             (SELECT estado FROM postulaciones WHERE alumno_id = ? AND instancia_id = i.id) as postulation_status
      FROM instancias_clases i
      JOIN perfiles p ON i.profesor_id = p.id
      WHERE i.modalidad IN ('abierta', 'extra')
    `;

    const params = [req.user.id];
    
    // Si es alumno, sólo mostrar programadas y futuras/hoy
    if (req.user.rol === 'alumno') {
      query += ` AND i.estado = 'programada' AND i.fecha >= ?`;
      params.push(new Date().toISOString().split('T')[0]);
    }

    query += ` ORDER BY i.fecha, i.hora_inicio`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listando clases abiertas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Alumno se postula a una clase abierta/rotativa
router.post('/open/:id/postulate', authenticateToken, authorizeRoles('alumno'), async (req, res) => {
  const { force } = req.body; // force: la profe autorizó postularse con deuda (override)
  try {
    // Verificar si ya está inscripto
    const [enrolled] = await db.query(
      `SELECT ga.id FROM grupo_alumnos ga 
       JOIN grupos g ON ga.grupo_id = g.id 
       WHERE g.instancia_id = ? AND ga.alumno_id = ?`,
      [req.params.id, req.user.id]
    );

    if (enrolled.length > 0) {
      return res.status(400).json({ error: 'Ya estás inscripto en esta clase' });
    }

    // Verificar si ya postuló (permite re-postular si la anterior fue cancelada o rechazada)
    const [existing] = await db.query(
      'SELECT id, estado FROM postulaciones WHERE alumno_id = ? AND instancia_id = ?',
      [req.user.id, req.params.id]
    );

    if (existing.length > 0) {
      const currentState = existing[0].estado;
      if (currentState === 'pendiente' || currentState === 'aceptada' || currentState === 'lista_espera') {
        return res.status(400).json({ error: `Ya tienes una postulación en estado: ${currentState}` });
      }
    }

    // Regla de deuda (CONTEXT): deuda pendiente bloquea la postulación; se puede forzar por override.
    // item 15: el bloqueo usa el balance neto (deuda − saldo a favor).
    if (!force) {
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
      const balanceNeto = Number(debtRows[0].balance) - Number(saldoRows[0].saldo);
      if (balanceNeto > 0) {
        return res.status(400).json({ error: 'Tenés una deuda pendiente. Consultá a la profesora para postularte.' });
      }
    }

    // Verificar cupo: si está lleno, la postulación va directo a lista de espera
    const [instRows] = await db.query(
      'SELECT cupo_maximo FROM instancias_clases WHERE id = ?',
      [req.params.id]
    );
    if (instRows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const [enrolledCount] = await db.query(
      `SELECT COUNT(*) as total FROM grupo_alumnos ga JOIN grupos g ON ga.grupo_id = g.id
       WHERE g.instancia_id = ?`,
      [req.params.id]
    );

    const status = Number(enrolledCount[0].total) >= Number(instRows[0].cupo_maximo) ? 'lista_espera' : 'pendiente';

    // Si va directo a lista de espera, podría ocupar cupo de otro candidato, pero por ahora
    // se registra como lista_espera y la profe decide.
    let result;
    if (existing.length > 0) {
      // Re-postulación tras cancelada/rechazada: reactivar la misma fila
      [result] = await db.query(
        'UPDATE postulaciones SET estado = ?, respondida_en = NULL, postulada_en = NOW() WHERE id = ?',
        [status, existing[0].id]
      );
    } else {
      [result] = await db.query(
        'INSERT INTO postulaciones (alumno_id, instancia_id, estado) VALUES (?, ?, ?)',
        [req.user.id, req.params.id, status]
      );
    }

    const message = status === 'lista_espera'
      ? 'El cupo está lleno. Quedaste en lista de espera.'
      : 'Postulación enviada exitosamente';

    res.json({ message, status, id: result.insertId || existing[0].id });
  } catch (err) {
    console.error('Error postulando a clase abierta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar postulaciones (candidatos) de una clase abierta — admin/profesor
router.get('/open/:id/candidates', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id as postulation_id, p.estado as status, p.postulada_en as posted_at,
              a.id as student_id, a.nombre_completo as full_name, a.email, a.telefono as phone,
              a.nivel as level,
              (SELECT COALESCE(SUM(d.monto - d.monto_pagado), 0) FROM deudas d
               WHERE d.alumno_id = a.id AND d.estado IN ('pendiente', 'parcial')) as balance,
              a.saldo_a_favor as balance_favor
       FROM postulaciones p
       JOIN perfiles a ON p.alumno_id = a.id
       WHERE p.instancia_id = ?
       ORDER BY p.postulada_en ASC`,
      [req.params.id]
    );
    res.json({ candidates: rows });
  } catch (err) {
    console.error('Error listando candidatos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Aceptar postulación — el alumno ocupa cupo automáticamente (al grupo de la instancia)
router.post('/open/:id/candidates/:postulationId/accept', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [postRows] = await connection.query(
      'SELECT alumno_id, estado FROM postulaciones WHERE id = ? AND instancia_id = ?',
      [req.params.postulationId, req.params.id]
    );
    if (postRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Postulación no encontrada' });
    }
    const { alumno_id, estado } = postRows[0];
    if (estado !== 'pendiente') {
      await connection.rollback();
      return res.status(400).json({ error: `La postulación ya fue respondida (${estado})` });
    }

    // Verificar cupo disponible antes de aceptar
    const [instRows] = await connection.query(
      'SELECT cupo_maximo FROM instancias_clases WHERE id = ?',
      [req.params.id]
    );
    const [enrolledCount] = await connection.query(
      `SELECT COUNT(*) as total FROM grupo_alumnos ga JOIN grupos g ON ga.grupo_id = g.id
       WHERE g.instancia_id = ?`,
      [req.params.id]
    );
    const room = Number(instRows[0].cupo_maximo) - Number(enrolledCount[0].total);

    // Crear o reutilizar el grupo de la instancia
    const [groups] = await connection.query('SELECT id FROM grupos WHERE instancia_id = ? LIMIT 1', [req.params.id]);
    let groupId;
    if (groups.length === 0) {
      const [gRes] = await connection.query('INSERT INTO grupos (instancia_id, nombre) VALUES (?, ?)', [req.params.id, 'Grupo Abierto']);
      groupId = gRes.insertId;
    } else {
      groupId = groups[0].id;
    }

    if (room <= 0) {
      // Sin cupo: pasa a lista de espera
      await connection.query('UPDATE postulaciones SET estado = \'lista_espera\', respondida_en = NOW() WHERE id = ?', [req.params.postulationId]);
      await connection.commit();
      return res.json({ message: 'No hay cupo disponible. Postulación pasó a lista de espera.', waitlisted: true });
    }

    // Aceptada → ocupa cupo
    await connection.query('INSERT IGNORE INTO grupo_alumnos (grupo_id, alumno_id) VALUES (?, ?)', [groupId, alumno_id]);
    await connection.query('UPDATE postulaciones SET estado = \'aceptada\', respondida_en = NOW() WHERE id = ?', [req.params.postulationId]);

    await connection.commit();
    res.json({ message: 'Candidato aceptado y ocupa cupo', enrolled: true });
  } catch (err) {
    await connection.rollback();
    console.error('Error aceptando candidato:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Rechazar postulación → pasa a lista de espera
router.post('/open/:id/candidates/:postulationId/reject', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [postRows] = await db.query(
      'SELECT estado FROM postulaciones WHERE id = ? AND instancia_id = ?',
      [req.params.postulationId, req.params.id]
    );
    if (postRows.length === 0) {
      return res.status(404).json({ error: 'Postulación no encontrada' });
    }
    if (postRows[0].estado !== 'pendiente') {
      return res.status(400).json({ error: `La postulación ya fue respondida (${postRows[0].estado})` });
    }

    await db.query(
      'UPDATE postulaciones SET estado = \'lista_espera\', respondida_en = NOW() WHERE id = ?',
      [req.params.postulationId]
    );
    res.json({ message: 'Candidato rechazado. Quedó en lista de espera.' });
  } catch (err) {
    console.error('Error rechazando candidato:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Aceptar con override (forzar a pesar de deuda o cupo)
router.post('/open/:id/candidates/:postulationId/override', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [postRows] = await connection.query(
      'SELECT alumno_id, estado FROM postulaciones WHERE id = ? AND instancia_id = ?',
      [req.params.postulationId, req.params.id]
    );
    if (postRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Postulación no encontrada' });
    }
    const { alumno_id, estado } = postRows[0];
    if (estado !== 'pendiente' && estado !== 'lista_espera') {
      await connection.rollback();
      return res.status(400).json({ error: `La postulación ya fue respondida (${estado})` });
    }

    const [groups] = await connection.query('SELECT id FROM grupos WHERE instancia_id = ? LIMIT 1', [req.params.id]);
    let groupId;
    if (groups.length === 0) {
      const [gRes] = await connection.query('INSERT INTO grupos (instancia_id, nombre) VALUES (?, ?)', [req.params.id, 'Grupo Abierto']);
      groupId = gRes.insertId;
    } else {
      groupId = groups[0].id;
    }

    // Ocupa cupo igual (puede sobrepasar cupo si la profe lo decide)
    await connection.query('INSERT IGNORE INTO grupo_alumnos (grupo_id, alumno_id) VALUES (?, ?)', [groupId, alumno_id]);
    await connection.query('UPDATE postulaciones SET estado = \'aceptada\', respondida_en = NOW() WHERE id = ?', [req.params.postulationId]);

    await connection.commit();
    res.json({ message: 'Candidato aceptado por excepción (override)', enrolled: true });
  } catch (err) {
    await connection.rollback();
    console.error('Error en override de candidato:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Cancelar postulación (alumno) — solo si está pendiente
router.delete('/open/:id/postulate', authenticateToken, authorizeRoles('alumno'), async (req, res) => {
  try {
    const [postRows] = await db.query(
      'SELECT id, estado FROM postulaciones WHERE alumno_id = ? AND instancia_id = ?',
      [req.user.id, req.params.id]
    );
    if (postRows.length === 0) {
      return res.status(404).json({ error: 'No tenés una postulación para esta clase' });
    }
    if (postRows[0].estado !== 'pendiente') {
      return res.status(400).json({ error: `Solo podés cancelar una postulación pendiente (estado actual: ${postRows[0].estado})` });
    }

    await db.query('UPDATE postulaciones SET estado = \'cancelada\', respondida_en = NOW() WHERE id = ?', [postRows[0].id]);
    res.json({ message: 'Postulación cancelada' });
  } catch (err) {
    console.error('Error cancelando postulación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear una clase abierta (ad-hoc) o extra (modalidad)
router.post('/open', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { fecha, hora_inicio, hora_fin, nivel, cupo_maximo, precio, profesor_id } = req.body;
  const modalidad = req.body.modalidad || 'abierta';
  const profesorElegido = profesor_id || req.user.id;

  if (!fecha || !hora_inicio || !hora_fin || !nivel || !cupo_maximo || !precio) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!['abierta', 'extra'].includes(modalidad)) {
    return res.status(400).json({ error: 'Modalidad inválida. Valores válidos: abierta, extra' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener día de la semana (0=Lunes, ..., 6=Domingo)
    const dateObj = new Date(`${fecha}T12:00:00`);
    const dayOfWeek = (dateObj.getDay() + 6) % 7;

    // 1. Crear plantilla inactiva de respaldo para satisfacer RIF de FK
    const [tRes] = await connection.query(
      `INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, activa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [profesorElegido, dayOfWeek, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio]
    );

    const templateId = tRes.insertId;

    // 2. Crear la instancia de clase abierta vinculada
    const [iRes] = await connection.query(
      `INSERT INTO instancias_clases (plantilla_id, profesor_id, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada')`,
      [templateId, profesorElegido, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio]
    );

    const instanceId = iRes.insertId;

    // 3. Crear grupo por defecto de la clase abierta
    await connection.query(
      `INSERT INTO grupos (instancia_id, nombre) VALUES (?, ?)`,
      [instanceId, modalidad === 'extra' ? 'Grupo Extra' : 'Grupo Abierto']
    );

    await connection.commit();
    res.status(201).json({ message: 'Clase creada exitosamente', id: instanceId, modalidad });
  } catch (err) {
    await connection.rollback();
    console.error('Error creando clase ad-hoc:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Editar clase abierta (ad-hoc)
router.put('/open/:id', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { fecha, hora_inicio, hora_fin, nivel, cupo_maximo, precio, status } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener la instancia
    const [insts] = await connection.query(
      "SELECT plantilla_id FROM instancias_clases WHERE id = ? AND modalidad IN ('abierta', 'extra')",
      [req.params.id]
    );

    if (insts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const { plantilla_id } = insts[0];

    // Actualizar la instancia
    await connection.query(
      `UPDATE instancias_clases SET 
       fecha = COALESCE(?, fecha),
       hora_inicio = COALESCE(?, hora_inicio),
       hora_fin = COALESCE(?, hora_fin),
       nivel = COALESCE(?, nivel),
       cupo_maximo = COALESCE(?, cupo_maximo),
       precio = COALESCE(?, precio),
       estado = COALESCE(?, estado)
       WHERE id = ?`,
      [fecha, hora_inicio, hora_fin, nivel, cupo_maximo, precio, status, req.params.id]
    );

    // Actualizar plantilla de respaldo
    let dayOfWeek = null;
    if (fecha) {
      const dateObj = new Date(`${fecha}T12:00:00`);
      dayOfWeek = (dateObj.getDay() + 6) % 7;
    }

    await connection.query(
      `UPDATE plantillas_clases SET
       dia_semana = COALESCE(?, dia_semana),
       hora_inicio = COALESCE(?, hora_inicio),
       hora_fin = COALESCE(?, hora_fin),
       nivel = COALESCE(?, nivel),
       cupo_maximo = COALESCE(?, cupo_maximo),
       precio_por_clase = COALESCE(?, precio_por_clase)
       WHERE id = ?`,
      [dayOfWeek, hora_inicio, hora_fin, nivel, cupo_maximo, precio, plantilla_id]
    );

    await connection.commit();
    res.json({ message: 'Clase abierta actualizada exitosamente' });
  } catch (err) {
    await connection.rollback();
    console.error('Error actualizando clase abierta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Eliminar clase abierta/extra (ad-hoc)
router.delete('/open/:id', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [insts] = await db.query(
      "SELECT plantilla_id FROM instancias_clases WHERE id = ? AND modalidad IN ('abierta', 'extra')",
      [req.params.id]
    );

    if (insts.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const { plantilla_id } = insts[0];

    // Al eliminar la plantilla de respaldo, se elimina la instancia en cascada automáticamente (gracias al ON DELETE CASCADE)
    await db.query('DELETE FROM plantillas_clases WHERE id = ?', [plantilla_id]);

    res.json({ message: 'Clase eliminada exitosamente' });
  } catch (err) {
    console.error('Error eliminando clase abierta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
