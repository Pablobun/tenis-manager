const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateInstancesForMonth, cancelFutureInstances, reactivateFutureInstances } = require('../services/instances');

const router = express.Router();

// Reemplaza el roster (alumnos por defecto) de una plantilla — item 8
async function replaceRoster(connection, templateId, studentIds) {
  await connection.query('DELETE FROM plantilla_alumnos WHERE plantilla_id = ?', [templateId]);
  for (const alumnoId of studentIds) {
    await connection.query(
      'INSERT IGNORE INTO plantilla_alumnos (plantilla_id, alumno_id) VALUES (?, ?)',
      [templateId, alumnoId]
    );
  }
}

// Listar plantillas
router.get('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.id, t.profesor_id, p.nombre_completo as professor_name, t.dia_semana as day_of_week,
              t.hora_inicio as start_hour, t.hora_fin as end_hour, t.nivel as level, t.modalidad as modality,
              t.cupo_maximo as max_students, t.precio_por_clase as price_per_class, t.frecuencia as frequency,
              t.activa as is_active, t.creado_en as created_at
       FROM plantillas_clases t
       JOIN perfiles p ON t.profesor_id = p.id
       ORDER BY t.dia_semana, t.hora_inicio`
    );

    // Item 8: adjuntar roster (alumnos por defecto) de cada plantilla
    const ids = rows.map((r) => r.id);
    const rosterByTemplate = {};
    if (ids.length > 0) {
      const [roster] = await db.query(
        `SELECT pa.plantilla_id, pa.alumno_id as id, p.nombre_completo as full_name
         FROM plantilla_alumnos pa
         JOIN perfiles p ON pa.alumno_id = p.id
         WHERE pa.plantilla_id IN (${ids.map(() => '?').join(',')})
         ORDER BY p.nombre_completo`,
        ids
      );
      for (const r of roster) {
        if (!rosterByTemplate[r.plantilla_id]) rosterByTemplate[r.plantilla_id] = [];
        rosterByTemplate[r.plantilla_id].push({ id: r.id, full_name: r.full_name });
      }
    }
    const withRoster = rows.map((r) => ({ ...r, students: rosterByTemplate[r.id] || [] }));

    res.json(withRoster);
  } catch (err) {
    console.error('Error listando plantillas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear plantilla — item 6: profesor_id del body (default quien crea). item 14: include_past.
router.post('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency, profesor_id, include_past, student_ids } = req.body;

  if (day_of_week === undefined || !start_hour || !end_hour || !modality || !price_per_class) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const MODALITIES = ['fija', 'extra', 'abierta'];
  if (!MODALITIES.includes(modality)) {
    return res.status(400).json({ error: `Modalidad inválida. Valores válidos: ${MODALITIES.join(', ')}` });
  }

  if (day_of_week < 0 || day_of_week > 6) {
    return res.status(400).json({ error: 'day_of_week debe estar entre 0 y 6' });
  }

  if (start_hour >= end_hour) {
    return res.status(400).json({ error: 'hora_inicio debe ser anterior a hora_fin' });
  }

  try {
    // Validar solapamiento de horarios el mismo día para plantillas activas
    const [existing] = await db.query(
      'SELECT id, hora_inicio, hora_fin FROM plantillas_clases WHERE dia_semana = ? AND activa = 1',
      [day_of_week]
    );

    for (const t of existing) {
      if (!(end_hour <= t.hora_inicio || start_hour >= t.hora_fin)) {
        return res.status(409).json({ error: `Conflicto de horario con otra plantilla activa (${t.hora_inicio} - ${t.hora_fin})` });
      }
    }

    const profesorElegido = profesor_id || req.user.id;

    const [result] = await db.query(
      `INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, frecuencia, activa) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        profesorElegido,
        day_of_week,
        start_hour,
        end_hour,
        level || null,
        modality,
        max_students || 4,
        price_per_class,
        frequency || 1
      ]
    );

    const templateId = result.insertId;

    // Item 8: roster de alumnos por defecto (se replica al generar instancias)
    if (Array.isArray(student_ids) && student_ids.length > 0) {
      await replaceRoster(db, templateId, student_ids);
    }

    // Generar instancias para el mes actual (item 14: puede excluir fechas pasadas)
    const currentMonth = new Date().toISOString().slice(0, 7);
    await generateInstancesForMonth(currentMonth, { includePast: include_past !== false });

    res.status(201).json({ message: 'Plantilla creada exitosamente', id: templateId });
  } catch (err) {
    console.error('Error creando plantilla:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar plantilla o activar/desactivar
router.put('/:id', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency, is_active, profesor_id, include_past, student_ids } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM plantillas_clases WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const current = rows[0];

    // Si se desactiva: la serie futura se ARCHIVA (desaparece del calendario, no factura)
    if (is_active !== undefined && is_active === 0 && current.activa === 1) {
      await db.query('UPDATE plantillas_clases SET activa = 0 WHERE id = ?', [req.params.id]);
      await cancelFutureInstances(req.params.id);
      return res.json({ message: 'Plantilla desactivada e instancias futuras archivadas' });
    }

    // Si se activa: la serie archivada vuelve a programada desde hoy en adelante
    // (todos los meses ya generados) + se completan los meses que falten (issue 15)
    if (is_active !== undefined && is_active === 1 && current.activa === 0) {
      await db.query('UPDATE plantillas_clases SET activa = 1 WHERE id = ?', [req.params.id]);
      const reactivated = await reactivateFutureInstances(req.params.id);
      const currentMonth = new Date().toISOString().slice(0, 7);
      await generateInstancesForMonth(currentMonth, { includePast: include_past !== false });
      return res.json({ message: `Plantilla activada. ${reactivated} instancias reactivadas` });
    }

    // Actualización de campos
    const newDay = day_of_week !== undefined ? day_of_week : current.dia_semana;
    const newStart = start_hour || current.hora_inicio;
    const newEnd = end_hour || current.hora_fin;
    const newProfesor = profesor_id || current.profesor_id;

    await db.query(
      `UPDATE plantillas_clases SET 
      profesor_id = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?, nivel = COALESCE(?, nivel), 
      modalidad = COALESCE(?, modalidad), cupo_maximo = COALESCE(?, cupo_maximo), 
      precio_por_clase = COALESCE(?, precio_por_clase), frecuencia = COALESCE(?, frecuencia) 
      WHERE id = ?`,
      [newProfesor, newDay, newStart, newEnd, level, modality, max_students, price_per_class, frequency, req.params.id]
    );

    // Item 8: reemplazar roster si vino student_ids (array, puede ser vacío)
    if (Array.isArray(student_ids)) {
      await replaceRoster(db, req.params.id, student_ids);
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    await generateInstancesForMonth(currentMonth, { includePast: include_past !== false });

    res.json({ message: 'Plantilla actualizada exitosamente' });
  } catch (err) {
    console.error('Error actualizando plantilla:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
