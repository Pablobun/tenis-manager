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

// Listar todas las clases abiertas (disponibles para postularse)
router.get('/open', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT i.id, i.plantilla_id as template_id, i.profesor_id, i.fecha as instance_date, 
             i.hora_inicio as start_hour, i.hora_fin as end_hour, i.nivel as level, i.modalidad as modality, 
             i.cupo_maximo as max_students, i.precio as price, i.estado as status,
             p.nombre_completo as professor_name,
             (SELECT COUNT(*) FROM grupo_alumnos ga JOIN grupos g ON ga.grupo_id = g.id WHERE g.instancia_id = i.id) as enrolled_count,
             (SELECT estado FROM postulaciones WHERE alumno_id = ? AND instancia_id = i.id) as postulation_status
      FROM instancias_clases i
      JOIN perfiles p ON i.profesor_id = p.id
      WHERE i.modalidad = 'abierta'
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

    // Verificar si ya postuló
    const [existing] = await db.query(
      'SELECT id, estado FROM postulaciones WHERE alumno_id = ? AND instancia_id = ?',
      [req.user.id, req.params.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: `Ya tienes una postulación en estado: ${existing[0].estado}` });
    }

    await db.query(
      'INSERT INTO postulaciones (alumno_id, instancia_id, estado) VALUES (?, ?, \'pendiente\')',
      [req.user.id, req.params.id]
    );

    res.json({ message: 'Postulación enviada exitosamente' });
  } catch (err) {
    console.error('Error postulando a clase abierta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear una clase abierta (ad-hoc)
router.post('/open', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { fecha, hora_inicio, hora_fin, nivel, cupo_maximo, precio } = req.body;

  if (!fecha || !hora_inicio || !hora_fin || !nivel || !cupo_maximo || !precio) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
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
       VALUES (?, ?, ?, ?, ?, 'abierta', ?, ?, 0)`,
      [req.user.id, dayOfWeek, hora_inicio, hora_fin, nivel, cupo_maximo, precio]
    );

    const templateId = tRes.insertId;

    // 2. Crear la instancia de clase abierta vinculada
    const [iRes] = await connection.query(
      `INSERT INTO instancias_clases (plantilla_id, profesor_id, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'abierta', ?, ?, 'programada')`,
      [templateId, req.user.id, fecha, hora_inicio, hora_fin, nivel, cupo_maximo, precio]
    );

    const instanceId = iRes.insertId;

    // 3. Crear grupo por defecto de la clase abierta
    await connection.query(
      `INSERT INTO grupos (instancia_id, nombre) VALUES (?, 'Grupo Abierto')`,
      [instanceId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Clase abierta creada exitosamente', id: instanceId });
  } catch (err) {
    await connection.rollback();
    console.error('Error creando clase abierta:', err);
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
      'SELECT plantilla_id FROM instancias_clases WHERE id = ? AND modalidad = \'abierta\'',
      [req.params.id]
    );

    if (insts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Clase abierta no encontrada' });
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

// Eliminar clase abierta (ad-hoc)
router.delete('/open/:id', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [insts] = await db.query(
      'SELECT plantilla_id FROM instancias_clases WHERE id = ? AND modalidad = \'abierta\'',
      [req.params.id]
    );

    if (insts.length === 0) {
      return res.status(404).json({ error: 'Clase abierta no encontrada' });
    }

    const { plantilla_id } = insts[0];

    // Al eliminar la plantilla de respaldo, se elimina la instancia en cascada automáticamente (gracias al ON DELETE CASCADE)
    await db.query('DELETE FROM plantillas_clases WHERE id = ?', [plantilla_id]);

    res.json({ message: 'Clase abierta eliminada exitosamente' });
  } catch (err) {
    console.error('Error eliminando clase abierta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
