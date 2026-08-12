const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateInstancesForMonth, cancelFutureInstances } = require('../services/instances');

const router = express.Router();

// Listar plantillas
router.get('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, profesor_id, dia_semana as day_of_week, hora_inicio as start_hour, hora_fin as end_hour, nivel as level, modalidad as modality, cupo_maximo as max_students, precio_por_clase as price_per_class, frecuencia as frequency, activa as is_active, creado_en as created_at FROM plantillas_clases ORDER BY dia_semana, hora_inicio'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando plantillas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear plantilla
router.post('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency } = req.body;

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

    const [result] = await db.query(
      `INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, frecuencia, activa) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.user.id,
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

    // Generar instancias para el mes actual
    const currentMonth = new Date().toISOString().slice(0, 7);
    await generateInstancesForMonth(currentMonth);

    res.status(201).json({ message: 'Plantilla creada exitosamente', id: templateId });
  } catch (err) {
    console.error('Error creando plantilla:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar plantilla o activar/desactivar
router.put('/:id', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { day_of_week, start_hour, end_hour, level, modality, max_students, price_per_class, frequency, is_active } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM plantillas_clases WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const current = rows[0];

    // Si se desactiva
    if (is_active !== undefined && is_active === 0 && current.activa === 1) {
      await db.query('UPDATE plantillas_clases SET activa = 0 WHERE id = ?', [req.params.id]);
      await cancelFutureInstances(req.params.id);
      return res.json({ message: 'Plantilla desactivada e instancias futuras canceladas' });
    }

    // Si se activa
    if (is_active !== undefined && is_active === 1 && current.activa === 0) {
      await db.query('UPDATE plantillas_clases SET activa = 1 WHERE id = ?', [req.params.id]);
      const currentMonth = new Date().toISOString().slice(0, 7);
      await generateInstancesForMonth(currentMonth);
      return res.json({ message: 'Plantilla activada e instancias regeneradas' });
    }

    // Actualización de campos
    const newDay = day_of_week !== undefined ? day_of_week : current.dia_semana;
    const newStart = start_hour || current.hora_inicio;
    const newEnd = end_hour || current.hora_fin;

    await db.query(
      `UPDATE plantillas_clases SET 
      dia_semana = ?, hora_inicio = ?, hora_fin = ?, nivel = COALESCE(?, nivel), 
      modalidad = COALESCE(?, modalidad), cupo_maximo = COALESCE(?, cupo_maximo), 
      precio_por_clase = COALESCE(?, precio_por_clase), frecuencia = COALESCE(?, frecuencia) 
      WHERE id = ?`,
      [newDay, newStart, newEnd, level, modality, max_students, price_per_class, frequency, req.params.id]
    );

    const currentMonth = new Date().toISOString().slice(0, 7);
    await generateInstancesForMonth(currentMonth);

    res.json({ message: 'Plantilla actualizada exitosamente' });
  } catch (err) {
    console.error('Error actualizando plantilla:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
