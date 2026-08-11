const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { generateForTemplate, currentMonth } = require('../services/instances');

const router = express.Router();

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

// GET /api/instances?month=YYYY-MM — Listar instancias del mes (admin/profesora)
router.get('/', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const month = req.query.month || currentMonth();

  if (!MONTH_REGEX.test(month)) {
    return res.status(400).json({ error: 'El mes debe tener el formato YYYY-MM' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, template_id, professor_id, instance_date, start_hour, end_hour,
              level, modality, max_students, price, status, created_at
       FROM class_instances
       WHERE instance_date BETWEEN ? AND ?
       ORDER BY instance_date ASC, start_hour ASC`,
      [`${month}-01`, `${month}-31`]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al listar instancias:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/instances/generate?month=YYYY-MM — Regenerar un mes desde plantillas activas
router.post('/generate', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const month = req.query.month || currentMonth();

  if (!MONTH_REGEX.test(month)) {
    return res.status(400).json({ error: 'El mes debe tener el formato YYYY-MM' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [templates] = await connection.execute(
      'SELECT * FROM class_templates WHERE is_active = 1 AND modality = ?',
      ['fixed']
    );

    for (const template of templates) {
      await generateForTemplate(connection, template, month);
    }

    await connection.commit();

    res.status(200).json({ message: 'Instancias generadas exitosamente', count: templates.length });
  } catch (error) {
    await connection.rollback();
    console.error('Error al generar instancias:', error);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    connection.release();
  }
});

module.exports = router;
