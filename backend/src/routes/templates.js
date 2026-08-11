const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { generateForTemplate, updateFutureInPlace, cancelFuture, regenFuture, currentMonth } = require('../services/instances');

const router = express.Router();

const DAYS = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo'
};

const MODALITIES = ['fixed', 'extra', 'open'];
const LEVELS = ['avanzado', 'intermedio', 'principiante'];

function validateTemplate(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.day_of_week !== undefined) {
    const day = body.day_of_week;
    if (day === undefined || day === null || day === '') {
      errors.push('El día de la semana es requerido');
    } else if (!Number.isInteger(Number(day)) || Number(day) < 0 || Number(day) > 6) {
      errors.push('El día de la semana debe ser un número entre 0 y 6');
    }
  }

  if (!partial || body.start_hour !== undefined || body.end_hour !== undefined) {
    const start = body.start_hour;
    const end = body.end_hour;
    if (!start || !end) {
      errors.push('La hora de inicio y fin son requeridas');
    } else if (start >= end) {
      errors.push('La hora de inicio debe ser anterior a la hora de fin');
    }
  }

  if (!partial || body.modality !== undefined) {
    if (!MODALITIES.includes(body.modality)) {
      errors.push('Modalidad inválida');
    }
  }

  if (!partial || body.level !== undefined) {
    if (body.level && !LEVELS.includes(body.level)) {
      errors.push('Nivel inválido');
    }
  }

  if (!partial || body.max_students !== undefined) {
    const cupo = Number(body.max_students);
    if (body.max_students === undefined || body.max_students === null || !Number.isInteger(cupo) || cupo < 1) {
      errors.push('El cupo debe ser un número entero mayor o igual a 1');
    }
  }

  if (!partial || body.price_per_class !== undefined) {
    const price = Number(body.price_per_class);
    if (body.price_per_class === undefined || body.price_per_class === null || !(price > 0)) {
      errors.push('El precio por clase debe ser mayor a 0');
    }
  }

  if (!partial || body.frequency !== undefined) {
    const frequency = Number(body.frequency);
    if (body.frequency === undefined || body.frequency === null || !Number.isInteger(frequency) || frequency < 1 || frequency > 7) {
      errors.push('La frecuencia debe ser un número entre 1 y 7');
    }
  }

  return errors;
}

async function hasOverlap(client, dayOfWeek, startHour, endHour, excludeId, modality) {
  const params = [dayOfWeek, modality || 'fixed', endHour, startHour];
  let excludeClause = '';

  if (excludeId) {
    excludeClause = 'AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await client.execute(
    `SELECT id FROM class_templates
     WHERE is_active = 1 AND day_of_week = ? AND modality = ?
       AND start_hour < ? AND ? < end_hour
       ${excludeClause}
     LIMIT 1`,
    params
  );

  return rows.length > 0;
}

// GET /api/templates — Listar plantillas (admin/profesora)
router.get('/', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, professor_id, day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency, is_active, created_at FROM class_templates ORDER BY day_of_week ASC, start_hour ASC'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al listar plantillas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/templates/:id — Ver plantilla específica (admin/profesora)
router.get('/:id', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, professor_id, day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency, is_active, created_at FROM class_templates WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al obtener plantilla:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/templates — Crear plantilla (admin/profesora)
router.post('/', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const { day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency } = req.body;

  const errors = validateTemplate({ day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const normalizedModality = modality || 'fixed';
    const overlapping = await hasOverlap(connection, day_of_week, start_hour, end_hour, null, normalizedModality);
    if (overlapping) {
      await connection.rollback();
      return res.status(409).json({ error: `Ya existe una plantilla activa con horario superpuesto ese día (${DAYS[day_of_week]})` });
    }

    const [result] = await connection.execute(
      'INSERT INTO class_templates (professor_id, day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [req.user.id, day_of_week, start_hour, end_hour, level || null, normalizedModality, max_students, price_per_class, frequency || 1]
    );

    const newTemplate = {
      id: result.insertId,
      professor_id: req.user.id,
      day_of_week,
      start_hour,
      end_hour,
      level: level || null,
      modality: normalizedModality,
      max_students,
      price_per_class,
      is_active: 1
    };

    if (normalizedModality === 'fixed') {
      await generateForTemplate(connection, newTemplate, currentMonth());
    }

    await connection.commit();

    res.status(201).json({
      message: 'Plantilla creada exitosamente',
      templateId: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear plantilla:', error);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    connection.release();
  }
});

// PUT /api/templates/:id — Editar/desactivar/activar plantilla (admin/profesora)
router.put('/:id', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const templateId = req.params.id;
  const { day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency, is_active } = req.body;

  try {
    const [existing] = await pool.execute(
      'SELECT * FROM class_templates WHERE id = ?',
      [templateId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const current = existing[0];

    const next = {
      day_of_week: day_of_week !== undefined ? day_of_week : current.day_of_week,
      start_hour: start_hour !== undefined ? start_hour : current.start_hour,
      end_hour: end_hour !== undefined ? end_hour : current.end_hour,
      level: level !== undefined ? level : current.level,
      modality: modality !== undefined ? modality : current.modality,
      max_students: max_students !== undefined ? max_students : current.max_students,
      price_per_class: price_per_class !== undefined ? price_per_class : current.price_per_class,
      frequency: frequency !== undefined ? frequency : current.frequency,
      is_active: is_active !== undefined ? is_active : current.is_active
    };

    const errors = validateTemplate(next);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. ') });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (Number(next.is_active) === 1) {
        const overlapping = await hasOverlap(connection, next.day_of_week, next.start_hour, next.end_hour, Number(templateId), next.modality);
        if (overlapping) {
          await connection.rollback();
          return res.status(409).json({ error: `Ya existe una plantilla activa con horario superpuesto ese día (${DAYS[next.day_of_week]})` });
        }
      }

      await connection.execute(
        `UPDATE class_templates SET
           day_of_week = ?, start_hour = ?, end_hour = ?, level = ?,
           modality = ?, max_students = ?, price_per_class = ?, frequency = ?, is_active = ?
         WHERE id = ?`,
        [next.day_of_week === null ? null : next.day_of_week, next.start_hour, next.end_hour, next.level || null, next.modality, next.max_students, next.price_per_class, next.frequency, next.is_active, templateId]
      );

      const dayChanged = Number(next.day_of_week) !== Number(current.day_of_week);
      const reactivated = Number(current.is_active) === 0 && Number(next.is_active) === 1;
      const deactivated = Number(current.is_active) === 1 && Number(next.is_active) === 0;

      if (next.modality === 'fixed' && Number(next.is_active) === 1) {
        if (reactivated || dayChanged) {
          await regenFuture(connection, { ...next, id: templateId, professor_id: current.professor_id }, currentMonth());
        } else {
          await updateFutureInPlace(connection, templateId, { ...next, level: next.level || null });
        }
      } else if (deactivated) {
        await cancelFuture(connection, templateId);
      }

      await connection.commit();

      res.status(200).json({ message: 'Plantilla actualizada exitosamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar plantilla:', error);
      res.status(500).json({ error: 'Error del servidor' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;