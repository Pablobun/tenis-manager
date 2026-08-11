const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateInstancesForMonth } = require('../services/instances');

const router = express.Router();

// Listar instancias por mes (?month=YYYY-MM)
router.get('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) {
    return res.status(400).json({ error: 'Parámetro month requerido (YYYY-MM)' });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, plantilla_id as template_id, profesor_id, fecha as instance_date, 
      hora_inicio as start_hour, hora_fin as end_hour, nivel, modalidad, 
      cupo_maximo as max_students, precio as price, estado as status 
      FROM instancias_clases 
      WHERE DATE_FORMAT(fecha, '%Y-%m') = ? 
      ORDER BY fecha, hora_inicio`,
      [month]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando instancias:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generar o regenerar instancias para un mes (?month=YYYY-MM)
router.post('/generate', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) {
    return res.status(400).json({ error: 'Parámetro month requerido (YYYY-MM)' });
  }

  try {
    const count = await generateInstancesForMonth(month);
    res.json({ message: `Generación completada. Se generaron ${count} nuevas instancias.`, count });
  } catch (err) {
    console.error('Error generando instancias:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
});

module.exports = router;
