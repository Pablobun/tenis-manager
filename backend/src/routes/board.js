const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

async function getInstancesWithStudents(instanceIds) {
  if (instanceIds.length === 0) return {};

  const placeholders = instanceIds.map(() => '?').join(',');
  const [groupsRows] = await pool.execute(
    `SELECT g.instance_id, g.id AS group_id
     FROM groups g
     WHERE g.instance_id IN (${placeholders})`,
    instanceIds
  );

  const groupIds = [...new Set(groupsRows.map((g) => g.group_id))];
  const byInstance = {};
  for (const g of groupsRows) {
    if (!byInstance[g.instance_id]) byInstance[g.instance_id] = [];
    byInstance[g.instance_id].push(g.group_id);
  }

  const studentsByInstance = {};
  for (const id of instanceIds) studentsByInstance[id] = [];

  if (groupIds.length > 0) {
    const groupPlaceholders = groupIds.map(() => '?').join(',');
    const [studentsRows] = await pool.execute(
      `SELECT gs.group_id, p.id AS student_id, p.full_name, p.level
       FROM group_students gs
       JOIN profiles p ON p.id = gs.student_id
       WHERE gs.group_id IN (${groupPlaceholders})
       ORDER BY p.full_name ASC`,
      groupIds
    );

    const groupsOfInstance = new Map();
    for (const id of instanceIds) groupsOfInstance.set(id, new Set(byInstance[id] || []));

    for (const row of studentsRows) {
      for (const [instanceId, groupSet] of groupsOfInstance) {
        if (groupSet.has(row.group_id)) {
          studentsByInstance[instanceId].push({
            id: row.student_id,
            full_name: row.full_name,
            level: row.level
          });
        }
      }
    }
  }

  return studentsByInstance;
}

// GET /api/board/day?date=YYYY-MM-DD — Instancias del día con sus alumnos
router.get('/day', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const { date } = req.query;

  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD' });
  }

  try {
    const [instances] = await pool.execute(
      `SELECT id, template_id, professor_id, instance_date, start_hour, end_hour,
              level, modality, max_students, price, status
       FROM class_instances
       WHERE instance_date = ?
       ORDER BY start_hour ASC`,
      [date]
    );

    const studentsByInstance = await getInstancesWithStudents(instances.map((i) => i.id));

    const result = instances.map((instance) => ({
      ...instance,
      students: studentsByInstance[instance.id] || []
    }));

    res.status(200).json({ date, instances: result });
  } catch (error) {
    console.error('Error al obtener tablero del día:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/board/week?date=YYYY-MM-DD — Los 7 días de la semana del día dado
router.get('/week', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const { date } = req.query;

  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD' });
  }

  try {
    const [y, m, d] = date.split('-').map(Number);
    const anchor = new Date(y, m - 1, d);
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));

    const week = [];
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      dates.push(dateStr);
      week.push({ date: dateStr, instances: [] });
    }

    const [instances] = await pool.execute(
      `SELECT id, template_id, professor_id, instance_date, start_hour, end_hour,
              level, modality, max_students, price, status
       FROM class_instances
       WHERE instance_date BETWEEN ? AND ?
       ORDER BY instance_date ASC, start_hour ASC`,
      [dates[0], dates[6]]
    );

    const studentsByInstance = await getInstancesWithStudents(instances.map((i) => i.id));

    const byDate = {};
    for (const instance of instances) {
      if (!byDate[instance.instance_date]) byDate[instance.instance_date] = [];
      byDate[instance.instance_date].push({
        ...instance,
        students: studentsByInstance[instance.id] || []
      });
    }

    for (const day of week) {
      day.instances = byDate[day.date] || [];
    }

    res.status(200).json({ week });
  } catch (error) {
    console.error('Error al obtener tablero semanal:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
