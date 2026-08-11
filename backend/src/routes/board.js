const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Helper para enriquecer instancias con sus alumnos
async function enrichInstancesWithStudents(instances) {
  if (instances.length === 0) return [];

  const instanceIds = instances.map((i) => i.id);
  const placeholders = instanceIds.map(() => '?').join(',');

  // Buscar grupos y alumnos para estas instancias
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

  return instances.map((inst) => ({
    id: inst.id,
    template_id: inst.template_id,
    instance_date: inst.instance_date,
    start_hour: inst.start_hour,
    end_hour: inst.end_hour,
    level: inst.level,
    modality: inst.modality,
    max_students: inst.max_students,
    price: inst.price,
    status: inst.status,
    students: studentsByInstance[inst.id] || []
  }));
}

// GET /board/day?date=YYYY-MM-DD
router.get('/day', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Parámetro date requerido (YYYY-MM-DD)' });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, plantilla_id as template_id, fecha as instance_date, 
      hora_inicio as start_hour, hora_fin as end_hour, nivel, modalidad, 
      cupo_maximo as max_students, precio, estado as status 
      FROM instancias_clases 
      WHERE fecha = ? 
      ORDER BY hora_inicio`,
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
      `SELECT id, plantilla_id as template_id, fecha as instance_date, 
      hora_inicio as start_hour, hora_fin as end_hour, nivel, modalidad, 
      cupo_maximo as max_students, precio, estado as status 
      FROM instancias_clases 
      WHERE fecha BETWEEN ? AND ? 
      ORDER BY fecha, hora_inicio`,
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

// Endpoint para inscripción / reasignación (Ticket 06 foundation)
router.post('/enroll', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { instance_id, student_id } = req.body;
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

    // Verificar cupo
    const [instRows] = await connection.query('SELECT cupo_maximo FROM instancias_clases WHERE id = ?', [instance_id]);
    const maxStudents = instRows[0].cupo_maximo;

    const [countRows] = await connection.query('SELECT COUNT(*) as total FROM grupo_alumnos WHERE grupo_id = ?', [groupId]);
    if (countRows[0].total >= maxStudents) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cupo máximo alcanzado para esta clase' });
    }

    await connection.query('INSERT IGNORE INTO grupo_alumnos (grupo_id, alumno_id) VALUES (?, ?)', [groupId, student_id]);
    await connection.commit();

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
    res.json({ message: 'Alumno removido de la clase exitosamente' });
  } catch (err) {
    console.error('Error removiendo alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
